/**
 * Publish Postman collection docs to Firestore.
 * Large payloads are split into Firestore subcollection chunks to avoid
 * the ~1 MB document size limit and Firebase Storage CORS issues.
 * Public docs: anyone can read. Private docs: only owner.
 */

import {
  getFirestoreDb,
  getFirebaseStorage,
} from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { ref, getBytes } from "firebase/storage";

const FIRESTORE_COLLECTION = "published_docs";
const CHUNKS_SUBCOLLECTION = "chunks";
const MAX_INLINE_SIZE = 800_000; // Store inline if JSON fits; chunk otherwise
const CHUNK_SIZE = 750_000; // Each chunk ≤ 750 KB (safe margin under 1 MB limit)

export type PublishVisibility = "public" | "private";

export interface PublishedDocMeta {
  id: string;
  ownerId: string;
  ownerEmail: string | null;
  name: string;
  description: string;
  visibility: PublishVisibility;
  /** @deprecated Legacy field — old docs stored large JSON in Firebase Storage */
  storagePath: string | null;
  /** Number of Firestore chunks (0 = inline JSON, >0 = read from subcollection) */
  chunkCount: number;
  endpointCount: number;
  folderCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublishedDoc extends PublishedDocMeta {
  /** Present if stored in Firestore (small docs) */
  collectionJson: string | null;
}

export interface PublishInput {
  name: string;
  description: string;
  visibility: PublishVisibility;
  collectionJson: string;
  endpointCount: number;
  folderCount: number;
}

function docToPublishedDoc(id: string, data: DocumentData): PublishedDocMeta {
  return {
    id,
    ownerId: data.ownerId ?? "",
    ownerEmail: data.ownerEmail ?? null,
    name: data.name ?? "",
    description: data.description ?? "",
    visibility: (data.visibility as PublishVisibility) ?? "private",
    storagePath: data.storagePath ?? null,
    chunkCount: data.chunkCount ?? 0,
    endpointCount: data.endpointCount ?? 0,
    folderCount: data.folderCount ?? 0,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

/** Split a string into chunks of at most `size` characters. */
function splitIntoChunks(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

/** Publish a collection. Returns the document ID. */
export async function publishDoc(
  userId: string,
  userEmail: string | null,
  input: PublishInput
): Promise<string> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Backend is not configured");

  const docRef = doc(collection(db, FIRESTORE_COLLECTION));
  const id = docRef.id;

  const needsChunking = input.collectionJson.length > MAX_INLINE_SIZE;

  const payload: DocumentData = {
    ownerId: userId,
    ownerEmail: userEmail ?? null,
    name: input.name,
    description: input.description,
    visibility: input.visibility,
    storagePath: null,
    chunkCount: 0,
    collectionJson: needsChunking ? null : input.collectionJson,
    endpointCount: input.endpointCount,
    folderCount: input.folderCount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (needsChunking) {
    const chunks = splitIntoChunks(input.collectionJson, CHUNK_SIZE);
    payload.chunkCount = chunks.length;

    // 1. Write the parent doc first so it exists in the database
    //    (Firestore rules `get()` reads pre-existing state, not batch state)
    await setDoc(docRef, payload);

    // 2. Then write all chunks — rules can now `get()` the parent doc
    const batch = writeBatch(db);
    for (let i = 0; i < chunks.length; i++) {
      const chunkRef = doc(
        collection(db, FIRESTORE_COLLECTION, id, CHUNKS_SUBCOLLECTION),
        String(i)
      );
      batch.set(chunkRef, { data: chunks[i], index: i });
    }
    await batch.commit();
  } else {
    await setDoc(docRef, payload);
  }

  return id;
}

/** Update an existing published doc metadata (only owner). */
export async function updatePublishedDoc(
  docId: string,
  userId: string,
  updates: { name?: string; description?: string; visibility?: PublishVisibility }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Backend is not configured");

  const docRef = doc(db, FIRESTORE_COLLECTION, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Document not found");
  if (snap.data()?.ownerId !== userId) throw new Error("Not authorized to update");

  await setDoc(
    docRef,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Update the content (JSON) of an existing published doc (only owner).
 *  Re-chunks and replaces the data while preserving the doc ID and metadata. */
export async function updatePublishedDocContent(
  docId: string,
  userId: string,
  input: {
    collectionJson: string;
    name?: string;
    description?: string;
    endpointCount?: number;
    folderCount?: number;
  }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Backend is not configured");

  const docRef = doc(db, FIRESTORE_COLLECTION, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Document not found");
  if (snap.data()?.ownerId !== userId) throw new Error("Not authorized to update");

  // Delete existing chunks first
  const oldChunkCount = snap.data()?.chunkCount ?? 0;
  if (oldChunkCount > 0) {
    const chunksBatch = writeBatch(db);
    for (let i = 0; i < oldChunkCount; i++) {
      const chunkRef = doc(
        collection(db, FIRESTORE_COLLECTION, docId, CHUNKS_SUBCOLLECTION),
        String(i)
      );
      chunksBatch.delete(chunkRef);
    }
    await chunksBatch.commit();
  }

  const needsChunking = input.collectionJson.length > MAX_INLINE_SIZE;

  const updates: Record<string, unknown> = {
    collectionJson: needsChunking ? null : input.collectionJson,
    chunkCount: 0,
    updatedAt: serverTimestamp(),
  };
  if (input.name) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.endpointCount !== undefined) updates.endpointCount = input.endpointCount;
  if (input.folderCount !== undefined) updates.folderCount = input.folderCount;

  if (needsChunking) {
    const chunks = splitIntoChunks(input.collectionJson, CHUNK_SIZE);
    updates.chunkCount = chunks.length;

    await setDoc(docRef, updates, { merge: true });

    const batch = writeBatch(db);
    for (let i = 0; i < chunks.length; i++) {
      const chunkRef = doc(
        collection(db, FIRESTORE_COLLECTION, docId, CHUNKS_SUBCOLLECTION),
        String(i)
      );
      batch.set(chunkRef, { data: chunks[i], index: i });
    }
    await batch.commit();
  } else {
    await setDoc(docRef, updates, { merge: true });
  }
}

/** Unpublish (delete) a doc. Only owner. */
export async function unpublishDoc(docId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Backend is not configured");

  const docRef = doc(db, FIRESTORE_COLLECTION, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Document not found");
  if (snap.data()?.ownerId !== userId) throw new Error("Not authorized to delete");

  await deleteDoc(docRef);
}

/** Get a single published doc by ID.
 *  - Public docs: anyone can read.
 *  - Private docs: any signed-in user can read (shareable link). */
export async function getPublishedDoc(
  docId: string,
  userId?: string | null
): Promise<PublishedDoc | null> {
  const db = getFirestoreDb();
  const storage = getFirebaseStorage();
  if (!db) return null;

  const docRef = doc(db, FIRESTORE_COLLECTION, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  const meta = docToPublishedDoc(snap.id, data);

  // Private docs require sign-in (any account); public docs are open to all
  if (data.visibility === "private" && !userId) {
    return null;
  }

  let collectionJson: string | null = data.collectionJson ?? null;

  // Read from Firestore chunks (new format)
  if (!collectionJson && (data.chunkCount ?? 0) > 0) {
    const chunksSnap = await getDocs(
      collection(db, FIRESTORE_COLLECTION, docId, CHUNKS_SUBCOLLECTION)
    );
    const sorted = chunksSnap.docs
      .map((d) => ({ index: d.data().index as number, data: d.data().data as string }))
      .sort((a, b) => a.index - b.index);
    collectionJson = sorted.map((c) => c.data).join("");
  }

  // Legacy fallback: read from Firebase Storage (requires CORS config on bucket)
  if (!collectionJson && data.storagePath && storage) {
    try {
      const storageRef = ref(storage, data.storagePath);
      const bytes = await getBytes(storageRef);
      collectionJson = new TextDecoder().decode(bytes);
    } catch (err) {
      console.warn(
        "Failed to read from Firebase Storage (likely CORS). " +
        "Run: gsutil cors set cors.json gs://<your-bucket> — see cors.json in project root.",
        err
      );
      throw new Error(
        "This doc could not be loaded. Please re-publish the doc or check storage configuration."
      );
    }
  }

  return {
    ...meta,
    collectionJson,
  };
}

/** List docs owned by the user. */
export async function listMyPublishedDocs(userId: string): Promise<PublishedDocMeta[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  const q = query(
    collection(db, FIRESTORE_COLLECTION),
    where("ownerId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToPublishedDoc(d.id, d.data()));
}

/** List public docs (for explore). */
export async function listPublicPublishedDocs(limit = 50): Promise<PublishedDocMeta[]> {
  const db = getFirestoreDb();
  if (!db) return [];

  const q = query(
    collection(db, FIRESTORE_COLLECTION),
    where("visibility", "==", "public"),
    orderBy("updatedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.slice(0, limit).map((d) => docToPublishedDoc(d.id, d.data()));
}

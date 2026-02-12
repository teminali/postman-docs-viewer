/**
 * Publish Postman collection docs to Firestore (and Storage for large payloads).
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
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

const FIRESTORE_COLLECTION = "published_docs";
const STORAGE_PREFIX = "published_docs";
const MAX_DOC_SIZE = 800000; // Firestore limit ~1MB; use Storage if larger

export type PublishVisibility = "public" | "private";

export interface PublishedDocMeta {
  id: string;
  ownerId: string;
  ownerEmail: string | null;
  name: string;
  description: string;
  visibility: PublishVisibility;
  /** If set, full JSON is in Storage at this path */
  storagePath: string | null;
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
    endpointCount: data.endpointCount ?? 0,
    folderCount: data.folderCount ?? 0,
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  };
}

/** Publish a collection. Returns the document ID. */
export async function publishDoc(
  userId: string,
  userEmail: string | null,
  input: PublishInput
): Promise<string> {
  const db = getFirestoreDb();
  const storage = getFirebaseStorage();
  if (!db) throw new Error("Firestore is not configured");

  const docRef = doc(collection(db, FIRESTORE_COLLECTION));
  const id = docRef.id;

  const useStorage = input.collectionJson.length > MAX_DOC_SIZE;
  let storagePath: string | null = null;

  if (useStorage && storage) {
    storagePath = `${STORAGE_PREFIX}/${id}/collection.json`;
    const storageRef = ref(storage, storagePath);
    await uploadString(storageRef, input.collectionJson, "raw");
  }

  const payload: DocumentData = {
    ownerId: userId,
    ownerEmail: userEmail ?? null,
    name: input.name,
    description: input.description,
    visibility: input.visibility,
    storagePath,
    collectionJson: useStorage ? null : input.collectionJson,
    endpointCount: input.endpointCount,
    folderCount: input.folderCount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);
  return id;
}

/** Update an existing published doc (only owner). */
export async function updatePublishedDoc(
  docId: string,
  userId: string,
  updates: { name?: string; description?: string; visibility?: PublishVisibility }
): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not configured");

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

/** Unpublish (delete) a doc. Only owner. */
export async function unpublishDoc(docId: string, userId: string): Promise<void> {
  const db = getFirestoreDb();
  if (!db) throw new Error("Firestore is not configured");

  const docRef = doc(db, FIRESTORE_COLLECTION, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Document not found");
  if (snap.data()?.ownerId !== userId) throw new Error("Not authorized to delete");

  await deleteDoc(docRef);
}

/** Get a single published doc by ID. For public docs anyone can read; for private only owner. */
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

  if (data.visibility === "private" && data.ownerId !== userId) {
    return null;
  }

  let collectionJson: string | null = data.collectionJson ?? null;
  if (!collectionJson && data.storagePath && storage) {
    const storageRef = ref(storage, data.storagePath);
    const url = await getDownloadURL(storageRef);
    const res = await fetch(url);
    collectionJson = await res.text();
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

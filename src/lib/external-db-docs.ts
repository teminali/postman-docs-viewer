/**
 * Read/write Postman collection docs against the user's external Firestore.
 * Uses the same chunking strategy as published-docs.ts but targets the
 * external Firestore instance (user's own database).
 */

import { getExternalFirestore, getExternalCollectionName } from "@/lib/external-db-settings";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  orderBy,
  query,
  limit as firestoreLimit,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";

const CHUNKS_SUBCOLLECTION = "chunks";
const MAX_INLINE_SIZE = 800_000;
const CHUNK_SIZE = 750_000;

// ─── Types ──────────────────────────────────────────────────────────

export interface ExternalDocMeta {
  id: string;
  name: string;
  description: string;
  chunkCount: number;
  endpointCount: number;
  folderCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ExternalDoc extends ExternalDocMeta {
  collectionJson: string | null;
}

export interface ExternalPublishInput {
  name: string;
  description: string;
  collectionJson: string;
  endpointCount: number;
  folderCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────

function docToMeta(id: string, data: DocumentData): ExternalDocMeta {
  return {
    id,
    name: data.name ?? "",
    description: data.description ?? "",
    chunkCount: data.chunkCount ?? 0,
    endpointCount: data.endpointCount ?? 0,
    folderCount: data.folderCount ?? 0,
    createdAt: (data.createdAt as Timestamp) ?? null,
    updatedAt: (data.updatedAt as Timestamp) ?? null,
  };
}

function splitIntoChunks(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

// ─── CRUD ───────────────────────────────────────────────────────────

/** List all docs in the external database (newest first). */
export async function listExternalDocs(max = 100): Promise<ExternalDocMeta[]> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  const colName = getExternalCollectionName();

  // Try ordered query first; fall back to unordered if the user's docs
  // don't have an `updatedAt` field or are missing an index.
  try {
    const q = query(
      collection(db, colName),
      orderBy("updatedAt", "desc"),
      firestoreLimit(max)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return snapshot.docs.map((d) => docToMeta(d.id, d.data()));
    }
  } catch {
    // orderBy failed (missing index or field) — fall through to unordered
  }

  // Fallback: fetch without ordering
  const q = query(collection(db, colName), firestoreLimit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => docToMeta(d.id, d.data()));
}

/** Get a single doc including its collection JSON. */
export async function getExternalDoc(docId: string): Promise<ExternalDoc | null> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  const colName = getExternalCollectionName();
  const docRef = doc(db, colName, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  const meta = docToMeta(snap.id, data);

  let collectionJson: string | null = data.collectionJson ?? null;

  // Read from chunks if needed
  if (!collectionJson && (data.chunkCount ?? 0) > 0) {
    const chunksSnap = await getDocs(
      collection(db, colName, docId, CHUNKS_SUBCOLLECTION)
    );
    const sorted = chunksSnap.docs
      .map((d) => ({ index: d.data().index as number, data: d.data().data as string }))
      .sort((a, b) => a.index - b.index);
    collectionJson = sorted.map((c) => c.data).join("");
  }

  return { ...meta, collectionJson };
}

/** Publish a collection to the external database. Returns the document ID. */
export async function publishToExternalDb(
  input: ExternalPublishInput
): Promise<string> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  const colName = getExternalCollectionName();
  const docRef = doc(collection(db, colName));
  const id = docRef.id;

  const needsChunking = input.collectionJson.length > MAX_INLINE_SIZE;

  const payload: DocumentData = {
    name: input.name,
    description: input.description,
    collectionJson: needsChunking ? null : input.collectionJson,
    chunkCount: 0,
    endpointCount: input.endpointCount,
    folderCount: input.folderCount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (needsChunking) {
    const chunks = splitIntoChunks(input.collectionJson, CHUNK_SIZE);
    payload.chunkCount = chunks.length;

    // Write parent doc first
    await setDoc(docRef, payload);

    // Write chunks
    const batch = writeBatch(db);
    for (let i = 0; i < chunks.length; i++) {
      const chunkRef = doc(
        collection(db, colName, id, CHUNKS_SUBCOLLECTION),
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

/** Delete a doc from the external database. */
export async function deleteExternalDoc(docId: string): Promise<void> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  const colName = getExternalCollectionName();
  const docRef = doc(db, colName, docId);
  await deleteDoc(docRef);
}

/**
 * Test connectivity to the external database.
 * Attempts a simple read; throws with a descriptive message on failure.
 */
export async function testExternalConnection(): Promise<void> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  // Try to read the collection (even if empty, this tests connectivity & permissions)
  const colName = getExternalCollectionName();
  const q = query(collection(db, colName), firestoreLimit(1));
  await getDocs(q);
}

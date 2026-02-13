/**
 * Firestore Data Explorer — CRUD operations against the user's external Firestore.
 * All operations go directly from the browser to the user's database.
 */

import { getExternalFirestore } from "@/lib/external-db-settings";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  limit,
  orderBy,
  where,
  getCountFromServer,
  type DocumentData,
  type WhereFilterOp,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  DocumentReference,
} from "firebase/firestore";

// ─── Types ──────────────────────────────────────────────────────────

export interface ExplorerDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: string;
}

export type SortDirection = "asc" | "desc";

export const SUPPORTED_OPERATORS: { value: WhereFilterOp; label: string }[] = [
  { value: "==", label: "equals (==)" },
  { value: "!=", label: "not equals (!=)" },
  { value: "<", label: "less than (<)" },
  { value: "<=", label: "less or equal (<=)" },
  { value: ">", label: "greater than (>)" },
  { value: ">=", label: "greater or equal (>=)" },
  { value: "array-contains", label: "array contains" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function getDb() {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");
  return db;
}

/** Serialize a Firestore value for display. */
export function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Timestamp) return { _type: "Timestamp", value: value.toDate().toISOString() };
  if (value instanceof GeoPoint) return { _type: "GeoPoint", latitude: value.latitude, longitude: value.longitude };
  if (value instanceof DocumentReference) return { _type: "Reference", path: value.path };
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Timestamp-like
    if ("seconds" in obj && "nanoseconds" in obj) {
      return { _type: "Timestamp", value: new Date((obj.seconds as number) * 1000).toISOString() };
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = serializeValue(v);
    }
    return result;
  }
  return String(value);
}

/** Serialize an entire document for display. */
function serializeDoc(data: DocumentData): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    result[k] = serializeValue(v);
  }
  return result;
}

/** Parse a user-typed value into a native type for queries. */
function parseQueryValue(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") return num;
  return trimmed;
}

// ─── Operations ─────────────────────────────────────────────────────

/** List documents with optional limit and ordering. */
export async function listDocuments(
  collectionPath: string,
  options: {
    limitCount?: number;
    orderByField?: string;
    direction?: SortDirection;
  } = {}
): Promise<ExplorerDocument[]> {
  const db = getDb();
  const { limitCount = 10, orderByField, direction = "desc" } = options;

  const constraints = [];
  if (orderByField) {
    constraints.push(orderBy(orderByField, direction));
  }
  constraints.push(limit(limitCount));

  const q = query(collection(db, collectionPath), ...constraints);

  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      data: serializeDoc(d.data()),
    }));
  } catch (err) {
    // If orderBy fails (missing index), try without ordering
    if (orderByField) {
      const fallbackQ = query(collection(db, collectionPath), limit(limitCount));
      const snapshot = await getDocs(fallbackQ);
      return snapshot.docs.map((d) => ({
        id: d.id,
        data: serializeDoc(d.data()),
      }));
    }
    throw err;
  }
}

/** Get a single document by ID. */
export async function getDocumentById(
  collectionPath: string,
  docId: string
): Promise<ExplorerDocument | null> {
  const db = getDb();
  const docRef = doc(db, collectionPath, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    data: serializeDoc(snap.data()),
  };
}

/** Create a new document. Returns the new document ID. */
export async function createDocument(
  collectionPath: string,
  data: Record<string, unknown>,
  customId?: string
): Promise<string> {
  const db = getDb();
  if (customId) {
    const docRef = doc(db, collectionPath, customId);
    await setDoc(docRef, {
      ...data,
      _createdAt: serverTimestamp(),
    });
    return customId;
  } else {
    const docRef = await addDoc(collection(db, collectionPath), {
      ...data,
      _createdAt: serverTimestamp(),
    });
    return docRef.id;
  }
}

/** Update fields on an existing document (merge). */
export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, {
    ...data,
    _updatedAt: serverTimestamp(),
  });
}

/** Delete a document by ID. */
export async function deleteDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const db = getDb();
  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

/** Query documents with a simple filter. */
export async function queryDocuments(
  collectionPath: string,
  filter: QueryFilter,
  limitCount = 10
): Promise<ExplorerDocument[]> {
  const db = getDb();
  const parsedValue = parseQueryValue(filter.value);

  const q = query(
    collection(db, collectionPath),
    where(filter.field, filter.operator, parsedValue),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    data: serializeDoc(d.data()),
  }));
}

/** Get an approximate count of documents in a collection. */
export async function countDocuments(
  collectionPath: string
): Promise<number> {
  const db = getDb();
  const coll = collection(db, collectionPath);
  const snapshot = await getCountFromServer(coll);
  return snapshot.data().count;
}

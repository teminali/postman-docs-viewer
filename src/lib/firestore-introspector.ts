/**
 * Connect to the user's external Firestore, read sample documents from
 * discovered collections, and infer field schemas.
 */

import { getExternalFirestore, getExternalDbConfig } from "@/lib/external-db-settings";
import {
  collection,
  getDocs,
  query,
  limit,
  Timestamp,
  GeoPoint,
  DocumentReference,
} from "firebase/firestore";
import { parseFirestoreIndexes, type ParsedIndexes } from "@/lib/firestore-indexes-parser";
import {
  parseFirestoreRules,
  getRulesForCollection,
  type ParsedRules,
} from "@/lib/firestore-rules-parser";
import type {
  FirestoreSchema,
  FirestoreCollectionSchema,
  FirestoreFieldSchema,
  FirestoreFieldType,
} from "@/types/firestore-schema";

const SAMPLE_SIZE = 20;

export interface IntrospectInput {
  indexesJson?: unknown;
  rulesText?: string;
  /** Additional collection names the user wants to scan */
  manualCollections?: string[];
}

export interface IntrospectProgress {
  phase: "parsing" | "scanning" | "done";
  current: number;
  total: number;
  currentCollection?: string;
}

/**
 * Introspect the external Firestore database.
 * Discovers collections from indexes/rules, reads sample docs, infers schemas.
 */
export async function introspectFirestore(
  input: IntrospectInput,
  onProgress?: (progress: IntrospectProgress) => void
): Promise<FirestoreSchema> {
  const db = getExternalFirestore();
  if (!db) throw new Error("External database is not connected");

  const config = getExternalDbConfig();
  const projectName = config?.projectId ?? "Unknown Project";

  // Phase 1: Parse inputs
  onProgress?.({ phase: "parsing", current: 0, total: 0 });

  let parsedIndexes: ParsedIndexes = {
    collectionNames: [],
    indexes: [],
    fieldOverrides: [],
  };

  let parsedRules: ParsedRules | null = null;

  if (input.indexesJson) {
    parsedIndexes = parseFirestoreIndexes(input.indexesJson);
  }

  if (input.rulesText) {
    parsedRules = parseFirestoreRules(input.rulesText);
  }

  // Merge all discovered collection names
  const collectionNames = new Set<string>();
  for (const name of parsedIndexes.collectionNames) collectionNames.add(name);
  if (parsedRules) {
    for (const name of parsedRules.collectionNames) collectionNames.add(name);
  }
  if (input.manualCollections) {
    for (const name of input.manualCollections) {
      if (name.trim()) collectionNames.add(name.trim());
    }
  }

  const collectionList = Array.from(collectionNames).sort();

  // Phase 2: Scan each collection
  const total = collectionList.length;
  const collections: FirestoreCollectionSchema[] = [];

  for (let i = 0; i < collectionList.length; i++) {
    const colName = collectionList[i];
    onProgress?.({
      phase: "scanning",
      current: i + 1,
      total,
      currentCollection: colName,
    });

    try {
      const schema = await scanCollection(db, colName, colName, parsedRules);
      collections.push(schema);
    } catch (err) {
      // If we can't read this collection (permissions, etc.), add it with 0 docs
      collections.push({
        name: colName,
        path: colName,
        fields: [],
        subcollections: [],
        sampleDocCount: 0,
        rules: parsedRules
          ? getRulesForCollection(parsedRules, colName) ?? undefined
          : undefined,
      });
      console.warn(`Could not scan collection "${colName}":`, err);
    }
  }

  onProgress?.({ phase: "done", current: total, total });

  return {
    projectName,
    collections,
    indexes: parsedIndexes.indexes,
    fieldOverrides: parsedIndexes.fieldOverrides,
    rawRules: input.rulesText ?? null,
    scannedAt: Date.now(),
  };
}

/**
 * Scan a single Firestore collection: read sample docs and infer the schema.
 */
async function scanCollection(
  db: ReturnType<typeof getExternalFirestore>,
  collectionPath: string,
  collectionName: string,
  parsedRules: ParsedRules | null
): Promise<FirestoreCollectionSchema> {
  if (!db) throw new Error("No Firestore instance");

  const q = query(collection(db, collectionPath), limit(SAMPLE_SIZE));
  const snapshot = await getDocs(q);

  const sampleDocCount = snapshot.docs.length;
  const allFieldMaps: Record<string, unknown>[] = [];

  for (const doc of snapshot.docs) {
    allFieldMaps.push(doc.data());
  }

  const fields = inferFieldSchemas(allFieldMaps, sampleDocCount);

  const rules = parsedRules
    ? getRulesForCollection(parsedRules, collectionName) ?? undefined
    : undefined;

  // Note: we can't discover subcollections from the client SDK.
  // They will be populated from the rules/indexes parser data if available.
  // We try to find subcollection names from parsed rules.
  const subcollections: FirestoreCollectionSchema[] = [];
  if (parsedRules) {
    const subNames = findSubcollectionNames(parsedRules, collectionName);
    for (const subName of subNames) {
      // To scan subcollections, we need a specific document ID.
      // We'll try using the first document we found.
      if (snapshot.docs.length > 0) {
        const parentDocId = snapshot.docs[0].id;
        const subPath = `${collectionPath}/${parentDocId}/${subName}`;
        try {
          const subSchema = await scanCollection(
            db,
            subPath,
            subName,
            parsedRules
          );
          subSchema.path = `${collectionPath}/{docId}/${subName}`;
          subcollections.push(subSchema);
        } catch {
          subcollections.push({
            name: subName,
            path: `${collectionPath}/{docId}/${subName}`,
            fields: [],
            subcollections: [],
            sampleDocCount: 0,
            rules: getRulesForCollection(parsedRules, subName) ?? undefined,
          });
        }
      } else {
        subcollections.push({
          name: subName,
          path: `${collectionPath}/{docId}/${subName}`,
          fields: [],
          subcollections: [],
          sampleDocCount: 0,
          rules: getRulesForCollection(parsedRules, subName) ?? undefined,
        });
      }
    }
  }

  return {
    name: collectionName,
    path: collectionPath,
    fields,
    subcollections,
    sampleDocCount,
    rules,
  };
}

/**
 * Find subcollection names for a given collection from parsed rules.
 */
function findSubcollectionNames(
  parsed: ParsedRules,
  parentCollectionName: string
): string[] {
  const subNames: string[] = [];

  function search(nodes: ParsedRuleNode[]): void {
    for (const node of nodes) {
      if (node.collectionName === parentCollectionName) {
        for (const child of node.children) {
          subNames.push(child.collectionName);
        }
      }
      search(node.children);
    }
  }

  // Import inline type to avoid circular
  type ParsedRuleNode = typeof parsed.collections[number];
  search(parsed.collections);
  return [...new Set(subNames)];
}

/**
 * Infer field schemas from an array of document data maps.
 */
function inferFieldSchemas(
  docs: Record<string, unknown>[],
  sampleSize: number
): FirestoreFieldSchema[] {
  if (docs.length === 0) return [];

  const fieldMap = new Map<
    string,
    { type: FirestoreFieldType; count: number; samples: unknown[]; nested: Record<string, unknown>[] }
  >();

  for (const doc of docs) {
    for (const [key, value] of Object.entries(doc)) {
      const type = inferType(value);

      if (!fieldMap.has(key)) {
        fieldMap.set(key, { type, count: 0, samples: [], nested: [] });
      }

      const entry = fieldMap.get(key)!;
      entry.count++;

      // Keep up to 3 sample values
      if (entry.samples.length < 3) {
        entry.samples.push(simplifyValue(value));
      }

      // Collect nested map values for recursive inference
      if (type === "map" && typeof value === "object" && value !== null) {
        entry.nested.push(value as Record<string, unknown>);
      }
    }
  }

  const fields: FirestoreFieldSchema[] = [];

  for (const [name, entry] of fieldMap) {
    const field: FirestoreFieldSchema = {
      name,
      type: entry.type,
      frequency: entry.count,
      sampleSize,
      sampleValues: entry.samples,
    };

    // Recursively infer nested fields for maps
    if (entry.type === "map" && entry.nested.length > 0) {
      field.nestedFields = inferFieldSchemas(entry.nested, entry.nested.length);
    }

    fields.push(field);
  }

  // Sort: required fields first (higher frequency), then alphabetically
  fields.sort((a, b) => {
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return a.name.localeCompare(b.name);
  });

  return fields;
}

/**
 * Infer the Firestore field type from a JavaScript value.
 */
function inferType(value: unknown): FirestoreFieldType {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value instanceof Timestamp) return "timestamp";
  if (value instanceof GeoPoint) return "geopoint";
  if (value instanceof DocumentReference) return "reference";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") {
    // Check for Firestore Timestamp-like objects (seconds + nanoseconds)
    const obj = value as Record<string, unknown>;
    if ("seconds" in obj && "nanoseconds" in obj) return "timestamp";
    return "map";
  }
  return "unknown";
}

/**
 * Simplify a Firestore value for sample display.
 */
function simplifyValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return value.length > 80 ? value.slice(0, 80) + "..." : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof GeoPoint) return `GeoPoint(${value.latitude}, ${value.longitude})`;
  if (value instanceof DocumentReference) return value.path;
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("seconds" in obj && "nanoseconds" in obj) {
      return new Date((obj.seconds as number) * 1000).toISOString();
    }
    return `Map(${Object.keys(obj).length} fields)`;
  }
  return String(value);
}

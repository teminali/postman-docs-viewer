/**
 * Parse a firestore.indexes.json file to extract collection names,
 * composite indexes, and field overrides.
 */

import type {
  FirestoreIndex,
  FirestoreIndexField,
  FirestoreFieldOverride,
} from "@/types/firestore-schema";

interface RawIndexesFile {
  indexes?: {
    collectionGroup: string;
    queryScope?: string;
    fields?: {
      fieldPath: string;
      order?: string;
      arrayConfig?: string;
    }[];
  }[];
  fieldOverrides?: {
    collectionGroup: string;
    fieldPath: string;
    indexes?: {
      queryScope?: string;
      order?: string;
      arrayConfig?: string;
    }[];
  }[];
}

export interface ParsedIndexes {
  /** Unique collection group names found in indexes + field overrides */
  collectionNames: string[];
  /** Parsed composite indexes */
  indexes: FirestoreIndex[];
  /** Parsed single-field overrides */
  fieldOverrides: FirestoreFieldOverride[];
}

/**
 * Parse the contents of a firestore.indexes.json file.
 * Accepts the parsed JSON object or a raw JSON string.
 */
export function parseFirestoreIndexes(
  input: unknown
): ParsedIndexes {
  let data: RawIndexesFile;
  if (typeof input === "string") {
    data = JSON.parse(input) as RawIndexesFile;
  } else {
    data = input as RawIndexesFile;
  }

  const collectionSet = new Set<string>();
  const indexes: FirestoreIndex[] = [];
  const fieldOverrides: FirestoreFieldOverride[] = [];

  // Parse composite indexes
  if (Array.isArray(data.indexes)) {
    for (const raw of data.indexes) {
      if (!raw.collectionGroup) continue;
      collectionSet.add(raw.collectionGroup);

      const fields: FirestoreIndexField[] = (raw.fields ?? []).map((f) => ({
        fieldPath: f.fieldPath,
        order: f.order as FirestoreIndexField["order"],
        arrayConfig: f.arrayConfig as FirestoreIndexField["arrayConfig"],
      }));

      indexes.push({
        collectionGroup: raw.collectionGroup,
        queryScope: raw.queryScope ?? "COLLECTION",
        fields,
      });
    }
  }

  // Parse field overrides
  if (Array.isArray(data.fieldOverrides)) {
    for (const raw of data.fieldOverrides) {
      if (!raw.collectionGroup) continue;
      collectionSet.add(raw.collectionGroup);

      fieldOverrides.push({
        collectionGroup: raw.collectionGroup,
        fieldPath: raw.fieldPath,
        indexes: (raw.indexes ?? []).map((idx) => ({
          queryScope: idx.queryScope ?? "COLLECTION",
          order: idx.order,
          arrayConfig: idx.arrayConfig,
        })),
      });
    }
  }

  return {
    collectionNames: Array.from(collectionSet).sort(),
    indexes,
    fieldOverrides,
  };
}

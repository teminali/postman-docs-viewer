/**
 * Types for Firestore database schema documentation.
 */

export type FirestoreFieldType =
  | "string"
  | "number"
  | "boolean"
  | "timestamp"
  | "array"
  | "map"
  | "reference"
  | "geopoint"
  | "null"
  | "unknown";

export interface FirestoreFieldSchema {
  /** Field name */
  name: string;
  /** Inferred Firestore type */
  type: FirestoreFieldType;
  /** How many of N sampled docs contain this field */
  frequency: number;
  /** Total docs sampled for this collection */
  sampleSize: number;
  /** Nested fields (for map type) */
  nestedFields?: FirestoreFieldSchema[];
  /** A few sample values for preview */
  sampleValues?: unknown[];
}

export interface FirestoreCollectionSchema {
  /** Collection name (e.g. "users") */
  name: string;
  /** Full path (e.g. "users" or "users/{userId}/posts") */
  path: string;
  /** Inferred fields from sample docs */
  fields: FirestoreFieldSchema[];
  /** Subcollections (recursive) */
  subcollections: FirestoreCollectionSchema[];
  /** How many sample docs were read */
  sampleDocCount: number;
  /** Security rules snippet for this collection (if parsed) */
  rules?: string;
}

export interface FirestoreIndex {
  /** The collection group this index applies to */
  collectionGroup: string;
  /** COLLECTION or COLLECTION_GROUP */
  queryScope: string;
  /** Indexed fields */
  fields: FirestoreIndexField[];
}

export interface FirestoreIndexField {
  fieldPath: string;
  order?: "ASCENDING" | "DESCENDING";
  arrayConfig?: "CONTAINS";
}

export interface FirestoreFieldOverride {
  collectionGroup: string;
  fieldPath: string;
  indexes: {
    queryScope: string;
    order?: string;
    arrayConfig?: string;
  }[];
}

export interface FirestoreSchema {
  /** Project name / identifier */
  projectName: string;
  /** All discovered collections (top-level; subcollections are nested) */
  collections: FirestoreCollectionSchema[];
  /** Parsed composite indexes */
  indexes: FirestoreIndex[];
  /** Parsed field overrides */
  fieldOverrides: FirestoreFieldOverride[];
  /** Raw security rules text (if uploaded) */
  rawRules: string | null;
  /** Timestamp when the scan was performed */
  scannedAt: number;
}

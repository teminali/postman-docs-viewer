/**
 * Firestore Code Snippet Generator
 *
 * Generates platform-specific Firebase SDK code snippets based on the
 * actual collection schema (field names, types, structure).
 */

import type {
  FirestoreCollectionSchema,
  FirestoreFieldSchema,
  FirestoreFieldType,
} from "@/types/firestore-schema";

// ─── Types ──────────────────────────────────────────────────────────

export type SnippetPlatform =
  | "javascript"
  | "react"
  | "flutter"
  | "python"
  | "swift"
  | "kotlin"
  | "nodejs";

export type SnippetOperation =
  | "init"
  | "getAll"
  | "getById"
  | "add"
  | "update"
  | "delete"
  | "query"
  | "realtime";

export interface SnippetDefinition {
  id: SnippetOperation;
  label: string;
  description: string;
}

export interface PlatformDefinition {
  id: SnippetPlatform;
  label: string;
  icon: string;
  language: string; // for syntax highlighting
}

export const PLATFORMS: PlatformDefinition[] = [
  { id: "javascript", label: "JavaScript", icon: "JS", language: "javascript" },
  { id: "react", label: "React", icon: "⚛", language: "tsx" },
  { id: "flutter", label: "Flutter", icon: "🐦", language: "dart" },
  { id: "python", label: "Python", icon: "🐍", language: "python" },
  { id: "swift", label: "Swift", icon: "🍎", language: "swift" },
  { id: "kotlin", label: "Kotlin", icon: "K", language: "kotlin" },
  { id: "nodejs", label: "Node.js", icon: "⬢", language: "javascript" },
];

export const OPERATIONS: SnippetDefinition[] = [
  { id: "getAll", label: "List documents", description: "Fetch all or limited documents" },
  { id: "getById", label: "Get by ID", description: "Fetch a single document" },
  { id: "add", label: "Add document", description: "Create a new document" },
  { id: "update", label: "Update document", description: "Update existing document fields" },
  { id: "delete", label: "Delete document", description: "Delete a document by ID" },
  { id: "query", label: "Query", description: "Filter documents with where clause" },
  { id: "realtime", label: "Real-time listener", description: "Listen for live changes" },
];

// ─── Generator ──────────────────────────────────────────────────────

export function generateSnippet(
  platform: SnippetPlatform,
  operation: SnippetOperation,
  collection: FirestoreCollectionSchema
): string {
  const gen = generators[platform];
  if (!gen) return `// Snippet not available for ${platform}`;
  const fn = gen[operation];
  if (!fn) return `// Operation "${operation}" not available for ${platform}`;
  return fn(collection);
}

// ─── Helpers ────────────────────────────────────────────────────────

function camelCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, c) => (c as string).toUpperCase());
}

function pascalCase(str: string): string {
  const cc = camelCase(str);
  return cc.charAt(0).toUpperCase() + cc.slice(1);
}

function singularize(name: string): string {
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("ses")) return name.slice(0, -2);
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}

function tsType(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "timestamp": return "Timestamp";
    case "array": return "any[]";
    case "map": return "Record<string, any>";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "null";
    default: return "any";
  }
}

function dartType(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "String";
    case "number": return "num";
    case "boolean": return "bool";
    case "timestamp": return "Timestamp";
    case "array": return "List<dynamic>";
    case "map": return "Map<String, dynamic>";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "dynamic";
    default: return "dynamic";
  }
}

function pythonType(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "str";
    case "number": return "float";
    case "boolean": return "bool";
    case "timestamp": return "datetime";
    case "array": return "list";
    case "map": return "dict";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "None";
    default: return "Any";
  }
}

function swiftType(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "String";
    case "number": return "Double";
    case "boolean": return "Bool";
    case "timestamp": return "Timestamp";
    case "array": return "[Any]";
    case "map": return "[String: Any]";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "Any?";
    default: return "Any";
  }
}

function kotlinType(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "String";
    case "number": return "Double";
    case "boolean": return "Boolean";
    case "timestamp": return "Timestamp";
    case "array": return "List<Any>";
    case "map": return "Map<String, Any>";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "Any?";
    default: return "Any";
  }
}

function sampleValue(field: FirestoreFieldSchema): string {
  if (field.sampleValues && field.sampleValues.length > 0) {
    const v = field.sampleValues[0];
    if (typeof v === "string") return `"${v.length > 30 ? v.slice(0, 30) + "..." : v}"`;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
  }
  switch (field.type) {
    case "string": return `"example"`;
    case "number": return "0";
    case "boolean": return "true";
    case "timestamp": return "new Date()";
    case "array": return "[]";
    case "map": return "{}";
    default: return "null";
  }
}

function dartSampleValue(field: FirestoreFieldSchema): string {
  if (field.sampleValues && field.sampleValues.length > 0) {
    const v = field.sampleValues[0];
    if (typeof v === "string") return `'${v.length > 30 ? v.slice(0, 30) + "..." : v}'`;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
  }
  switch (field.type) {
    case "string": return `'example'`;
    case "number": return "0";
    case "boolean": return "true";
    case "timestamp": return "Timestamp.now()";
    case "array": return "[]";
    case "map": return "{}";
    default: return "null";
  }
}

function pythonSampleValue(field: FirestoreFieldSchema): string {
  if (field.sampleValues && field.sampleValues.length > 0) {
    const v = field.sampleValues[0];
    if (typeof v === "string") return `"${v.length > 30 ? v.slice(0, 30) + "..." : v}"`;
    if (typeof v === "number") return String(v);
    if (typeof v === "boolean") return v ? "True" : "False";
  }
  switch (field.type) {
    case "string": return `"example"`;
    case "number": return "0";
    case "boolean": return "True";
    case "timestamp": return "firestore.SERVER_TIMESTAMP";
    case "array": return "[]";
    case "map": return "{}";
    default: return "None";
  }
}

function fieldComment(fields: FirestoreFieldSchema[]): string {
  return fields
    .slice(0, 10)
    .map((f) => `//   ${f.name}: ${tsType(f.type)}`)
    .join("\n");
}

function queryableField(fields: FirestoreFieldSchema[]): FirestoreFieldSchema {
  // Pick the best field to demonstrate querying — prefer string/number required fields
  const required = fields.filter((f) => f.frequency === f.sampleSize);
  const good = required.find((f) => f.type === "string" || f.type === "number" || f.type === "boolean");
  return good ?? required[0] ?? fields[0];
}

// ─── Platform generators ────────────────────────────────────────────

type OperationGenerator = (col: FirestoreCollectionSchema) => string;
type PlatformGenerators = Record<SnippetOperation, OperationGenerator>;

const generators: Record<SnippetPlatform, PlatformGenerators> = {
  // ═══════════════════════════════════════════════════════════════════
  // JAVASCRIPT (Web SDK v9+)
  // ═══════════════════════════════════════════════════════════════════
  javascript: {
    init: () =>
`import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);`,

    getAll: (col) =>
`import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";

// Fetch documents from "${col.name}"
// Fields:
${fieldComment(col.fields)}
async function get${pascalCase(col.name)}(maxResults = 25) {
  const q = query(
    collection(db, "${col.path}"),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Usage
const ${camelCase(col.name)} = await get${pascalCase(col.name)}();
console.log(${camelCase(col.name)});`,

    getById: (col) => {
      const singular = singularize(camelCase(col.name));
      return `import { doc, getDoc } from "firebase/firestore";

// Get a single ${singularize(col.name)} by ID
async function get${pascalCase(singularize(col.name))}(id) {
  const docRef = doc(db, "${col.path}", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.log("Document not found");
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() };
}

// Usage
const ${singular} = await get${pascalCase(singularize(col.name))}("DOCUMENT_ID");
console.log(${singular});`;
    },

    add: (col) =>
`import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Add a new document to "${col.name}"
async function add${pascalCase(singularize(col.name))}(data) {
  const docRef = await addDoc(collection(db, "${col.path}"), {
${col.fields.slice(0, 8).map((f) => `    ${f.name}: data.${f.name},`).join("\n")}
    createdAt: serverTimestamp(),
  });

  console.log("Created with ID:", docRef.id);
  return docRef.id;
}

// Usage
const newId = await add${pascalCase(singularize(col.name))}({
${col.fields.slice(0, 8).map((f) => `  ${f.name}: ${sampleValue(f)},`).join("\n")}
});`,

    update: (col) =>
`import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// Update a ${singularize(col.name)} document
async function update${pascalCase(singularize(col.name))}(id, updates) {
  const docRef = doc(db, "${col.path}", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  console.log("Document updated:", id);
}

// Usage
await update${pascalCase(singularize(col.name))}("DOCUMENT_ID", {
${col.fields.slice(0, 3).map((f) => `  ${f.name}: ${sampleValue(f)},`).join("\n")}
});`,

    delete: (col) =>
`import { doc, deleteDoc } from "firebase/firestore";

// Delete a ${singularize(col.name)} document
async function delete${pascalCase(singularize(col.name))}(id) {
  const docRef = doc(db, "${col.path}", id);
  await deleteDoc(docRef);
  console.log("Document deleted:", id);
}

// Usage
await delete${pascalCase(singularize(col.name))}("DOCUMENT_ID");`,

    query: (col) => {
      const qf = queryableField(col.fields);
      if (!qf) return `// No fields available for query example`;
      return `import { collection, query, where, getDocs, limit } from "firebase/firestore";

// Query ${col.name} where ${qf.name} matches a value
async function query${pascalCase(col.name)}By${pascalCase(qf.name)}(value) {
  const q = query(
    collection(db, "${col.path}"),
    where("${qf.name}", "==", value),
    limit(25)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Usage
const results = await query${pascalCase(col.name)}By${pascalCase(qf.name)}(${sampleValue(qf)});
console.log(\`Found \${results.length} documents\`);`;
    },

    realtime: (col) =>
`import { collection, onSnapshot, query, limit } from "firebase/firestore";

// Listen for real-time updates on "${col.name}"
const q = query(collection(db, "${col.path}"), limit(25));

const unsubscribe = onSnapshot(q, (snapshot) => {
  const ${camelCase(col.name)} = [];

  snapshot.docChanges().forEach((change) => {
    const data = { id: change.doc.id, ...change.doc.data() };

    if (change.type === "added") {
      console.log("New:", data);
    }
    if (change.type === "modified") {
      console.log("Modified:", data);
    }
    if (change.type === "removed") {
      console.log("Removed:", data);
    }
  });

  snapshot.forEach((doc) => {
    ${camelCase(col.name)}.push({ id: doc.id, ...doc.data() });
  });

  console.log("Current ${col.name}:", ${camelCase(col.name)});
});

// Call unsubscribe() to stop listening`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // REACT (with hooks)
  // ═══════════════════════════════════════════════════════════════════
  react: {
    init: () =>
`// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);`,

    getAll: (col) => {
      const typeName = pascalCase(singularize(col.name));
      return `import { useState, useEffect } from "react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "./firebase";

interface ${typeName} {
  id: string;
${col.fields.slice(0, 10).map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n")}
}

function use${pascalCase(col.name)}(maxResults = 25) {
  const [data, setData] = useState<${typeName}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "${col.path}"), limit(maxResults));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ${typeName}[];
        setData(docs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [maxResults]);

  return { data, loading, error };
}

// Usage in a component
function ${pascalCase(col.name)}List() {
  const { data, loading, error } = use${pascalCase(col.name)}();

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}`;
    },

    getById: (col) => {
      const typeName = pascalCase(singularize(col.name));
      return `import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

interface ${typeName} {
  id: string;
${col.fields.slice(0, 10).map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n")}
}

function use${typeName}(id: string | null) {
  const [data, setData] = useState<${typeName} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDoc = async () => {
      const snap = await getDoc(doc(db, "${col.path}", id));
      if (snap.exists()) {
        setData({ id: snap.id, ...snap.data() } as ${typeName});
      }
      setLoading(false);
    };
    fetchDoc();
  }, [id]);

  return { data, loading };
}

// Usage
function ${typeName}Detail({ id }: { id: string }) {
  const { data, loading } = use${typeName}(id);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>Not found</p>;

  return (
    <div>
      <h2>{data.id}</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}`;
    },

    add: (col) => {
      const typeName = pascalCase(singularize(col.name));
      return `import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

function Add${typeName}Form() {
${col.fields.slice(0, 6).map((f) => `  const [${camelCase(f.name)}, set${pascalCase(f.name)}] = useState(${f.type === "string" ? '""' : f.type === "number" ? "0" : f.type === "boolean" ? "false" : '""'});`).join("\n")}
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "${col.path}"), {
${col.fields.slice(0, 6).map((f) => `        ${f.name}: ${camelCase(f.name)},`).join("\n")}
        createdAt: serverTimestamp(),
      });
      alert("Document created!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
${col.fields.slice(0, 6).map((f) => `      <input
        placeholder="${f.name}"
        value={${camelCase(f.name)}}
        onChange={(e) => set${pascalCase(f.name)}(e.target.value${f.type === "number" ? " as any" : ""})}
      />`).join("\n")}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}`;
    },

    update: (col) =>
`import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Update a ${singularize(col.name)} in React
async function update${pascalCase(singularize(col.name))}(id: string, updates: Partial<{
${col.fields.slice(0, 8).map((f) => `  ${f.name}: ${tsType(f.type)};`).join("\n")}
}>) {
  const docRef = doc(db, "${col.path}", id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Usage in a component
// await update${pascalCase(singularize(col.name))}("DOC_ID", { ${col.fields[0]?.name ?? "field"}: newValue });`,

    delete: (col) =>
`import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

async function delete${pascalCase(singularize(col.name))}(id: string) {
  await deleteDoc(doc(db, "${col.path}", id));
}

// Usage in a component
// <button onClick={() => delete${pascalCase(singularize(col.name))}(item.id)}>Delete</button>`,

    query: (col) => {
      const qf = queryableField(col.fields);
      const typeName = pascalCase(singularize(col.name));
      return `import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "./firebase";

function use${pascalCase(col.name)}Query(field: string, value: any) {
  const [data, setData] = useState<${typeName}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const q = query(
        collection(db, "${col.path}"),
        where(field, "==", value),
        limit(25)
      );
      const snapshot = await getDocs(q);
      setData(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ${typeName}[]);
      setLoading(false);
    };
    run();
  }, [field, value]);

  return { data, loading };
}

// Usage
function Filtered${pascalCase(col.name)}() {
  const { data, loading } = use${pascalCase(col.name)}Query("${qf?.name ?? "field"}", ${qf ? sampleValue(qf) : '"value"'});
  if (loading) return <p>Loading...</p>;
  return <p>Found {data.length} results</p>;
}`;
    },

    realtime: (col) => {
      const typeName = pascalCase(singularize(col.name));
      return `import { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "./firebase";

function use${pascalCase(col.name)}Realtime(maxResults = 25) {
  const [data, setData] = useState<${typeName}[]>([]);

  useEffect(() => {
    const q = query(collection(db, "${col.path}"), limit(maxResults));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ${typeName}[];
      setData(docs);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [maxResults]);

  return data;
}

// Usage
function Live${pascalCase(col.name)}() {
  const ${camelCase(col.name)} = use${pascalCase(col.name)}Realtime();

  return (
    <ul>
      {${camelCase(col.name)}.map(item => (
        <li key={item.id}>{JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}`;
    },
  },

  // ═══════════════════════════════════════════════════════════════════
  // FLUTTER / DART
  // ═══════════════════════════════════════════════════════════════════
  flutter: {
    init: () =>
`// pubspec.yaml:
//   dependencies:
//     firebase_core: ^latest
//     cloud_firestore: ^latest

import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

// In main():
await Firebase.initializeApp();
final db = FirebaseFirestore.instance;`,

    getAll: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';

// Fetch documents from "${col.name}"
// Fields:
${col.fields.slice(0, 8).map((f) => `//   ${f.name}: ${dartType(f.type)}`).join("\n")}
Future<List<Map<String, dynamic>>> get${pascalCase(col.name)}({int limit = 25}) async {
  final snapshot = await FirebaseFirestore.instance
      .collection('${col.path}')
      .limit(limit)
      .get();

  return snapshot.docs.map((doc) {
    return {'id': doc.id, ...doc.data()};
  }).toList();
}

// Usage
final ${camelCase(col.name)} = await get${pascalCase(col.name)}();
print(${camelCase(col.name)});`,

    getById: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';

Future<Map<String, dynamic>?> get${pascalCase(singularize(col.name))}(String id) async {
  final doc = await FirebaseFirestore.instance
      .collection('${col.path}')
      .doc(id)
      .get();

  if (!doc.exists) return null;
  return {'id': doc.id, ...doc.data()!};
}

// Usage
final ${camelCase(singularize(col.name))} = await get${pascalCase(singularize(col.name))}('DOCUMENT_ID');
print(${camelCase(singularize(col.name))});`,

    add: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';

Future<String> add${pascalCase(singularize(col.name))}(Map<String, dynamic> data) async {
  final docRef = await FirebaseFirestore.instance
      .collection('${col.path}')
      .add({
${col.fields.slice(0, 8).map((f) => `        '${f.name}': data['${f.name}'],`).join("\n")}
        'createdAt': FieldValue.serverTimestamp(),
      });

  print('Created with ID: \${docRef.id}');
  return docRef.id;
}

// Usage
final newId = await add${pascalCase(singularize(col.name))}({
${col.fields.slice(0, 8).map((f) => `  '${f.name}': ${dartSampleValue(f)},`).join("\n")}
});`,

    update: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';

Future<void> update${pascalCase(singularize(col.name))}(String id, Map<String, dynamic> updates) async {
  await FirebaseFirestore.instance
      .collection('${col.path}')
      .doc(id)
      .update({
        ...updates,
        'updatedAt': FieldValue.serverTimestamp(),
      });
  print('Document updated: $id');
}

// Usage
await update${pascalCase(singularize(col.name))}('DOCUMENT_ID', {
${col.fields.slice(0, 3).map((f) => `  '${f.name}': ${dartSampleValue(f)},`).join("\n")}
});`,

    delete: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';

Future<void> delete${pascalCase(singularize(col.name))}(String id) async {
  await FirebaseFirestore.instance
      .collection('${col.path}')
      .doc(id)
      .delete();
  print('Document deleted: $id');
}

// Usage
await delete${pascalCase(singularize(col.name))}('DOCUMENT_ID');`,

    query: (col) => {
      const qf = queryableField(col.fields);
      return `import 'package:cloud_firestore/cloud_firestore.dart';

Future<List<Map<String, dynamic>>> query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(dynamic value) async {
  final snapshot = await FirebaseFirestore.instance
      .collection('${col.path}')
      .where('${qf?.name ?? "field"}', isEqualTo: value)
      .limit(25)
      .get();

  return snapshot.docs.map((doc) {
    return {'id': doc.id, ...doc.data()};
  }).toList();
}

// Usage
final results = await query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(${qf ? dartSampleValue(qf) : "'value'"});
print('Found \${results.length} documents');`;
    },

    realtime: (col) =>
`import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

// StreamBuilder widget for real-time "${col.name}" updates
class ${pascalCase(col.name)}Stream extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('${col.path}')
          .limit(25)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Text('Error: \${snapshot.error}');
        }
        if (!snapshot.hasData) {
          return const CircularProgressIndicator();
        }

        final docs = snapshot.data!.docs;

        return ListView.builder(
          itemCount: docs.length,
          itemBuilder: (context, index) {
            final data = docs[index].data() as Map<String, dynamic>;
            return ListTile(
              title: Text(docs[index].id),
              subtitle: Text(data.toString()),
            );
          },
        );
      },
    );
  }
}`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // PYTHON (firebase-admin)
  // ═══════════════════════════════════════════════════════════════════
  python: {
    init: () =>
`# pip install firebase-admin
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()`,

    getAll: (col) =>
`from firebase_admin import firestore

db = firestore.client()

# Fetch documents from "${col.name}"
# Fields:
${col.fields.slice(0, 8).map((f) => `#   ${f.name}: ${pythonType(f.type)}`).join("\n")}
def get_${col.name}(limit=25):
    docs = db.collection("${col.path}").limit(limit).stream()
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results

# Usage
${col.name} = get_${col.name}()
for item in ${col.name}:
    print(item)`,

    getById: (col) =>
`from firebase_admin import firestore

db = firestore.client()

def get_${singularize(col.name)}(doc_id):
    doc = db.collection("${col.path}").document(doc_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data["id"] = doc.id
    return data

# Usage
${singularize(col.name)} = get_${singularize(col.name)}("DOCUMENT_ID")
print(${singularize(col.name)})`,

    add: (col) =>
`from firebase_admin import firestore

db = firestore.client()

def add_${singularize(col.name)}(data, doc_id=None):
    if doc_id:
        db.collection("${col.path}").document(doc_id).set({
            **data,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })
        return doc_id
    else:
        _, doc_ref = db.collection("${col.path}").add({
            **data,
            "createdAt": firestore.SERVER_TIMESTAMP,
        })
        return doc_ref.id

# Usage
new_id = add_${singularize(col.name)}({
${col.fields.slice(0, 8).map((f) => `    "${f.name}": ${pythonSampleValue(f)},`).join("\n")}
})
print(f"Created: {new_id}")`,

    update: (col) =>
`from firebase_admin import firestore

db = firestore.client()

def update_${singularize(col.name)}(doc_id, updates):
    db.collection("${col.path}").document(doc_id).update({
        **updates,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print(f"Updated: {doc_id}")

# Usage
update_${singularize(col.name)}("DOCUMENT_ID", {
${col.fields.slice(0, 3).map((f) => `    "${f.name}": ${pythonSampleValue(f)},`).join("\n")}
})`,

    delete: (col) =>
`from firebase_admin import firestore

db = firestore.client()

def delete_${singularize(col.name)}(doc_id):
    db.collection("${col.path}").document(doc_id).delete()
    print(f"Deleted: {doc_id}")

# Usage
delete_${singularize(col.name)}("DOCUMENT_ID")`,

    query: (col) => {
      const qf = queryableField(col.fields);
      return `from firebase_admin import firestore

db = firestore.client()

def query_${col.name}_by_${qf?.name ?? "field"}(value, limit=25):
    docs = (
        db.collection("${col.path}")
        .where("${qf?.name ?? "field"}", "==", value)
        .limit(limit)
        .stream()
    )
    results = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        results.append(data)
    return results

# Usage
results = query_${col.name}_by_${qf?.name ?? "field"}(${qf ? pythonSampleValue(qf) : '"value"'})
print(f"Found {len(results)} documents")`;
    },

    realtime: (col) =>
`from firebase_admin import firestore

db = firestore.client()

# Real-time listener for "${col.name}"
def on_snapshot(doc_snapshot, changes, read_time):
    for change in changes:
        doc = change.document
        if change.type.name == "ADDED":
            print(f"New: {doc.id} => {doc.to_dict()}")
        elif change.type.name == "MODIFIED":
            print(f"Modified: {doc.id} => {doc.to_dict()}")
        elif change.type.name == "REMOVED":
            print(f"Removed: {doc.id}")

# Start listening
query = db.collection("${col.path}").limit(25)
watch = query.on_snapshot(on_snapshot)

# To stop: watch.unsubscribe()`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // SWIFT (iOS)
  // ═══════════════════════════════════════════════════════════════════
  swift: {
    init: () =>
`// Podfile: pod 'FirebaseFirestore'
// or SPM: firebase-ios-sdk

import FirebaseCore
import FirebaseFirestore

// In AppDelegate or @main App:
FirebaseApp.configure()
let db = Firestore.firestore()`,

    getAll: (col) =>
`import FirebaseFirestore

// Fetch documents from "${col.name}"
// Fields:
${col.fields.slice(0, 8).map((f) => `//   ${f.name}: ${swiftType(f.type)}`).join("\n")}
func fetch${pascalCase(col.name)}(limit: Int = 25) async throws -> [[String: Any]] {
    let snapshot = try await Firestore.firestore()
        .collection("${col.path}")
        .limit(to: limit)
        .getDocuments()

    return snapshot.documents.map { doc in
        var data = doc.data()
        data["id"] = doc.documentID
        return data
    }
}

// Usage
let ${camelCase(col.name)} = try await fetch${pascalCase(col.name)}()
print(${camelCase(col.name)})`,

    getById: (col) =>
`import FirebaseFirestore

func fetch${pascalCase(singularize(col.name))}(id: String) async throws -> [String: Any]? {
    let doc = try await Firestore.firestore()
        .collection("${col.path}")
        .document(id)
        .getDocument()

    guard doc.exists, var data = doc.data() else { return nil }
    data["id"] = doc.documentID
    return data
}

// Usage
if let ${camelCase(singularize(col.name))} = try await fetch${pascalCase(singularize(col.name))}(id: "DOCUMENT_ID") {
    print(${camelCase(singularize(col.name))})
}`,

    add: (col) =>
`import FirebaseFirestore

func add${pascalCase(singularize(col.name))}(_ data: [String: Any]) async throws -> String {
    let docRef = try await Firestore.firestore()
        .collection("${col.path}")
        .addDocument(data: data.merging([
            "createdAt": FieldValue.serverTimestamp()
        ]) { _, new in new })

    print("Created: \\(docRef.documentID)")
    return docRef.documentID
}

// Usage
let newId = try await add${pascalCase(singularize(col.name))}([
${col.fields.slice(0, 6).map((f) => `    "${f.name}": ${f.type === "string" ? `"example"` : f.type === "number" ? "0" : f.type === "boolean" ? "true" : `""`},`).join("\n")}
])`,

    update: (col) =>
`import FirebaseFirestore

func update${pascalCase(singularize(col.name))}(id: String, updates: [String: Any]) async throws {
    try await Firestore.firestore()
        .collection("${col.path}")
        .document(id)
        .updateData(updates.merging([
            "updatedAt": FieldValue.serverTimestamp()
        ]) { _, new in new })

    print("Updated: \\(id)")
}

// Usage
try await update${pascalCase(singularize(col.name))}(id: "DOCUMENT_ID", updates: [
${col.fields.slice(0, 3).map((f) => `    "${f.name}": ${f.type === "string" ? `"new value"` : f.type === "number" ? "42" : "true"},`).join("\n")}
])`,

    delete: (col) =>
`import FirebaseFirestore

func delete${pascalCase(singularize(col.name))}(id: String) async throws {
    try await Firestore.firestore()
        .collection("${col.path}")
        .document(id)
        .delete()

    print("Deleted: \\(id)")
}

// Usage
try await delete${pascalCase(singularize(col.name))}(id: "DOCUMENT_ID")`,

    query: (col) => {
      const qf = queryableField(col.fields);
      return `import FirebaseFirestore

func query${pascalCase(col.name)}(by${pascalCase(qf?.name ?? "field")}: Any) async throws -> [[String: Any]] {
    let snapshot = try await Firestore.firestore()
        .collection("${col.path}")
        .whereField("${qf?.name ?? "field"}", isEqualTo: by${pascalCase(qf?.name ?? "field")})
        .limit(to: 25)
        .getDocuments()

    return snapshot.documents.map { doc in
        var data = doc.data()
        data["id"] = doc.documentID
        return data
    }
}

// Usage
let results = try await query${pascalCase(col.name)}(by${pascalCase(qf?.name ?? "field")}: ${qf?.type === "string" ? `"value"` : "42"})
print("Found \\(results.count) documents")`;
    },

    realtime: (col) =>
`import FirebaseFirestore

// Real-time listener for "${col.name}"
let listener = Firestore.firestore()
    .collection("${col.path}")
    .limit(to: 25)
    .addSnapshotListener { snapshot, error in
        guard let snapshot = snapshot else {
            print("Error: \\(error?.localizedDescription ?? "unknown")")
            return
        }

        for change in snapshot.documentChanges {
            let data = change.document.data()
            switch change.type {
            case .added:
                print("Added: \\(change.document.documentID)")
            case .modified:
                print("Modified: \\(change.document.documentID)")
            case .removed:
                print("Removed: \\(change.document.documentID)")
            }
        }
    }

// To stop: listener.remove()`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // KOTLIN (Android)
  // ═══════════════════════════════════════════════════════════════════
  kotlin: {
    init: () =>
`// build.gradle:
// implementation 'com.google.firebase:firebase-firestore-ktx'

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

val db = Firebase.firestore`,

    getAll: (col) =>
`import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

// Fetch documents from "${col.name}"
// Fields:
${col.fields.slice(0, 8).map((f) => `//   ${f.name}: ${kotlinType(f.type)}`).join("\n")}
suspend fun get${pascalCase(col.name)}(limit: Long = 25): List<Map<String, Any>> {
    val snapshot = Firebase.firestore
        .collection("${col.path}")
        .limit(limit)
        .get()
        .await()

    return snapshot.documents.map { doc ->
        val data = doc.data?.toMutableMap() ?: mutableMapOf()
        data["id"] = doc.id
        data
    }
}

// Usage (in a coroutine)
val ${camelCase(col.name)} = get${pascalCase(col.name)}()
${camelCase(col.name)}.forEach { println(it) }`,

    getById: (col) =>
`import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

suspend fun get${pascalCase(singularize(col.name))}(id: String): Map<String, Any>? {
    val doc = Firebase.firestore
        .collection("${col.path}")
        .document(id)
        .get()
        .await()

    if (!doc.exists()) return null
    val data = doc.data?.toMutableMap() ?: return null
    data["id"] = doc.id
    return data
}

// Usage
val ${camelCase(singularize(col.name))} = get${pascalCase(singularize(col.name))}("DOCUMENT_ID")
println(${camelCase(singularize(col.name))})`,

    add: (col) =>
`import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

suspend fun add${pascalCase(singularize(col.name))}(data: Map<String, Any>): String {
    val docRef = Firebase.firestore
        .collection("${col.path}")
        .add(data + mapOf("createdAt" to FieldValue.serverTimestamp()))
        .await()

    println("Created: \${docRef.id}")
    return docRef.id
}

// Usage
val newId = add${pascalCase(singularize(col.name))}(mapOf(
${col.fields.slice(0, 6).map((f) => `    "${f.name}" to ${f.type === "string" ? `"example"` : f.type === "number" ? "0" : f.type === "boolean" ? "true" : `""`},`).join("\n")}
))`,

    update: (col) =>
`import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

suspend fun update${pascalCase(singularize(col.name))}(id: String, updates: Map<String, Any>) {
    Firebase.firestore
        .collection("${col.path}")
        .document(id)
        .update(updates + mapOf("updatedAt" to FieldValue.serverTimestamp()))
        .await()

    println("Updated: $id")
}

// Usage
update${pascalCase(singularize(col.name))}("DOCUMENT_ID", mapOf(
${col.fields.slice(0, 3).map((f) => `    "${f.name}" to ${f.type === "string" ? `"new value"` : f.type === "number" ? "42" : "true"},`).join("\n")}
))`,

    delete: (col) =>
`import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

suspend fun delete${pascalCase(singularize(col.name))}(id: String) {
    Firebase.firestore
        .collection("${col.path}")
        .document(id)
        .delete()
        .await()

    println("Deleted: $id")
}

// Usage
delete${pascalCase(singularize(col.name))}("DOCUMENT_ID")`,

    query: (col) => {
      const qf = queryableField(col.fields);
      return `import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await

suspend fun query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(value: Any): List<Map<String, Any>> {
    val snapshot = Firebase.firestore
        .collection("${col.path}")
        .whereEqualTo("${qf?.name ?? "field"}", value)
        .limit(25)
        .get()
        .await()

    return snapshot.documents.map { doc ->
        val data = doc.data?.toMutableMap() ?: mutableMapOf()
        data["id"] = doc.id
        data
    }
}

// Usage
val results = query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(${qf?.type === "string" ? `"value"` : "42"})
println("Found \${results.size} documents")`;
    },

    realtime: (col) =>
`import com.google.firebase.firestore.DocumentChange
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase

// Real-time listener for "${col.name}"
val listener = Firebase.firestore
    .collection("${col.path}")
    .limit(25)
    .addSnapshotListener { snapshot, error ->
        if (error != null) {
            println("Error: \${error.message}")
            return@addSnapshotListener
        }

        snapshot?.documentChanges?.forEach { change ->
            when (change.type) {
                DocumentChange.Type.ADDED -> println("Added: \${change.document.id}")
                DocumentChange.Type.MODIFIED -> println("Modified: \${change.document.id}")
                DocumentChange.Type.REMOVED -> println("Removed: \${change.document.id}")
            }
        }
    }

// To stop: listener.remove()`,
  },

  // ═══════════════════════════════════════════════════════════════════
  // NODE.JS (firebase-admin)
  // ═══════════════════════════════════════════════════════════════════
  nodejs: {
    init: () =>
`// npm install firebase-admin
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert("./serviceAccountKey.json"),
});

const db = admin.firestore();`,

    getAll: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

// Fetch documents from "${col.name}"
// Fields:
${col.fields.slice(0, 8).map((f) => `//   ${f.name}: ${tsType(f.type)}`).join("\n")}
async function get${pascalCase(col.name)}(limit = 25) {
  const snapshot = await db
    .collection("${col.path}")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Usage
const ${camelCase(col.name)} = await get${pascalCase(col.name)}();
console.log(${camelCase(col.name)});`,

    getById: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

async function get${pascalCase(singularize(col.name))}(id) {
  const doc = await db.collection("${col.path}").doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// Usage
const ${camelCase(singularize(col.name))} = await get${pascalCase(singularize(col.name))}("DOCUMENT_ID");
console.log(${camelCase(singularize(col.name))});`,

    add: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

async function add${pascalCase(singularize(col.name))}(data) {
  const docRef = await db.collection("${col.path}").add({
${col.fields.slice(0, 8).map((f) => `    ${f.name}: data.${f.name},`).join("\n")}
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Created:", docRef.id);
  return docRef.id;
}

// Usage
const newId = await add${pascalCase(singularize(col.name))}({
${col.fields.slice(0, 8).map((f) => `  ${f.name}: ${sampleValue(f)},`).join("\n")}
});`,

    update: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

async function update${pascalCase(singularize(col.name))}(id, updates) {
  await db.collection("${col.path}").doc(id).update({
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log("Updated:", id);
}

// Usage
await update${pascalCase(singularize(col.name))}("DOCUMENT_ID", {
${col.fields.slice(0, 3).map((f) => `  ${f.name}: ${sampleValue(f)},`).join("\n")}
});`,

    delete: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

async function delete${pascalCase(singularize(col.name))}(id) {
  await db.collection("${col.path}").doc(id).delete();
  console.log("Deleted:", id);
}

// Usage
await delete${pascalCase(singularize(col.name))}("DOCUMENT_ID");`,

    query: (col) => {
      const qf = queryableField(col.fields);
      return `const admin = require("firebase-admin");
const db = admin.firestore();

async function query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(value) {
  const snapshot = await db
    .collection("${col.path}")
    .where("${qf?.name ?? "field"}", "==", value)
    .limit(25)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Usage
const results = await query${pascalCase(col.name)}By${pascalCase(qf?.name ?? "field")}(${qf ? sampleValue(qf) : '"value"'});
console.log(\`Found \${results.length} documents\`);`;
    },

    realtime: (col) =>
`const admin = require("firebase-admin");
const db = admin.firestore();

// Real-time listener for "${col.name}"
const unsubscribe = db
  .collection("${col.path}")
  .limit(25)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = { id: change.doc.id, ...change.doc.data() };

      if (change.type === "added") console.log("New:", data);
      if (change.type === "modified") console.log("Modified:", data);
      if (change.type === "removed") console.log("Removed:", data);
    });
  });

// To stop: unsubscribe();`,
  },
};

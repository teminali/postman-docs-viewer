/**
 * Firestore Prompt Engine — Rule-based prompt & code generation for Firestore databases (no AI)
 *
 * Two modes:
 *   1. Generate Prompt  → structured Markdown prompt for AI tools (Cursor, Copilot, ChatGPT)
 *   2. Generate Code    → comprehensive Firebase SDK code snippets with types, error handling
 *
 * All output is deterministic, template-driven, zero-cost.
 */

import type {
  FirestoreSchema,
  FirestoreCollectionSchema,
  FirestoreFieldSchema,
  FirestoreFieldType,
} from "@/types/firestore-schema";

// ─── Types ─────────────────────────────────────────────────────────────

export type FirestoreFramework =
  | "typescript"
  | "javascript"
  | "react"
  | "nextjs"
  | "vue"
  | "python"
  | "flutter"
  | "swift"
  | "kotlin"
  | "nodejs";

export interface FirestoreFrameworkDef {
  id: FirestoreFramework;
  label: string;
  icon: string;
  language: string;
  fileExt: string;
  description: string;
}

export const FIRESTORE_FRAMEWORKS: FirestoreFrameworkDef[] = [
  { id: "typescript",  label: "TypeScript",  icon: "TS",  language: "typescript", fileExt: ".ts",   description: "Firebase SDK + strict types"        },
  { id: "javascript",  label: "JavaScript",  icon: "JS",  language: "javascript", fileExt: ".js",   description: "Firebase SDK"                       },
  { id: "react",       label: "React",       icon: "⚛",   language: "tsx",        fileExt: ".tsx",  description: "React hooks + Firebase"             },
  { id: "nextjs",      label: "Next.js",     icon: "▲",   language: "typescript", fileExt: ".ts",   description: "Server actions + Admin SDK"         },
  { id: "vue",         label: "Vue.js",      icon: "V",   language: "typescript", fileExt: ".ts",   description: "Composables + Firebase"             },
  { id: "python",      label: "Python",      icon: "🐍",  language: "python",     fileExt: ".py",   description: "firebase-admin SDK"                 },
  { id: "flutter",     label: "Flutter",     icon: "🐦",  language: "dart",       fileExt: ".dart", description: "cloud_firestore package"            },
  { id: "swift",       label: "Swift",       icon: "🍎",  language: "swift",      fileExt: ".swift",description: "FirebaseFirestore SDK"              },
  { id: "kotlin",      label: "Kotlin",      icon: "K",   language: "kotlin",     fileExt: ".kt",   description: "Firebase Android SDK"               },
  { id: "nodejs",      label: "Node.js",     icon: "⬢",   language: "typescript", fileExt: ".ts",   description: "firebase-admin server-side"         },
];

export interface FirestorePromptOptions {
  includeTypes: boolean;
  includeErrorHandling: boolean;
  includeCrud: boolean;
  includeRealtimeListeners: boolean;
  includeSecurityRules: boolean;
  includeTests: boolean;
}

export const DEFAULT_FIRESTORE_OPTIONS: FirestorePromptOptions = {
  includeTypes: true,
  includeErrorHandling: true,
  includeCrud: true,
  includeRealtimeListeners: true,
  includeSecurityRules: false,
  includeTests: false,
};

export type FirestoreGenerationMode = "prompt" | "code";

// ─── Prompt Templates ──────────────────────────────────────────────────

export type FirestoreTemplateId =
  | "implement"
  | "bugfix"
  | "update"
  | "refactor"
  | "test"
  | "migrate"
  | "document"
  | "optimize";

export interface FirestoreTemplateDef {
  id: FirestoreTemplateId;
  label: string;
  icon: string;
  description: string;
  taskPrefix: string;
  extraRequirements: string[];
  verb: string;
}

export const FIRESTORE_TEMPLATES: FirestoreTemplateDef[] = [
  {
    id: "implement",
    label: "Implement",
    icon: "🚀",
    description: "Build new Firestore integration from scratch",
    verb: "Implement",
    taskPrefix: "Create a **new Firestore integration** for the following collection(s). This is a fresh implementation — no existing code to worry about.",
    extraRequirements: [
      "Create clean, modular service/repository pattern for Firestore operations",
      "Follow Firebase SDK best practices for the target platform",
      "Include type-safe document converters",
    ],
  },
  {
    id: "bugfix",
    label: "Bug Fix",
    icon: "🐛",
    description: "Fix issues with existing Firestore integration",
    verb: "Debug & Fix",
    taskPrefix: "I have an **existing Firestore integration** that is **not working correctly**. Analyze the collection schema below and generate a corrected implementation.",
    extraRequirements: [
      "Pay attention to **field types** — Firestore timestamps, references, and nested maps are common bug sources",
      "Check for missing null/undefined handling on optional fields",
      "Verify security rules aren't blocking the operation",
    ],
  },
  {
    id: "update",
    label: "Update",
    icon: "✏️",
    description: "Enhance existing Firestore code with new features",
    verb: "Update",
    taskPrefix: "I need to **update an existing Firestore integration** to support additional features or collection changes.",
    extraRequirements: [
      "Preserve backward compatibility with existing document structure",
      "Handle migration of existing documents if schema changed",
      "Update type definitions to match new fields",
    ],
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: "♻️",
    description: "Improve Firestore code quality and architecture",
    verb: "Refactor",
    taskPrefix: "**Refactor** the following Firestore integration for better code quality, performance, and maintainability.",
    extraRequirements: [
      "Extract reusable Firestore utility functions",
      "Implement proper data access layer / repository pattern",
      "Add batch operations where multiple writes occur",
      "Use Firestore converters for type-safe reads/writes",
    ],
  },
  {
    id: "test",
    label: "Test",
    icon: "✅",
    description: "Generate tests for Firestore operations",
    verb: "Write Tests for",
    taskPrefix: "Generate **comprehensive tests** for the following Firestore collection integration.",
    extraRequirements: [
      "Use Firebase Emulator Suite for local testing",
      "Test CRUD operations, queries, and real-time listeners",
      "Test security rules if provided",
      "Include edge cases: empty collections, missing fields, concurrent writes",
    ],
  },
  {
    id: "migrate",
    label: "Migrate",
    icon: "📦",
    description: "Migrate data or code between Firestore structures",
    verb: "Migrate",
    taskPrefix: "Create a **migration plan and script** for the following Firestore collection(s).",
    extraRequirements: [
      "Generate batch migration scripts that handle large collections",
      "Include rollback capability",
      "Handle subcollection migration",
      "Use Firestore batched writes (max 500 per batch)",
    ],
  },
  {
    id: "document",
    label: "Document",
    icon: "📄",
    description: "Generate documentation for Firestore schema",
    verb: "Document",
    taskPrefix: "Generate **comprehensive documentation** for the following Firestore collection(s) and their schema.",
    extraRequirements: [
      "Document all fields with types, required/optional status, and descriptions",
      "Include data relationship diagrams (references between collections)",
      "Document security rules and access patterns",
      "Add example documents with realistic data",
    ],
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: "⚡",
    description: "Optimize Firestore queries and data model",
    verb: "Optimize",
    taskPrefix: "**Optimize** the following Firestore collection(s) for better performance, lower costs, and scalability.",
    extraRequirements: [
      "Suggest composite indexes for common query patterns",
      "Identify denormalization opportunities to reduce read costs",
      "Recommend collection group queries where applicable",
      "Flag potential hot-spotting issues",
      "Suggest caching strategies",
    ],
  },
];

// ─── Collection info helper ──────────────────────────────────────────

export interface CollectionInfo {
  name: string;
  path: string;
  fieldCount: number;
  sampleDocCount: number;
  subcollectionCount: number;
}

export function getCollectionList(schema: FirestoreSchema): CollectionInfo[] {
  const out: CollectionInfo[] = [];
  function walk(col: FirestoreCollectionSchema) {
    out.push({
      name: col.name,
      path: col.path,
      fieldCount: col.fields.length,
      sampleDocCount: col.sampleDocCount,
      subcollectionCount: col.subcollections.length,
    });
    col.subcollections.forEach(walk);
  }
  schema.collections.forEach(walk);
  return out;
}

export function resolveCollections(
  schema: FirestoreSchema,
  selectedPaths: string[]
): FirestoreCollectionSchema[] {
  if (selectedPaths.length === 0) return [];
  const out: FirestoreCollectionSchema[] = [];
  function walk(col: FirestoreCollectionSchema) {
    if (selectedPaths.includes(col.path)) out.push(col);
    col.subcollections.forEach(walk);
  }
  schema.collections.forEach(walk);
  return out;
}

function allCollectionsFlat(schema: FirestoreSchema): FirestoreCollectionSchema[] {
  const out: FirestoreCollectionSchema[] = [];
  function walk(col: FirestoreCollectionSchema) {
    out.push(col);
    col.subcollections.forEach(walk);
  }
  schema.collections.forEach(walk);
  return out;
}

// ─── Main generate function ──────────────────────────────────────────

export function firestoreGenerate(
  mode: FirestoreGenerationMode,
  framework: FirestoreFramework,
  collections: FirestoreCollectionSchema[],
  schema: FirestoreSchema,
  options: FirestorePromptOptions,
  template?: FirestoreTemplateId,
): string {
  if (mode === "prompt") {
    return generatePrompt(framework, collections, schema, options, template);
  }
  return generateCode(framework, collections, schema, options);
}

// ─── Helpers ──────────────────────────────────────────────────────────

function pascalCase(str: string): string {
  return str.replace(/(^|[-_])(.)/g, (_, __, c) => (c as string).toUpperCase());
}

function camelCase(str: string): string {
  const pc = pascalCase(str);
  return pc.charAt(0).toLowerCase() + pc.slice(1);
}

function singularize(name: string): string {
  if (name.endsWith("ies")) return name.slice(0, -3) + "y";
  if (name.endsWith("ses")) return name.slice(0, -2);
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}

function fsTypeToTs(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "string";
    case "number": return "number";
    case "boolean": return "boolean";
    case "timestamp": return "Timestamp";
    case "array": return "unknown[]";
    case "map": return "Record<string, unknown>";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "null";
    default: return "unknown";
  }
}

function fsTypeToPython(ft: FirestoreFieldType): string {
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

function fsTypeToDart(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return "String";
    case "number": return "num";
    case "boolean": return "bool";
    case "timestamp": return "Timestamp";
    case "array": return "List<dynamic>";
    case "map": return "Map<String, dynamic>";
    case "reference": return "DocumentReference";
    case "geopoint": return "GeoPoint";
    case "null": return "void";
    default: return "dynamic";
  }
}

function fsTypeToSwift(ft: FirestoreFieldType): string {
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

function fsTypeToKotlin(ft: FirestoreFieldType): string {
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

function fieldIsRequired(f: FirestoreFieldSchema): boolean {
  return f.frequency === f.sampleSize;
}

function formatFieldForPrompt(f: FirestoreFieldSchema, indent: number = 0): string {
  const pad = "  ".repeat(indent);
  const required = fieldIsRequired(f) ? "required" : "optional";
  let line = `${pad}- **${f.name}** \`${f.type}\` — ${required} (${f.frequency}/${f.sampleSize} docs)`;
  if (f.nestedFields && f.nestedFields.length > 0) {
    line += "\n" + f.nestedFields.map((nf) => formatFieldForPrompt(nf, indent + 1)).join("\n");
  }
  return line;
}

function formatCollectionForPrompt(col: FirestoreCollectionSchema): string {
  const lines: string[] = [];
  lines.push(`### Collection: \`${col.path}\``);
  lines.push(`- **Sample docs**: ${col.sampleDocCount}`);
  lines.push(`- **Fields**: ${col.fields.length}`);
  if (col.subcollections.length > 0) {
    lines.push(`- **Subcollections**: ${col.subcollections.map((s) => s.name).join(", ")}`);
  }
  lines.push("");
  lines.push("**Schema:**");
  col.fields.forEach((f) => {
    lines.push(formatFieldForPrompt(f));
  });
  if (col.rules) {
    lines.push("");
    lines.push("**Security rules:**");
    lines.push("```");
    lines.push(col.rules);
    lines.push("```");
  }
  return lines.join("\n");
}

function frameworkGuidelines(fw: FirestoreFramework): string {
  switch (fw) {
    case "typescript":
    case "javascript":
      return "Use Firebase Web SDK v9+ (modular imports: `getFirestore`, `collection`, `getDocs`, etc.). Prefer modular tree-shakeable imports.";
    case "react":
      return "Create custom React hooks (e.g. `useCollection`, `useDocument`). Use Firebase Web SDK v9+. Handle loading/error states with useState/useEffect.";
    case "nextjs":
      return "Use Firebase Admin SDK for server components/actions. Use Web SDK v9+ for client components. Leverage Next.js App Router patterns.";
    case "vue":
      return "Create Vue composables (e.g. `useFirestore`). Use Firebase Web SDK v9+. Leverage `ref()`, `computed()`, and `onUnmounted()` for cleanup.";
    case "python":
      return "Use `firebase-admin` SDK. Use type hints and dataclasses for document models. Handle async operations properly.";
    case "flutter":
      return "Use `cloud_firestore` package. Create model classes with `fromFirestore`/`toFirestore` factory methods. Use `StreamBuilder` for real-time data.";
    case "swift":
      return "Use `FirebaseFirestore` SDK. Implement `Codable` protocol for document models. Use async/await for Firestore operations.";
    case "kotlin":
      return "Use Firebase Android SDK with Kotlin coroutines. Implement data classes with `@DocumentId` annotation. Use Flow for real-time listeners.";
    case "nodejs":
      return "Use `firebase-admin` SDK. Implement proper service layer. Use batched writes for bulk operations.";
    default:
      return "";
  }
}

// ─── Prompt Generation ──────────────────────────────────────────────

function generatePrompt(
  framework: FirestoreFramework,
  collections: FirestoreCollectionSchema[],
  schema: FirestoreSchema,
  options: FirestorePromptOptions,
  templateId?: FirestoreTemplateId,
): string {
  const fw = FIRESTORE_FRAMEWORKS.find((f) => f.id === framework)!;
  const tpl = templateId ? FIRESTORE_TEMPLATES.find((t) => t.id === templateId) : undefined;

  const lines: string[] = [];

  // Header
  const verb = tpl?.verb ?? "Implement";
  lines.push(`# ${verb} Firestore Integration — ${fw.label}`);
  lines.push("");

  // Task prefix
  if (tpl) {
    lines.push(`## Task`);
    lines.push(tpl.taskPrefix);
    lines.push("");
  }

  // Project context
  lines.push("## Project Context");
  lines.push(`- **Database**: Firestore (project: ${schema.projectName})`);
  lines.push(`- **Target framework**: ${fw.label}`);
  lines.push(`- **Total collections**: ${schema.collections.length}`);
  lines.push(`- **Collections in scope**: ${collections.length}`);
  if (schema.indexes.length > 0) {
    lines.push(`- **Composite indexes**: ${schema.indexes.length}`);
  }
  lines.push("");

  // Framework guidelines
  lines.push("## Framework Guidelines");
  lines.push(frameworkGuidelines(framework));
  lines.push("");

  // Collections schema
  lines.push("## Collection Schemas");
  lines.push("");
  for (const col of collections) {
    lines.push(formatCollectionForPrompt(col));
    lines.push("");
  }

  // Indexes (if relevant collections have indexes)
  const relevantIndexes = schema.indexes.filter((idx) =>
    collections.some((c) => c.name === idx.collectionGroup || c.path.includes(idx.collectionGroup))
  );
  if (relevantIndexes.length > 0) {
    lines.push("## Composite Indexes");
    for (const idx of relevantIndexes) {
      lines.push(
        `- **${idx.collectionGroup}** (${idx.queryScope}): ${idx.fields.map((f) => `${f.fieldPath} ${f.order || f.arrayConfig || ""}`).join(", ")}`
      );
    }
    lines.push("");
  }

  // Security rules
  if (options.includeSecurityRules && schema.rawRules) {
    lines.push("## Security Rules");
    lines.push("```");
    lines.push(schema.rawRules.slice(0, 2000));
    lines.push("```");
    lines.push("");
  }

  // Requirements
  lines.push("## Requirements");
  lines.push("");
  if (options.includeTypes) {
    lines.push("- Generate **type-safe models/interfaces** for each collection's document structure");
  }
  if (options.includeCrud) {
    lines.push("- Implement **CRUD operations** (create, read, update, delete) for each collection");
  }
  if (options.includeRealtimeListeners) {
    lines.push("- Include **real-time listeners** for live data updates");
  }
  if (options.includeErrorHandling) {
    lines.push("- Add **comprehensive error handling** (network errors, permission denied, not found)");
  }
  if (options.includeSecurityRules) {
    lines.push("- Ensure operations respect **security rules** — handle permission errors gracefully");
  }
  if (options.includeTests) {
    lines.push("- Include **unit tests** using Firebase Emulator Suite");
  }

  // Template-specific requirements
  if (tpl && tpl.extraRequirements.length > 0) {
    lines.push("");
    lines.push("### Additional Requirements");
    tpl.extraRequirements.forEach((r) => lines.push(`- ${r}`));
  }

  lines.push("");
  lines.push("## Output Format");
  lines.push(`Generate a single \`${fw.fileExt}\` file with:`);
  lines.push("1. Type definitions / models at the top");
  lines.push("2. Firestore service/helper functions");
  lines.push("3. Usage examples at the bottom");

  return lines.join("\n");
}

// ─── Code Generation ────────────────────────────────────────────────

function generateCode(
  framework: FirestoreFramework,
  collections: FirestoreCollectionSchema[],
  schema: FirestoreSchema,
  options: FirestorePromptOptions,
): string {
  const gen = codeGenerators[framework];
  if (!gen) return `// Code generation not available for ${framework}`;
  return gen(collections, schema, options);
}

// ─── Code generators per framework ─────────────────────────────────

type CodeGen = (
  cols: FirestoreCollectionSchema[],
  schema: FirestoreSchema,
  opts: FirestorePromptOptions,
) => string;

const codeGenerators: Record<FirestoreFramework, CodeGen> = {
  typescript: genTypeScript,
  javascript: genJavaScript,
  react: genReact,
  nextjs: genNextjs,
  vue: genVue,
  python: genPython,
  flutter: genFlutter,
  swift: genSwift,
  kotlin: genKotlin,
  nodejs: genNodejs,
};

// ── TypeScript ──

function genTypeScript(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Firestore Client`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push('import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, Timestamp, type DocumentReference } from "firebase/firestore";');
  lines.push('import { app } from "./firebase-config"; // Your Firebase app instance');
  lines.push("");
  lines.push("const db = getFirestore(app);");
  lines.push("");

  // Types
  if (opts.includeTypes) {
    lines.push("// ─── Types ───────────────────────────────────────────");
    lines.push("");
    for (const col of cols) {
      const typeName = pascalCase(singularize(col.name));
      lines.push(`export interface ${typeName} {`);
      lines.push("  id: string;");
      for (const f of col.fields) {
        const opt = fieldIsRequired(f) ? "" : "?";
        lines.push(`  ${f.name}${opt}: ${fsTypeToTs(f.type)};`);
      }
      lines.push("}");
      lines.push("");
    }
  }

  // CRUD
  if (opts.includeCrud) {
    lines.push("// ─── CRUD Operations ─────────────────────────────────");
    lines.push("");
    for (const col of cols) {
      const typeName = pascalCase(singularize(col.name));
      const varName = camelCase(col.name);
      const collPath = col.path;

      lines.push(`// --- ${col.name} ---`);
      lines.push("");

      // getAll
      lines.push(`export async function getAll${pascalCase(col.name)}(): Promise<${typeName}[]> {`);
      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    const snap = await getDocs(collection(db, "${collPath}"));`);
        lines.push(`    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName}));`);
        lines.push("  } catch (error) {");
        lines.push(`    console.error("Error fetching ${col.name}:", error);`);
        lines.push("    throw error;");
        lines.push("  }");
      } else {
        lines.push(`  const snap = await getDocs(collection(db, "${collPath}"));`);
        lines.push(`  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName}));`);
      }
      lines.push("}");
      lines.push("");

      // getById
      lines.push(`export async function get${typeName}ById(id: string): Promise<${typeName} | null> {`);
      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    const snap = await getDoc(doc(db, "${collPath}", id));`);
        lines.push(`    return snap.exists() ? { id: snap.id, ...snap.data() } as ${typeName} : null;`);
        lines.push("  } catch (error) {");
        lines.push(`    console.error("Error fetching ${singularize(col.name)}:", error);`);
        lines.push("    throw error;");
        lines.push("  }");
      } else {
        lines.push(`  const snap = await getDoc(doc(db, "${collPath}", id));`);
        lines.push(`  return snap.exists() ? { id: snap.id, ...snap.data() } as ${typeName} : null;`);
      }
      lines.push("}");
      lines.push("");

      // create
      lines.push(`export async function create${typeName}(data: Omit<${typeName}, "id">): Promise<string> {`);
      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    const ref = await addDoc(collection(db, "${collPath}"), data);`);
        lines.push("    return ref.id;");
        lines.push("  } catch (error) {");
        lines.push(`    console.error("Error creating ${singularize(col.name)}:", error);`);
        lines.push("    throw error;");
        lines.push("  }");
      } else {
        lines.push(`  const ref = await addDoc(collection(db, "${collPath}"), data);`);
        lines.push("  return ref.id;");
      }
      lines.push("}");
      lines.push("");

      // update
      lines.push(`export async function update${typeName}(id: string, data: Partial<Omit<${typeName}, "id">>): Promise<void> {`);
      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    await updateDoc(doc(db, "${collPath}", id), data);`);
        lines.push("  } catch (error) {");
        lines.push(`    console.error("Error updating ${singularize(col.name)}:", error);`);
        lines.push("    throw error;");
        lines.push("  }");
      } else {
        lines.push(`  await updateDoc(doc(db, "${collPath}", id), data);`);
      }
      lines.push("}");
      lines.push("");

      // delete
      lines.push(`export async function delete${typeName}(id: string): Promise<void> {`);
      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    await deleteDoc(doc(db, "${collPath}", id));`);
        lines.push("  } catch (error) {");
        lines.push(`    console.error("Error deleting ${singularize(col.name)}:", error);`);
        lines.push("    throw error;");
        lines.push("  }");
      } else {
        lines.push(`  await deleteDoc(doc(db, "${collPath}", id));`);
      }
      lines.push("}");
      lines.push("");

      // realtime
      if (opts.includeRealtimeListeners) {
        lines.push(`export function on${pascalCase(col.name)}Change(callback: (data: ${typeName}[]) => void) {`);
        lines.push(`  return onSnapshot(collection(db, "${collPath}"), (snap) => {`);
        lines.push(`    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName}));`);
        lines.push("    callback(data);");
        lines.push("  });");
        lines.push("}");
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

// ── JavaScript ──

function genJavaScript(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  // Same as TypeScript but without types
  let code = genTypeScript(cols, schema, { ...opts, includeTypes: false });
  code = code.replace(/: Promise<[^>]+>/g, "");
  code = code.replace(/: string/g, "");
  code = code.replace(/: void/g, "");
  code = code.replace(/: \([^)]+\) => void/g, "");
  code = code.replace(/Omit<[^>]+>/g, "Object");
  code = code.replace(/Partial<[^>]+>/g, "Object");
  code = code.replace(/, type DocumentReference/g, "");
  code = code.replace(/ as \w+/g, "");
  code = code.replace(/\| null/g, "");
  return code;
}

// ── React ──

function genReact(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — React Firestore Hooks`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push('import { useState, useEffect, useCallback } from "react";');
  lines.push('import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, Timestamp, type DocumentReference } from "firebase/firestore";');
  lines.push('import { app } from "./firebase-config";');
  lines.push("");
  lines.push("const db = getFirestore(app);");
  lines.push("");

  // Types
  if (opts.includeTypes) {
    for (const col of cols) {
      const typeName = pascalCase(singularize(col.name));
      lines.push(`export interface ${typeName} {`);
      lines.push("  id: string;");
      for (const f of col.fields) {
        const opt = fieldIsRequired(f) ? "" : "?";
        lines.push(`  ${f.name}${opt}: ${fsTypeToTs(f.type)};`);
      }
      lines.push("}");
      lines.push("");
    }
  }

  // Hooks
  for (const col of cols) {
    const typeName = pascalCase(singularize(col.name));
    const hookName = `use${pascalCase(col.name)}`;

    lines.push(`// ─── ${hookName} ─────────────────────────────────`);
    lines.push("");
    lines.push(`export function ${hookName}() {`);
    lines.push(`  const [data, setData] = useState<${typeName}[]>([]);`);
    lines.push("  const [loading, setLoading] = useState(true);");
    lines.push("  const [error, setError] = useState<Error | null>(null);");
    lines.push("");
    lines.push("  useEffect(() => {");
    if (opts.includeRealtimeListeners) {
      lines.push(`    const unsub = onSnapshot(collection(db, "${col.path}"),`);
      lines.push("      (snap) => {");
      lines.push(`        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName})));`);
      lines.push("        setLoading(false);");
      lines.push("      },");
      lines.push("      (err) => { setError(err); setLoading(false); }");
      lines.push("    );");
      lines.push("    return unsub;");
    } else {
      lines.push(`    getDocs(collection(db, "${col.path}"))`);
      lines.push(`      .then((snap) => setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName}))))`);
      lines.push("      .catch(setError)");
      lines.push("      .finally(() => setLoading(false));");
    }
    lines.push("  }, []);");
    lines.push("");

    if (opts.includeCrud) {
      lines.push(`  const add = useCallback(async (item: Omit<${typeName}, "id">) => {`);
      lines.push(`    const ref = await addDoc(collection(db, "${col.path}"), item);`);
      lines.push("    return ref.id;");
      lines.push("  }, []);");
      lines.push("");
      lines.push(`  const update = useCallback(async (id: string, updates: Partial<Omit<${typeName}, "id">>) => {`);
      lines.push(`    await updateDoc(doc(db, "${col.path}", id), updates);`);
      lines.push("  }, []);");
      lines.push("");
      lines.push("  const remove = useCallback(async (id: string) => {");
      lines.push(`    await deleteDoc(doc(db, "${col.path}", id));`);
      lines.push("  }, []);");
      lines.push("");
      lines.push("  return { data, loading, error, add, update, remove };");
    } else {
      lines.push("  return { data, loading, error };");
    }
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

// ── Next.js ──

function genNextjs(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Next.js Server Actions (Firestore)`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push('"use server";');
  lines.push("");
  lines.push('import { getFirestore } from "firebase-admin/firestore";');
  lines.push('import { initializeApp, getApps, cert } from "firebase-admin/app";');
  lines.push("");
  lines.push("if (!getApps().length) {");
  lines.push("  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)) });");
  lines.push("}");
  lines.push("");
  lines.push("const db = getFirestore();");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const typeName = pascalCase(singularize(col.name));
      lines.push(`export interface ${typeName} {`);
      lines.push("  id: string;");
      for (const f of col.fields) {
        const opt = fieldIsRequired(f) ? "" : "?";
        lines.push(`  ${f.name}${opt}: ${fsTypeToTs(f.type)};`);
      }
      lines.push("}");
      lines.push("");
    }
  }

  for (const col of cols) {
    const typeName = pascalCase(singularize(col.name));
    lines.push(`// ─── ${col.name} actions ──────────────────────────`);
    lines.push("");
    lines.push(`export async function getAll${pascalCase(col.name)}() {`);
    lines.push(`  const snap = await db.collection("${col.path}").get();`);
    lines.push(`  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ${typeName}[];`);
    lines.push("}");
    lines.push("");
    lines.push(`export async function get${typeName}(id: string) {`);
    lines.push(`  const doc = await db.collection("${col.path}").doc(id).get();`);
    lines.push(`  return doc.exists ? { id: doc.id, ...doc.data() } as ${typeName} : null;`);
    lines.push("}");
    lines.push("");
    if (opts.includeCrud) {
      lines.push(`export async function create${typeName}(data: Omit<${typeName}, "id">) {`);
      lines.push(`  const ref = await db.collection("${col.path}").add(data);`);
      lines.push("  return ref.id;");
      lines.push("}");
      lines.push("");
      lines.push(`export async function update${typeName}(id: string, data: Partial<Omit<${typeName}, "id">>) {`);
      lines.push(`  await db.collection("${col.path}").doc(id).update(data);`);
      lines.push("}");
      lines.push("");
      lines.push(`export async function delete${typeName}(id: string) {`);
      lines.push(`  await db.collection("${col.path}").doc(id).delete();`);
      lines.push("}");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Vue ──

function genVue(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Vue Composables (Firestore)`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push('import { ref, onUnmounted } from "vue";');
  lines.push('import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, type DocumentReference, Timestamp } from "firebase/firestore";');
  lines.push('import { app } from "./firebase-config";');
  lines.push("");
  lines.push("const db = getFirestore(app);");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const typeName = pascalCase(singularize(col.name));
      lines.push(`export interface ${typeName} {`);
      lines.push("  id: string;");
      for (const f of col.fields) {
        const opt = fieldIsRequired(f) ? "" : "?";
        lines.push(`  ${f.name}${opt}: ${fsTypeToTs(f.type)};`);
      }
      lines.push("}");
      lines.push("");
    }
  }

  for (const col of cols) {
    const typeName = pascalCase(singularize(col.name));
    const composable = `use${pascalCase(col.name)}`;

    lines.push(`export function ${composable}() {`);
    lines.push(`  const data = ref<${typeName}[]>([]);`);
    lines.push("  const loading = ref(true);");
    lines.push("  const error = ref<Error | null>(null);");
    lines.push("");
    if (opts.includeRealtimeListeners) {
      lines.push(`  const unsub = onSnapshot(collection(db, "${col.path}"),`);
      lines.push("    (snap) => {");
      lines.push(`      data.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName}));`);
      lines.push("      loading.value = false;");
      lines.push("    },");
      lines.push("    (err) => { error.value = err; loading.value = false; }");
      lines.push("  );");
      lines.push("  onUnmounted(unsub);");
    } else {
      lines.push(`  getDocs(collection(db, "${col.path}"))`);
      lines.push(`    .then((snap) => { data.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ${typeName})); })`);
      lines.push("    .catch((e) => { error.value = e; })");
      lines.push("    .finally(() => { loading.value = false; });");
    }
    lines.push("");
    lines.push("  return { data, loading, error };");
    lines.push("}");
    lines.push("");
  }

  return lines.join("\n");
}

// ── Python ──

function genPython(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`# ${schema.projectName} — Python Firestore Client`);
  lines.push("# Auto-generated by Docs Viewer");
  lines.push("");
  lines.push("import firebase_admin");
  lines.push("from firebase_admin import credentials, firestore");
  if (opts.includeTypes) {
    lines.push("from dataclasses import dataclass, field, asdict");
    lines.push("from typing import Optional, List, Any");
    lines.push("from datetime import datetime");
  }
  lines.push("");
  lines.push("# Initialize Firebase");
  lines.push('cred = credentials.Certificate("service-account.json")');
  lines.push("firebase_admin.initialize_app(cred)");
  lines.push("db = firestore.client()");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const className = pascalCase(singularize(col.name));
      lines.push("@dataclass");
      lines.push(`class ${className}:`);
      lines.push("    id: str");
      for (const f of col.fields) {
        const pyType = fsTypeToPython(f.type);
        if (fieldIsRequired(f)) {
          lines.push(`    ${f.name}: ${pyType}`);
        } else {
          lines.push(`    ${f.name}: Optional[${pyType}] = None`);
        }
      }
      lines.push("");
      lines.push("    @classmethod");
      lines.push(`    def from_doc(cls, doc) -> "${className}":`);
      lines.push("        data = doc.to_dict() or {}");
      lines.push(`        return cls(id=doc.id, **{k: v for k, v in data.items() if k in cls.__dataclass_fields__})`);
      lines.push("");
    }
  }

  if (opts.includeCrud) {
    for (const col of cols) {
      const className = pascalCase(singularize(col.name));
      lines.push(`# ─── ${col.name} ───────────────────────────────────`);
      lines.push("");
      lines.push(`def get_all_${col.name}():`);
      if (opts.includeErrorHandling) {
        lines.push("    try:");
        lines.push(`        docs = db.collection("${col.path}").stream()`);
        lines.push(`        return [${className}.from_doc(d) for d in docs]`);
        lines.push("    except Exception as e:");
        lines.push(`        print(f"Error fetching ${col.name}: {e}")`);
        lines.push("        raise");
      } else {
        lines.push(`    docs = db.collection("${col.path}").stream()`);
        lines.push(`    return [${className}.from_doc(d) for d in docs]`);
      }
      lines.push("");
      lines.push(`def get_${singularize(col.name)}_by_id(doc_id: str):`);
      lines.push(`    doc = db.collection("${col.path}").document(doc_id).get()`);
      lines.push(`    return ${className}.from_doc(doc) if doc.exists else None`);
      lines.push("");
      lines.push(`def create_${singularize(col.name)}(data: dict):`);
      lines.push(`    _, ref = db.collection("${col.path}").add(data)`);
      lines.push("    return ref.id");
      lines.push("");
      lines.push(`def update_${singularize(col.name)}(doc_id: str, data: dict):`);
      lines.push(`    db.collection("${col.path}").document(doc_id).update(data)`);
      lines.push("");
      lines.push(`def delete_${singularize(col.name)}(doc_id: str):`);
      lines.push(`    db.collection("${col.path}").document(doc_id).delete()`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Flutter ──

function genFlutter(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Flutter Firestore Service`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push("import 'package:cloud_firestore/cloud_firestore.dart';");
  lines.push("");
  lines.push("final _db = FirebaseFirestore.instance;");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const className = pascalCase(singularize(col.name));
      lines.push(`class ${className} {`);
      lines.push("  final String id;");
      for (const f of col.fields) {
        const dartType = fsTypeToDart(f.type);
        const nullable = fieldIsRequired(f) ? "" : "?";
        lines.push(`  final ${dartType}${nullable} ${camelCase(f.name)};`);
      }
      lines.push("");
      lines.push(`  ${className}({`);
      lines.push("    required this.id,");
      for (const f of col.fields) {
        const req = fieldIsRequired(f) ? "required " : "";
        lines.push(`    ${req}this.${camelCase(f.name)},`);
      }
      lines.push("  });");
      lines.push("");
      lines.push(`  factory ${className}.fromFirestore(DocumentSnapshot doc) {`);
      lines.push("    final data = doc.data() as Map<String, dynamic>;");
      lines.push(`    return ${className}(`);
      lines.push("      id: doc.id,");
      for (const f of col.fields) {
        lines.push(`      ${camelCase(f.name)}: data['${f.name}'],`);
      }
      lines.push("    );");
      lines.push("  }");
      lines.push("");
      lines.push("  Map<String, dynamic> toFirestore() => {");
      for (const f of col.fields) {
        lines.push(`    '${f.name}': ${camelCase(f.name)},`);
      }
      lines.push("  };");
      lines.push("}");
      lines.push("");
    }
  }

  if (opts.includeCrud) {
    for (const col of cols) {
      const className = pascalCase(singularize(col.name));
      const svcName = `${className}Service`;
      lines.push(`class ${svcName} {`);
      lines.push(`  final _ref = _db.collection('${col.path}');`);
      lines.push("");
      lines.push(`  Future<List<${className}>> getAll() async {`);
      lines.push("    final snap = await _ref.get();");
      lines.push(`    return snap.docs.map((d) => ${className}.fromFirestore(d)).toList();`);
      lines.push("  }");
      lines.push("");
      lines.push(`  Future<${className}?> getById(String id) async {`);
      lines.push("    final doc = await _ref.doc(id).get();");
      lines.push(`    return doc.exists ? ${className}.fromFirestore(doc) : null;`);
      lines.push("  }");
      lines.push("");
      lines.push(`  Future<String> create(Map<String, dynamic> data) async {`);
      lines.push("    final ref = await _ref.add(data);");
      lines.push("    return ref.id;");
      lines.push("  }");
      lines.push("");
      lines.push("  Future<void> update(String id, Map<String, dynamic> data) async {");
      lines.push("    await _ref.doc(id).update(data);");
      lines.push("  }");
      lines.push("");
      lines.push("  Future<void> delete(String id) async {");
      lines.push("    await _ref.doc(id).delete();");
      lines.push("  }");
      if (opts.includeRealtimeListeners) {
        lines.push("");
        lines.push(`  Stream<List<${className}>> stream() {`);
        lines.push(`    return _ref.snapshots().map((s) => s.docs.map((d) => ${className}.fromFirestore(d)).toList());`);
        lines.push("  }");
      }
      lines.push("}");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Swift ──

function genSwift(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Swift Firestore Service`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push("import FirebaseFirestore");
  lines.push("");
  lines.push("let db = Firestore.firestore()");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const name = pascalCase(singularize(col.name));
      lines.push(`struct ${name}: Codable, Identifiable {`);
      lines.push("    var id: String");
      for (const f of col.fields) {
        const swType = fsTypeToSwift(f.type);
        const opt = fieldIsRequired(f) ? "" : "?";
        lines.push(`    var ${camelCase(f.name)}: ${swType}${opt}`);
      }
      lines.push("}");
      lines.push("");
    }
  }

  if (opts.includeCrud) {
    for (const col of cols) {
      const name = pascalCase(singularize(col.name));
      lines.push(`// ─── ${col.name} ──────────────────────────────────`);
      lines.push("");
      lines.push(`func fetchAll${pascalCase(col.name)}() async throws -> [${name}] {`);
      lines.push(`    let snapshot = try await db.collection("${col.path}").getDocuments()`);
      lines.push(`    return try snapshot.documents.compactMap { try $0.data(as: ${name}.self) }`);
      lines.push("}");
      lines.push("");
      lines.push(`func fetch${name}(id: String) async throws -> ${name}? {`);
      lines.push(`    let doc = try await db.collection("${col.path}").document(id).getDocument()`);
      lines.push(`    return try doc.data(as: ${name}.self)`);
      lines.push("}");
      lines.push("");
      lines.push(`func create${name}(_ item: ${name}) async throws {`);
      lines.push(`    try db.collection("${col.path}").addDocument(from: item)`);
      lines.push("}");
      lines.push("");
      lines.push(`func delete${name}(id: String) async throws {`);
      lines.push(`    try await db.collection("${col.path}").document(id).delete()`);
      lines.push("}");
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ── Kotlin ──

function genKotlin(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  const lines: string[] = [];
  lines.push(`// ${schema.projectName} — Kotlin Firestore Repository`);
  lines.push("// Auto-generated by Docs Viewer");
  lines.push("");
  lines.push("import com.google.firebase.firestore.FirebaseFirestore");
  lines.push("import com.google.firebase.firestore.DocumentId");
  lines.push("import kotlinx.coroutines.tasks.await");
  lines.push("");
  lines.push("val db = FirebaseFirestore.getInstance()");
  lines.push("");

  if (opts.includeTypes) {
    for (const col of cols) {
      const name = pascalCase(singularize(col.name));
      lines.push(`data class ${name}(`);
      lines.push('    @DocumentId val id: String = "",');
      for (const f of col.fields) {
        const ktType = fsTypeToKotlin(f.type);
        const def = fieldIsRequired(f) ? "" : "?";
        const defVal = fieldIsRequired(f) ? ` = ${ktDefault(f.type)}` : " = null";
        lines.push(`    val ${camelCase(f.name)}: ${ktType}${def}${defVal},`);
      }
      lines.push(")");
      lines.push("");
    }
  }

  if (opts.includeCrud) {
    for (const col of cols) {
      const name = pascalCase(singularize(col.name));
      const repoName = `${name}Repository`;
      lines.push(`object ${repoName} {`);
      lines.push(`    private val ref = db.collection("${col.path}")`);
      lines.push("");
      lines.push(`    suspend fun getAll(): List<${name}> {`);
      lines.push("        val snap = ref.get().await()");
      lines.push(`        return snap.toObjects(${name}::class.java)`);
      lines.push("    }");
      lines.push("");
      lines.push(`    suspend fun getById(id: String): ${name}? {`);
      lines.push("        val doc = ref.document(id).get().await()");
      lines.push(`        return doc.toObject(${name}::class.java)`);
      lines.push("    }");
      lines.push("");
      lines.push(`    suspend fun create(item: ${name}): String {`);
      lines.push("        val doc = ref.add(item).await()");
      lines.push("        return doc.id");
      lines.push("    }");
      lines.push("");
      lines.push("    suspend fun delete(id: String) {");
      lines.push("        ref.document(id).delete().await()");
      lines.push("    }");
      lines.push("}");
      lines.push("");
    }
  }

  return lines.join("\n");
}

function ktDefault(ft: FirestoreFieldType): string {
  switch (ft) {
    case "string": return '""';
    case "number": return "0.0";
    case "boolean": return "false";
    default: return '""';
  }
}

// ── Node.js (Admin SDK) ──

function genNodejs(cols: FirestoreCollectionSchema[], schema: FirestoreSchema, opts: FirestorePromptOptions): string {
  return genNextjs(cols, schema, opts).replace('"use server";', "").replace("Next.js Server Actions", "Node.js Admin SDK");
}

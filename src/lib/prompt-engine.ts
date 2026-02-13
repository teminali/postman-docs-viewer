/**
 * Prompt Engine — Rule-based prompt & code generation (no AI)
 *
 * Two modes:
 *   1. Generate Prompt  → structured Markdown prompt for AI tools (Cursor, Copilot, ChatGPT)
 *   2. Generate Code    → comprehensive code snippets with types, error handling, auth
 *
 * All output is deterministic, template-driven, zero-cost.
 */

import type { ParsedEndpoint, FolderNode } from "@/types/postman";
import type { ParsedCollection } from "@/lib/postman-parser";

// ─── Types ─────────────────────────────────────────────────────────────

export type PromptFramework =
  | "typescript"
  | "javascript"
  | "react"
  | "nextjs"
  | "vue"
  | "python"
  | "flutter"
  | "swift"
  | "kotlin"
  | "nodejs"
  | "curl";

export interface FrameworkDef {
  id: PromptFramework;
  label: string;
  icon: string;
  language: string; // highlight language
  fileExt: string;
  description: string;
}

export const FRAMEWORKS: FrameworkDef[] = [
  { id: "typescript",  label: "TypeScript",  icon: "TS",  language: "typescript", fileExt: ".ts",   description: "Fetch + strict types"          },
  { id: "javascript",  label: "JavaScript",  icon: "JS",  language: "javascript", fileExt: ".js",   description: "Fetch API"                     },
  { id: "react",       label: "React",       icon: "⚛",   language: "tsx",        fileExt: ".tsx",  description: "Custom hooks + TypeScript"     },
  { id: "nextjs",      label: "Next.js",     icon: "▲",   language: "typescript", fileExt: ".ts",   description: "App Router server actions"     },
  { id: "vue",         label: "Vue.js",      icon: "V",   language: "typescript", fileExt: ".ts",   description: "Composables + TypeScript"      },
  { id: "python",      label: "Python",      icon: "🐍",  language: "python",     fileExt: ".py",   description: "requests / httpx"              },
  { id: "flutter",     label: "Flutter",     icon: "🐦",  language: "dart",       fileExt: ".dart", description: "Dart + http package"           },
  { id: "swift",       label: "Swift",       icon: "🍎",  language: "swift",      fileExt: ".swift",description: "URLSession async/await"       },
  { id: "kotlin",      label: "Kotlin",      icon: "K",   language: "kotlin",     fileExt: ".kt",   description: "Ktor / OkHttp + coroutines"   },
  { id: "nodejs",      label: "Node.js",     icon: "⬢",   language: "typescript", fileExt: ".ts",   description: "Server-side fetch / Express"   },
  { id: "curl",        label: "cURL",        icon: ">_",  language: "bash",       fileExt: ".sh",   description: "Command-line HTTP"             },
];

export type PromptScope = "endpoint" | "folder" | "collection";

export interface PromptOptions {
  includeTypes: boolean;
  includeErrorHandling: boolean;
  includeAuth: boolean;
  includeExamples: boolean;
  includeTests: boolean;
}

export const DEFAULT_OPTIONS: PromptOptions = {
  includeTypes: true,
  includeErrorHandling: true,
  includeAuth: true,
  includeExamples: true,
  includeTests: false,
};

export type GenerationMode = "prompt" | "code";

// ─── Prompt Templates ──────────────────────────────────────────────────

export type PromptTemplateId =
  | "implement"
  | "bugfix"
  | "update"
  | "refactor"
  | "test"
  | "migrate"
  | "document"
  | "optimize";

export interface PromptTemplateDef {
  id: PromptTemplateId;
  label: string;
  icon: string;
  description: string;
  /** Extra sections injected into the prompt */
  taskPrefix: string;
  /** Extra requirements appended */
  extraRequirements: string[];
  /** Override the main heading verb */
  verb: string;
}

export const PROMPT_TEMPLATES: PromptTemplateDef[] = [
  {
    id: "implement",
    label: "Implement",
    icon: "🚀",
    description: "Build a new integration from scratch",
    verb: "Implement",
    taskPrefix: "Create a **new integration** for the following API endpoint(s). This is a fresh implementation — no existing code to worry about.",
    extraRequirements: [
      "Create clean, modular code that can be easily extended later",
      "Follow the project's existing code style if one is established",
      "Include inline comments explaining non-obvious decisions",
    ],
  },
  {
    id: "bugfix",
    label: "Bug Fix",
    icon: "🐛",
    description: "Fix issues with an existing API integration",
    verb: "Debug & Fix",
    taskPrefix: "I have an **existing integration** for the following API endpoint(s) that is **not working correctly**. Analyze the endpoint specification below and generate a corrected implementation.",
    extraRequirements: [
      "Pay special attention to **request/response field types** — mismatched types are a common bug source",
      "Check **authentication headers** — missing or malformed tokens cause silent failures",
      "Validate **URL construction** — path parameters, query strings, and base URL concatenation",
      "Ensure **error handling** covers all HTTP status codes the API may return",
      "Add defensive checks for nullable/optional response fields",
    ],
  },
  {
    id: "update",
    label: "Update",
    icon: "✏️",
    description: "Update existing code to match current API spec",
    verb: "Update",
    taskPrefix: "I need to **update an existing integration** to match the **current API specification** below. The API may have changed — new fields, different types, updated URLs, or modified authentication.",
    extraRequirements: [
      "Identify what might have changed from a previous version (new fields, renamed fields, type changes)",
      "Update type definitions to match the current specification exactly",
      "Preserve any existing business logic while updating the API layer",
      "Flag any breaking changes that might affect calling code",
    ],
  },
  {
    id: "refactor",
    label: "Refactor",
    icon: "♻️",
    description: "Restructure existing API code for better quality",
    verb: "Refactor",
    taskPrefix: "**Refactor** the API integration for the following endpoint(s). The goal is to improve code quality, maintainability, and testability without changing external behavior.",
    extraRequirements: [
      "Extract reusable utilities (request builder, error handler, auth injector)",
      "Apply the **Single Responsibility Principle** — each function does one thing",
      "Reduce code duplication across similar endpoint calls",
      "Improve naming for clarity and self-documentation",
      "Make the code easier to unit test by separating concerns",
    ],
  },
  {
    id: "test",
    label: "Test",
    icon: "🧪",
    description: "Generate tests for API integrations",
    verb: "Test",
    taskPrefix: "Generate **comprehensive tests** for the following API endpoint integration(s). Cover both happy paths and error scenarios.",
    extraRequirements: [
      "Write unit tests using the framework's standard test library",
      "Mock HTTP requests — do NOT make real API calls in tests",
      "Test success responses with realistic mock data matching the response schema",
      "Test error responses (400, 401, 403, 404, 500)",
      "Test network failures and timeouts",
      "Test edge cases: empty responses, malformed JSON, missing fields",
      "Include setup/teardown for auth mocks if applicable",
    ],
  },
  {
    id: "migrate",
    label: "Migrate",
    icon: "📦",
    description: "Migrate API integration to a different framework",
    verb: "Migrate",
    taskPrefix: "**Migrate** the following API integration to the target framework specified below. Preserve all functionality while adopting the idioms and best practices of the target framework.",
    extraRequirements: [
      "Map concepts from the source framework to equivalent target framework patterns",
      "Use the target framework's preferred HTTP client and state management",
      "Adapt error handling to the target framework's conventions",
      "Convert type definitions to the target language's type system",
      "Ensure the migrated code is idiomatic — not just a transliteration",
    ],
  },
  {
    id: "document",
    label: "Document",
    icon: "📝",
    description: "Generate documentation for API endpoints",
    verb: "Document",
    taskPrefix: "Generate **developer documentation** for the following API endpoint(s). The documentation should be clear, comprehensive, and useful for onboarding new developers.",
    extraRequirements: [
      "Write a clear **overview** explaining what each endpoint does and when to use it",
      "Document all **parameters** with types, constraints, and examples",
      "Show **example requests and responses** with realistic data",
      "Document **error codes** and what they mean in context",
      "Include **authentication requirements** and setup instructions",
      "Add **usage patterns** — common workflows involving these endpoints",
    ],
  },
  {
    id: "optimize",
    label: "Optimize",
    icon: "⚡",
    description: "Optimize API calls for performance",
    verb: "Optimize",
    taskPrefix: "**Optimize** the API integration for the following endpoint(s). Focus on reducing latency, minimizing unnecessary requests, and improving the user experience.",
    extraRequirements: [
      "Add **caching** where appropriate (in-memory, localStorage, or HTTP cache headers)",
      "Implement **request deduplication** to prevent concurrent identical requests",
      "Add **request cancellation** for superseded requests (e.g., AbortController)",
      "Consider **pagination** strategies for list endpoints",
      "Add **retry logic** with exponential backoff for transient failures",
      "Consider **batching** if multiple endpoints could be combined",
    ],
  },
];

// ─── Public API ────────────────────────────────────────────────────────

export function generate(
  mode: GenerationMode,
  framework: PromptFramework,
  endpoints: ParsedEndpoint[],
  collection: ParsedCollection,
  options: PromptOptions,
  scope: PromptScope,
  folderName?: string,
  template?: PromptTemplateId,
): string {
  if (mode === "prompt") {
    return generatePrompt(framework, endpoints, collection, options, scope, folderName, template);
  }
  return generateCode(framework, endpoints, collection, options);
}

// ─── Prompt Generation (for AI tools) ──────────────────────────────────

function generatePrompt(
  framework: PromptFramework,
  endpoints: ParsedEndpoint[],
  collection: ParsedCollection,
  options: PromptOptions,
  scope: PromptScope,
  folderName?: string,
  templateId?: PromptTemplateId,
): string {
  const fw = FRAMEWORKS.find((f) => f.id === framework)!;
  const tpl = templateId ? PROMPT_TEMPLATES.find((t) => t.id === templateId) : null;
  const verb = tpl?.verb || "Implement";
  const lines: string[] = [];

  // ── Title
  if (scope === "endpoint" && endpoints.length === 1) {
    lines.push(`# ${verb}: ${endpoints[0].name}`);
  } else if (scope === "folder" && folderName) {
    lines.push(`# ${verb}: ${folderName} Endpoints`);
  } else if (endpoints.length > 1 && endpoints.length < collection.endpoints.length) {
    lines.push(`# ${verb}: ${endpoints.length} Selected Endpoints`);
  } else {
    lines.push(`# ${verb}: ${collection.name} — Full API Client`);
  }
  lines.push("");

  // ── Template task description
  if (tpl) {
    lines.push("## Task");
    lines.push("");
    lines.push(tpl.taskPrefix);
    lines.push("");
  }

  // ── Context
  lines.push("## Project Context");
  lines.push("");
  lines.push(`I'm building a **${fw.label}** application that integrates with the **${collection.name}** API.`);
  if (collection.description) {
    lines.push("");
    lines.push(`> ${truncate(collection.description, 300)}`);
  }
  lines.push("");

  // ── API Overview
  lines.push("## API Overview");
  lines.push("");
  lines.push(`- **Collection**: ${collection.name}`);
  lines.push(`- **Total Endpoints**: ${collection.totalRequests}`);
  lines.push(`- **Total Folders**: ${collection.totalFolders}`);
  if (collection.variables.length > 0) {
    const baseUrl = collection.variables.find((va) => va.key.toLowerCase().includes("base_url") || va.key.toLowerCase().includes("baseurl"));
    if (baseUrl) {
      lines.push(`- **Base URL**: \`${baseUrl.value || `{{${baseUrl.key}}}`}\``);
    }
  }
  lines.push("");

  // ── Auth overview
  if (options.includeAuth) {
    const authInfo = inferCollectionAuth(endpoints);
    if (authInfo) {
      lines.push("## Authentication");
      lines.push("");
      lines.push(authInfo);
      lines.push("");
    }
  }

  // ── Endpoint Details
  if (scope === "endpoint" && endpoints.length === 1) {
    lines.push("## Endpoint Details");
    lines.push("");
    lines.push(formatEndpointDetailed(endpoints[0]));
  } else if (scope === "folder") {
    lines.push(`## Endpoints (${endpoints.length})`);
    lines.push("");
    for (const ep of endpoints) {
      lines.push(formatEndpointDetailed(ep));
      lines.push("---");
      lines.push("");
    }
  } else {
    // Full collection — group by folder
    lines.push("## Endpoints by Group");
    lines.push("");
    const grouped = groupByFolder(endpoints);
    for (const [folder, eps] of Object.entries(grouped)) {
      lines.push(`### ${folder} (${eps.length} endpoints)`);
      lines.push("");
      for (const ep of eps) {
        lines.push(`- **${ep.method.toUpperCase()}** \`${ep.url}\` — ${ep.name}`);
      }
      lines.push("");
    }
    // Show full details for first 5 endpoints as examples
    lines.push("## Detailed Endpoint Reference (first 5 as examples)");
    lines.push("");
    for (const ep of endpoints.slice(0, 5)) {
      lines.push(formatEndpointDetailed(ep));
      lines.push("---");
      lines.push("");
    }
    if (endpoints.length > 5) {
      lines.push(`> _${endpoints.length - 5} more endpoints follow the same patterns shown above._`);
      lines.push("");
    }
  }

  // ── Implementation Requirements
  lines.push("## Implementation Requirements");
  lines.push("");
  lines.push(`Generate the following in **${fw.label}**:`);
  lines.push("");

  const reqs: string[] = [];
  if (options.includeTypes) {
    reqs.push(typeRequirement(framework));
  }
  if (scope === "collection" || endpoints.length > 1) {
    reqs.push("A structured **API client module** with a function/method for each endpoint");
  } else {
    reqs.push("An **API function** that calls this endpoint and returns typed data");
  }
  if (options.includeAuth) {
    reqs.push("**Authentication handling** — inject auth tokens/credentials into every request");
  }
  if (options.includeErrorHandling) {
    reqs.push("**Error handling** for network errors, HTTP 4xx/5xx, and validation errors with typed error classes");
  }
  if (options.includeExamples) {
    reqs.push("A **usage example** showing how to call the function in a real component/script");
  }
  if (options.includeTests) {
    reqs.push("**Unit tests** using the framework's standard testing library (Jest, pytest, XCTest, etc.)");
  }
  // Inject template-specific requirements
  if (tpl) {
    for (const extra of tpl.extraRequirements) {
      reqs.push(extra);
    }
  }
  reqs.forEach((r, i) => lines.push(`${i + 1}. ${r}`));
  lines.push("");

  // ── Framework Guidelines
  lines.push("## Framework-Specific Guidelines");
  lines.push("");
  for (const g of frameworkGuidelines(framework)) {
    lines.push(`- ${g}`);
  }
  lines.push("");

  // ── Code Quality
  lines.push("## Code Quality");
  lines.push("");
  lines.push("- Make the code **production-ready** — no shortcuts or TODOs");
  lines.push("- Add documentation comments on exported functions");
  lines.push("- Use descriptive variable names");
  lines.push("- Follow the principle of least surprise");
  lines.push("- Separate concerns (types, API client, error handling)");
  lines.push("");

  // ── Variables
  if (collection.variables.length > 0) {
    lines.push("## Variables");
    lines.push("");
    lines.push("| Variable | Default Value |");
    lines.push("|----------|---------------|");
    for (const v of collection.variables) {
      lines.push(`| \`{{${v.key}}}\` | ${v.value || "_(not set)_"} |`);
    }
    lines.push("");
    lines.push("Replace `{{variable}}` placeholders with actual values or environment variables.");
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Code Generation (template-based, no AI) ──────────────────────────

function generateCode(
  framework: PromptFramework,
  endpoints: ParsedEndpoint[],
  collection: ParsedCollection,
  options: PromptOptions,
): string {
  const gen = codeGenerators[framework];
  if (!gen) return `// Code generation not yet available for ${framework}`;
  return gen(endpoints, collection, options);
}

type CodeGen = (eps: ParsedEndpoint[], col: ParsedCollection, opts: PromptOptions) => string;

const codeGenerators: Record<PromptFramework, CodeGen> = {
  // ═════════════════════════════════════════════════════════════════════
  // TypeScript
  // ═════════════════════════════════════════════════════════════════════
  typescript: (eps, col, opts) => {
    const lines: string[] = [];
    lines.push(`// ${col.name} — API Client`);
    lines.push(`// Auto-generated by Docs Viewer`);
    lines.push("");

    // Types
    if (opts.includeTypes) {
      lines.push("// ─── Types ───────────────────────────────────────");
      lines.push("");
      for (const ep of eps) {
        const pascal = toPascal(ep.name);
        const bodyFields = parseJsonFields(ep.body?.raw);
        const responseFields = parseJsonFields(ep.responses[0]?.body);

        if (bodyFields) {
          lines.push(`export interface ${pascal}Request ${bodyFields}`);
          lines.push("");
        }
        if (responseFields) {
          lines.push(`export interface ${pascal}Response ${responseFields}`);
          lines.push("");
        }
      }
    }

    // Error handling
    if (opts.includeErrorHandling) {
      lines.push("// ─── Error Handling ───────────────────────────────");
      lines.push("");
      lines.push("export class ApiError extends Error {");
      lines.push("  constructor(");
      lines.push("    message: string,");
      lines.push("    public status: number,");
      lines.push("    public body?: unknown,");
      lines.push("  ) {");
      lines.push("    super(message);");
      lines.push("    this.name = 'ApiError';");
      lines.push("  }");
      lines.push("}");
      lines.push("");
    }

    // Base client
    const baseUrl = findBaseUrl(col);
    lines.push("// ─── API Client ──────────────────────────────────");
    lines.push("");
    lines.push(`const BASE_URL = "${baseUrl}";`);
    lines.push("");
    if (opts.includeAuth) {
      lines.push("let authToken: string | null = null;");
      lines.push("");
      lines.push("export function setAuthToken(token: string) {");
      lines.push("  authToken = token;");
      lines.push("}");
      lines.push("");
    }
    lines.push("async function request<T>(");
    lines.push("  method: string,");
    lines.push("  path: string,");
    lines.push("  body?: unknown,");
    lines.push("  params?: Record<string, string>,");
    lines.push("): Promise<T> {");
    lines.push("  const url = new URL(path, BASE_URL);");
    lines.push("  if (params) {");
    lines.push("    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));");
    lines.push("  }");
    lines.push("");
    lines.push("  const headers: Record<string, string> = {");
    lines.push("    'Content-Type': 'application/json',");
    if (opts.includeAuth) {
      lines.push("    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),");
    }
    lines.push("  };");
    lines.push("");
    lines.push("  const res = await fetch(url.toString(), {");
    lines.push("    method,");
    lines.push("    headers,");
    lines.push("    ...(body ? { body: JSON.stringify(body) } : {}),");
    lines.push("  });");
    lines.push("");
    if (opts.includeErrorHandling) {
      lines.push("  if (!res.ok) {");
      lines.push("    const errorBody = await res.json().catch(() => null);");
      lines.push("    throw new ApiError(`${method} ${path} failed: ${res.status}`, res.status, errorBody);");
      lines.push("  }");
      lines.push("");
    }
    lines.push("  return res.json() as Promise<T>;");
    lines.push("}");
    lines.push("");

    // Endpoint functions
    lines.push("// ─── Endpoints ───────────────────────────────────");
    lines.push("");
    for (const ep of eps) {
      const fn = toCamel(ep.name);
      const pascal = toPascal(ep.name);
      const hasBody = ep.body?.raw && ["POST", "PUT", "PATCH"].includes(ep.method.toUpperCase());
      const hasQuery = ep.queryParams.filter((q) => !q.disabled).length > 0;
      const hasTypes = opts.includeTypes;
      const reqType = hasTypes && hasBody ? `${pascal}Request` : "unknown";
      const resType = hasTypes && ep.responses[0]?.body ? `${pascal}Response` : "unknown";

      // JSDoc
      lines.push(`/** ${ep.method.toUpperCase()} ${ep.url} — ${ep.name} */`);

      // Function signature
      const params: string[] = [];
      if (hasBody) params.push(`body: ${reqType}`);
      if (hasQuery) params.push(`params?: Record<string, string>`);

      lines.push(`export async function ${fn}(${params.join(", ")}): Promise<${resType}> {`);
      const args = [`"${ep.method.toUpperCase()}"`, `"${stripHost(ep.url)}"`];
      if (hasBody) args.push("body"); else args.push("undefined");
      if (hasQuery) args.push("params");
      lines.push(`  return request<${resType}>(${args.join(", ")});`);
      lines.push("}");
      lines.push("");
    }

    // Usage examples
    if (opts.includeExamples && eps.length > 0) {
      lines.push("// ─── Usage Example ────────────────────────────────");
      lines.push("");
      const sample = eps[0];
      const fn = toCamel(sample.name);
      lines.push("async function main() {");
      if (opts.includeAuth) {
        lines.push('  setAuthToken("your-token-here");');
      }
      lines.push("  try {");
      if (sample.body?.raw && ["POST", "PUT", "PATCH"].includes(sample.method.toUpperCase())) {
        try {
          const body = JSON.parse(sample.body.raw);
          lines.push(`    const result = await ${fn}(${JSON.stringify(body, null, 2).split("\n").map((l, i) => i === 0 ? l : "      " + l).join("\n")});`);
        } catch {
          lines.push(`    const result = await ${fn}({ /* request body */ });`);
        }
      } else {
        lines.push(`    const result = await ${fn}();`);
      }
      lines.push("    console.log(result);");
      lines.push("  } catch (err) {");
      if (opts.includeErrorHandling) {
        lines.push("    if (err instanceof ApiError) {");
        lines.push("      console.error(`API Error ${err.status}:`, err.message);");
        lines.push("    } else {");
        lines.push("      console.error('Network error:', err);");
        lines.push("    }");
      } else {
        lines.push("    console.error(err);");
      }
      lines.push("  }");
      lines.push("}");
    }

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // JavaScript (same as TS but no types)
  // ═════════════════════════════════════════════════════════════════════
  javascript: (eps, col, opts) => {
    const tsCode = codeGenerators.typescript(eps, col, { ...opts, includeTypes: false });
    return tsCode
      .replace(/: Promise<[^>]+>/g, "")
      .replace(/: [A-Z]\w+(Request|Response)/g, "")
      .replace(/: unknown/g, "")
      .replace(/: string( \| null)?/g, "")
      .replace(/<[A-Z]\w+(Response|Request)>/g, "")
      .replace(/<unknown>/g, "")
      .replace(/\?: Record<string, string>/g, "")
      .replace(/export interface[^}]+}\n\n/g, "")
      .replace(/\(body\: unknown\)/g, "(body)")
      .replace(/\(body, /g, "(body, ")
      .replace(/export class ApiError extends Error \{[\s\S]*?\n\}\n\n/g,
        "class ApiError extends Error {\n  constructor(message, status, body) {\n    super(message);\n    this.status = status;\n    this.body = body;\n  }\n}\n\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // React (hooks + TypeScript)
  // ═════════════════════════════════════════════════════════════════════
  react: (eps, col, opts) => {
    const lines: string[] = [];
    lines.push(`// ${col.name} — React API Hooks`);
    lines.push(`// Auto-generated by Docs Viewer`);
    lines.push("");
    lines.push("import { useState, useCallback } from 'react';");
    lines.push("");

    // Types
    if (opts.includeTypes) {
      lines.push("// ─── Types ───────────────────────────────────────");
      lines.push("");
      for (const ep of eps) {
        const pascal = toPascal(ep.name);
        const bodyFields = parseJsonFields(ep.body?.raw);
        const responseFields = parseJsonFields(ep.responses[0]?.body);
        if (bodyFields) { lines.push(`export interface ${pascal}Request ${bodyFields}`); lines.push(""); }
        if (responseFields) { lines.push(`export interface ${pascal}Response ${responseFields}`); lines.push(""); }
      }
    }

    // Error class
    if (opts.includeErrorHandling) {
      lines.push("export class ApiError extends Error {");
      lines.push("  constructor(message: string, public status: number, public body?: unknown) {");
      lines.push("    super(message); this.name = 'ApiError';");
      lines.push("  }");
      lines.push("}");
      lines.push("");
    }

    // Base helper
    const baseUrl = findBaseUrl(col);
    lines.push(`const BASE_URL = "${baseUrl}";`);
    lines.push("");

    if (opts.includeAuth) {
      lines.push("function getAuthHeaders(): Record<string, string> {");
      lines.push("  const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;");
      lines.push("  return token ? { Authorization: `Bearer ${token}` } : {};");
      lines.push("}");
      lines.push("");
    }

    // Hooks
    for (const ep of eps) {
      const hookName = `use${toPascal(ep.name)}`;
      const pascal = toPascal(ep.name);
      const method = ep.method.toUpperCase();
      const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
      const hasBody = ep.body?.raw && isWrite;
      const resType = opts.includeTypes && ep.responses[0]?.body ? `${pascal}Response` : "unknown";
      const reqType = opts.includeTypes && hasBody ? `${pascal}Request` : "Record<string, unknown>";

      lines.push(`/** ${method} ${ep.url} — ${ep.name} */`);
      lines.push(`export function ${hookName}() {`);
      lines.push(`  const [data, setData] = useState<${resType} | null>(null);`);
      lines.push(`  const [loading, setLoading] = useState(${isWrite ? "false" : "true"});`);
      lines.push(`  const [error, setError] = useState<Error | null>(null);`);
      lines.push("");

      if (isWrite) {
        lines.push(`  const execute = useCallback(async (${hasBody ? `body: ${reqType}` : ""}) => {`);
        lines.push("    setLoading(true); setError(null);");
        lines.push("    try {");
        lines.push(`      const res = await fetch(\`\${BASE_URL}${stripHost(ep.url)}\`, {`);
        lines.push(`        method: '${method}',`);
        lines.push(`        headers: { 'Content-Type': 'application/json'${opts.includeAuth ? ", ...getAuthHeaders()" : ""} },`);
        if (hasBody) lines.push("        body: JSON.stringify(body),");
        lines.push("      });");
        if (opts.includeErrorHandling) {
          lines.push("      if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);");
        }
        lines.push(`      const json = await res.json() as ${resType};`);
        lines.push("      setData(json);");
        lines.push("      return json;");
        if (opts.includeErrorHandling) {
          lines.push("    } catch (err) {");
          lines.push("      setError(err instanceof Error ? err : new Error(String(err)));");
          lines.push("      return null;");
        } else {
          lines.push("    } catch (err) {");
          lines.push("      setError(err as Error);");
          lines.push("      return null;");
        }
        lines.push("    } finally { setLoading(false); }");
        lines.push("  }, []);");
        lines.push("");
        lines.push("  return { execute, data, loading, error };");
      } else {
        lines.push("  const fetch_ = useCallback(async () => {");
        lines.push("    setLoading(true); setError(null);");
        lines.push("    try {");
        lines.push(`      const res = await fetch(\`\${BASE_URL}${stripHost(ep.url)}\`, {`);
        lines.push(`        headers: {${opts.includeAuth ? " ...getAuthHeaders()" : ""} },`);
        lines.push("      });");
        if (opts.includeErrorHandling) {
          lines.push("      if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);");
        }
        lines.push(`      setData(await res.json() as ${resType});`);
        lines.push("    } catch (err) {");
        lines.push("      setError(err instanceof Error ? err : new Error(String(err)));");
        lines.push("    } finally { setLoading(false); }");
        lines.push("  }, []);");
        lines.push("");
        lines.push("  return { data, loading, error, refetch: fetch_ };");
      }
      lines.push("}");
      lines.push("");
    }

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Next.js (Server Actions / Route Handlers)
  // ═════════════════════════════════════════════════════════════════════
  nextjs: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);

    lines.push(`// ${col.name} — Next.js Server Actions`);
    lines.push(`// Auto-generated by Docs Viewer`);
    lines.push(`"use server";`);
    lines.push("");

    if (opts.includeTypes) {
      for (const ep of eps) {
        const pascal = toPascal(ep.name);
        const bodyFields = parseJsonFields(ep.body?.raw);
        const responseFields = parseJsonFields(ep.responses[0]?.body);
        if (bodyFields) { lines.push(`interface ${pascal}Request ${bodyFields}`); lines.push(""); }
        if (responseFields) { lines.push(`interface ${pascal}Response ${responseFields}`); lines.push(""); }
      }
    }

    if (opts.includeErrorHandling) {
      lines.push("type ActionResult<T> = { success: true; data: T } | { success: false; error: string };");
      lines.push("");
    }

    lines.push(`const BASE_URL = process.env.API_BASE_URL || "${baseUrl}";`);
    lines.push("");

    for (const ep of eps) {
      const fn = toCamel(ep.name);
      const pascal = toPascal(ep.name);
      const method = ep.method.toUpperCase();
      const hasBody = ep.body?.raw && ["POST", "PUT", "PATCH"].includes(method);
      const resType = opts.includeTypes && ep.responses[0]?.body ? `${pascal}Response` : "unknown";
      const reqType = opts.includeTypes && hasBody ? `${pascal}Request` : "Record<string, unknown>";
      const returnType = opts.includeErrorHandling ? `ActionResult<${resType}>` : resType;

      lines.push(`/** ${method} ${ep.url} */`);
      lines.push(`export async function ${fn}(${hasBody ? `body: ${reqType}` : ""}): Promise<${returnType}> {`);

      if (opts.includeErrorHandling) {
        lines.push("  try {");
        lines.push(`    const res = await fetch(\`\${BASE_URL}${stripHost(ep.url)}\`, {`);
        lines.push(`      method: "${method}",`);
        lines.push(`      headers: { "Content-Type": "application/json" },`);
        if (hasBody) lines.push("      body: JSON.stringify(body),");
        lines.push(`      cache: "${method === "GET" ? "force-cache" : "no-store"}",`);
        lines.push("    });");
        lines.push("    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };");
        lines.push(`    return { success: true, data: await res.json() as ${resType} };`);
        lines.push("  } catch (err) {");
        lines.push("    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };");
        lines.push("  }");
      } else {
        lines.push(`    const res = await fetch(\`\${BASE_URL}${stripHost(ep.url)}\`, {`);
        lines.push(`      method: "${method}",`);
        lines.push(`      headers: { "Content-Type": "application/json" },`);
        if (hasBody) lines.push("      body: JSON.stringify(body),");
        lines.push("    });");
        lines.push(`    return res.json() as Promise<${resType}>;`);
      }
      lines.push("}");
      lines.push("");
    }

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Vue.js (composables)
  // ═════════════════════════════════════════════════════════════════════
  vue: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);
    lines.push(`// ${col.name} — Vue Composables`);
    lines.push(`import { ref } from 'vue';`);
    lines.push("");

    if (opts.includeTypes) {
      for (const ep of eps) {
        const pascal = toPascal(ep.name);
        const bodyFields = parseJsonFields(ep.body?.raw);
        const responseFields = parseJsonFields(ep.responses[0]?.body);
        if (bodyFields) { lines.push(`export interface ${pascal}Request ${bodyFields}`); lines.push(""); }
        if (responseFields) { lines.push(`export interface ${pascal}Response ${responseFields}`); lines.push(""); }
      }
    }

    lines.push(`const BASE_URL = "${baseUrl}";`);
    lines.push("");

    for (const ep of eps) {
      const fn = `use${toPascal(ep.name)}`;
      const pascal = toPascal(ep.name);
      const method = ep.method.toUpperCase();
      const hasBody = ep.body?.raw && ["POST", "PUT", "PATCH"].includes(method);
      const resType = opts.includeTypes && ep.responses[0]?.body ? `${pascal}Response` : "unknown";

      lines.push(`/** ${method} ${ep.url} */`);
      lines.push(`export function ${fn}() {`);
      lines.push(`  const data = ref<${resType} | null>(null);`);
      lines.push(`  const loading = ref(false);`);
      lines.push(`  const error = ref<string | null>(null);`);
      lines.push("");
      lines.push(`  async function execute(${hasBody ? "body: " + (opts.includeTypes ? `${pascal}Request` : "Record<string, unknown>") : ""}) {`);
      lines.push("    loading.value = true; error.value = null;");
      lines.push("    try {");
      lines.push(`      const res = await fetch(\`\${BASE_URL}${stripHost(ep.url)}\`, {`);
      lines.push(`        method: '${method}',`);
      lines.push(`        headers: { 'Content-Type': 'application/json' },`);
      if (hasBody) lines.push("        body: JSON.stringify(body),");
      lines.push("      });");
      if (opts.includeErrorHandling) {
        lines.push(`      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);`);
      }
      lines.push(`      data.value = await res.json();`);
      lines.push("    } catch (err: unknown) {");
      lines.push("      error.value = err instanceof Error ? err.message : 'Unknown error';");
      lines.push("    } finally { loading.value = false; }");
      lines.push("  }");
      lines.push("");
      lines.push("  return { data, loading, error, execute };");
      lines.push("}");
      lines.push("");
    }

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Python
  // ═════════════════════════════════════════════════════════════════════
  python: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);
    lines.push(`"""${col.name} — API Client"""`);
    lines.push("");
    lines.push("import requests");
    if (opts.includeTypes) lines.push("from dataclasses import dataclass");
    if (opts.includeTypes) lines.push("from typing import Optional");
    lines.push("");

    lines.push(`BASE_URL = "${baseUrl}"`);
    lines.push("");

    if (opts.includeAuth) {
      lines.push("class ApiClient:");
      lines.push('    def __init__(self, token: str = ""):');
      lines.push("        self.session = requests.Session()");
      lines.push('        self.session.headers.update({"Content-Type": "application/json"})');
      lines.push("        if token:");
      lines.push('            self.session.headers["Authorization"] = f"Bearer {token}"');
      lines.push("");
    }

    if (opts.includeTypes) {
      for (const ep of eps) {
        const bodyFields = parseJsonFieldsPython(ep.body?.raw);
        const responseFields = parseJsonFieldsPython(ep.responses[0]?.body);
        if (bodyFields) { lines.push(bodyFields(toPascal(ep.name) + "Request")); lines.push(""); }
        if (responseFields) { lines.push(responseFields(toPascal(ep.name) + "Response")); lines.push(""); }
      }
    }

    const indent = opts.includeAuth ? "    " : "";
    const selfDot = opts.includeAuth ? "self." : "";

    for (const ep of eps) {
      const fn = toSnake(ep.name);
      const method = ep.method.toLowerCase();
      const hasBody = ep.body?.raw && ["post", "put", "patch"].includes(method);

      lines.push(`${indent}def ${fn}(${opts.includeAuth ? "self" : ""}${hasBody ? `${opts.includeAuth ? ", " : ""}data: dict` : ""}):`);
      lines.push(`${indent}    """${ep.method.toUpperCase()} ${ep.url} — ${ep.name}"""`);
      if (opts.includeErrorHandling) {
        lines.push(`${indent}    try:`);
        lines.push(`${indent}        resp = ${selfDot}session.${method}(f"{BASE_URL}${stripHost(ep.url)}"${hasBody ? ", json=data" : ""})`);
        lines.push(`${indent}        resp.raise_for_status()`);
        lines.push(`${indent}        return resp.json()`);
        lines.push(`${indent}    except requests.HTTPError as e:`);
        lines.push(`${indent}        raise Exception(f"API error {e.response.status_code}: {e.response.text}") from e`);
        lines.push(`${indent}    except requests.RequestException as e:`);
        lines.push(`${indent}        raise Exception(f"Network error: {e}") from e`);
      } else {
        lines.push(`${indent}    resp = ${selfDot}session.${method}(f"{BASE_URL}${stripHost(ep.url)}"${hasBody ? ", json=data" : ""})`);
        lines.push(`${indent}    return resp.json()`);
      }
      lines.push("");
    }

    if (opts.includeExamples) {
      lines.push("# ─── Usage ────────────────────────────────────────");
      lines.push("if __name__ == '__main__':");
      if (opts.includeAuth) {
        lines.push('    client = ApiClient(token="your-token")');
        lines.push(`    result = client.${toSnake(eps[0].name)}(${eps[0].body?.raw && ["post", "put", "patch"].includes(eps[0].method.toLowerCase()) ? "data={}" : ""})`);
      } else {
        lines.push(`    result = ${toSnake(eps[0].name)}(${eps[0].body?.raw && ["post", "put", "patch"].includes(eps[0].method.toLowerCase()) ? "data={}" : ""})`);
      }
      lines.push("    print(result)");
    }

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Flutter / Dart
  // ═════════════════════════════════════════════════════════════════════
  flutter: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);
    lines.push(`// ${col.name} — Flutter API Client`);
    lines.push("import 'dart:convert';");
    lines.push("import 'package:http/http.dart' as http;");
    lines.push("");
    lines.push(`const String baseUrl = '${baseUrl}';`);
    lines.push("");

    lines.push("class ApiClient {");
    if (opts.includeAuth) {
      lines.push("  final String? token;");
      lines.push("  ApiClient({this.token});");
    } else {
      lines.push("  ApiClient();");
    }
    lines.push("");
    lines.push("  Map<String, String> get _headers => {");
    lines.push("    'Content-Type': 'application/json',");
    if (opts.includeAuth) {
      lines.push("    if (token != null) 'Authorization': 'Bearer $token',");
    }
    lines.push("  };");
    lines.push("");

    for (const ep of eps) {
      const fn = toCamel(ep.name);
      const method = ep.method.toLowerCase();
      const hasBody = ep.body?.raw && ["post", "put", "patch"].includes(method);

      lines.push(`  /// ${ep.method.toUpperCase()} ${ep.url}`);
      lines.push(`  Future<Map<String, dynamic>> ${fn}(${hasBody ? "Map<String, dynamic> body" : ""}) async {`);
      lines.push(`    final response = await http.${method}(`);
      lines.push(`      Uri.parse('\$baseUrl${stripHost(ep.url)}'),`);
      lines.push("      headers: _headers,");
      if (hasBody) lines.push("      body: jsonEncode(body),");
      lines.push("    );");
      if (opts.includeErrorHandling) {
        lines.push("    if (response.statusCode >= 400) {");
        lines.push("      throw Exception('API Error ${response.statusCode}: ${response.body}');");
        lines.push("    }");
      }
      lines.push("    return jsonDecode(response.body);");
      lines.push("  }");
      lines.push("");
    }
    lines.push("}");

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Swift
  // ═════════════════════════════════════════════════════════════════════
  swift: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);
    lines.push(`// ${col.name} — Swift API Client`);
    lines.push("import Foundation");
    lines.push("");

    if (opts.includeErrorHandling) {
      lines.push("enum ApiError: Error, LocalizedError {");
      lines.push("    case httpError(statusCode: Int, body: Data?)");
      lines.push("    case networkError(Error)");
      lines.push("    case decodingError(Error)");
      lines.push("    var errorDescription: String? {");
      lines.push("        switch self {");
      lines.push('        case .httpError(let code, _): return "HTTP \\(code)"');
      lines.push('        case .networkError(let e): return "Network: \\(e.localizedDescription)"');
      lines.push('        case .decodingError(let e): return "Decode: \\(e.localizedDescription)"');
      lines.push("        }");
      lines.push("    }");
      lines.push("}");
      lines.push("");
    }

    lines.push("class ApiClient {");
    lines.push(`    private let baseURL = "${baseUrl}"`);
    if (opts.includeAuth) {
      lines.push("    var token: String?");
    }
    lines.push("");

    for (const ep of eps) {
      const fn = toCamel(ep.name);
      const method = ep.method.toUpperCase();
      const hasBody = ep.body?.raw && ["POST", "PUT", "PATCH"].includes(method);

      lines.push(`    /// ${method} ${ep.url}`);
      lines.push(`    func ${fn}(${hasBody ? "body: [String: Any]" : ""}) async throws -> [String: Any] {`);
      lines.push(`        var request = URLRequest(url: URL(string: "\\(baseURL)${stripHost(ep.url)}")!)`);
      lines.push(`        request.httpMethod = "${method}"`);
      lines.push('        request.setValue("application/json", forHTTPHeaderField: "Content-Type")');
      if (opts.includeAuth) {
        lines.push("        if let token = token {");
        lines.push('            request.setValue("Bearer \\(token)", forHTTPHeaderField: "Authorization")');
        lines.push("        }");
      }
      if (hasBody) {
        lines.push("        request.httpBody = try JSONSerialization.data(withJSONObject: body)");
      }
      lines.push("        let (data, response) = try await URLSession.shared.data(for: request)");
      if (opts.includeErrorHandling) {
        lines.push("        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {");
        lines.push("            throw ApiError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? -1, body: data)");
        lines.push("        }");
      }
      lines.push("        return try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]");
      lines.push("    }");
      lines.push("");
    }
    lines.push("}");

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Kotlin
  // ═════════════════════════════════════════════════════════════════════
  kotlin: (eps, col, opts) => {
    const lines: string[] = [];
    const baseUrl = findBaseUrl(col);
    lines.push(`// ${col.name} — Kotlin API Client`);
    lines.push("import kotlinx.coroutines.Dispatchers");
    lines.push("import kotlinx.coroutines.withContext");
    lines.push("import okhttp3.*");
    lines.push("import okhttp3.MediaType.Companion.toMediaType");
    lines.push("import okhttp3.RequestBody.Companion.toRequestBody");
    lines.push("import org.json.JSONObject");
    lines.push("");

    lines.push(`class ApiClient(${opts.includeAuth ? "private val token: String? = null" : ""}) {`);
    lines.push("    private val client = OkHttpClient()");
    lines.push(`    private val baseUrl = "${baseUrl}"`);
    lines.push('    private val jsonType = "application/json".toMediaType()');
    lines.push("");

    for (const ep of eps) {
      const fn = toCamel(ep.name);
      const method = ep.method.toUpperCase();
      const hasBody = ep.body?.raw && ["POST", "PUT", "PATCH"].includes(method);

      lines.push(`    /** ${method} ${ep.url} */`);
      lines.push(`    suspend fun ${fn}(${hasBody ? "body: JSONObject" : ""}): JSONObject = withContext(Dispatchers.IO) {`);
      lines.push(`        val request = Request.Builder()`);
      lines.push(`            .url("\$baseUrl${stripHost(ep.url)}")`);
      if (hasBody) {
        lines.push(`            .method("${method}", body.toString().toRequestBody(jsonType))`);
      } else if (!["GET", "HEAD"].includes(method)) {
        lines.push(`            .method("${method}", null)`);
      }
      lines.push('            .addHeader("Content-Type", "application/json")');
      if (opts.includeAuth) {
        lines.push('            .apply { token?.let { addHeader("Authorization", "Bearer $it") } }');
      }
      lines.push("            .build()");
      lines.push("");
      if (opts.includeErrorHandling) {
        lines.push("        val response = client.newCall(request).execute()");
        lines.push('        if (!response.isSuccessful) throw Exception("HTTP ${response.code}: ${response.body?.string()}")');
        lines.push('        JSONObject(response.body?.string() ?: "{}")');
      } else {
        lines.push("        val response = client.newCall(request).execute()");
        lines.push('        JSONObject(response.body?.string() ?: "{}")');
      }
      lines.push("    }");
      lines.push("");
    }
    lines.push("}");

    return lines.join("\n");
  },

  // ═════════════════════════════════════════════════════════════════════
  // Node.js (Express route handlers)
  // ═════════════════════════════════════════════════════════════════════
  nodejs: (eps, col, opts) => {
    // Reuse TypeScript generator for Node.js
    return codeGenerators.typescript(eps, col, opts)
      .replace("// Auto-generated", "// Node.js API Client — Auto-generated");
  },

  // ═════════════════════════════════════════════════════════════════════
  // cURL
  // ═════════════════════════════════════════════════════════════════════
  curl: (eps, _col, opts) => {
    const lines: string[] = [];
    lines.push("#!/bin/bash");
    lines.push("# API requests — copy and modify as needed");
    lines.push("");
    if (opts.includeAuth) {
      lines.push('TOKEN="your-bearer-token"');
      lines.push("");
    }
    for (const ep of eps) {
      const method = ep.method.toUpperCase();
      lines.push(`# ${ep.name}`);
      lines.push(`curl -X ${method} \\`);
      lines.push(`  '${ep.url}' \\`);
      lines.push(`  -H 'Content-Type: application/json' \\`);
      if (opts.includeAuth) {
        lines.push(`  -H "Authorization: Bearer $TOKEN" \\`);
      }
      for (const h of ep.headers.filter((h) => !h.disabled && h.key.toLowerCase() !== "content-type" && h.key.toLowerCase() !== "authorization")) {
        lines.push(`  -H '${h.key}: ${h.value}' \\`);
      }
      if (ep.body?.raw && ["POST", "PUT", "PATCH"].includes(method)) {
        try {
          const parsed = JSON.parse(ep.body.raw);
          lines.push(`  -d '${JSON.stringify(parsed)}'`);
        } catch {
          lines.push(`  -d '${ep.body.raw.replace(/\n/g, "").replace(/'/g, "'\\''")}'`);
        }
      } else {
        // Remove trailing backslash from last line
        lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
      }
      lines.push("");
    }
    return lines.join("\n");
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────

function toPascal(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toCamel(str: string): string {
  const pascal = toPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnake(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .join("_");
}

function stripHost(url: string): string {
  // Remove {{base_url}} or protocol+host prefix, keep the path
  const stripped = url
    .replace(/^\{\{[^}]+\}\}/, "")
    .replace(/^https?:\/\/[^/]+/, "");
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

function findBaseUrl(col: ParsedCollection): string {
  const v = col.variables.find(
    (va) => va.key.toLowerCase().includes("base_url") || va.key.toLowerCase().includes("baseurl")
  );
  return v?.value || "https://api.example.com";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function parseJsonFields(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    const fields = Object.entries(obj).map(([k, v]) => {
      const t = inferTsType(v);
      return `  ${k}: ${t};`;
    });
    return `{\n${fields.join("\n")}\n}`;
  } catch {
    return null;
  }
}

function parseJsonFieldsPython(raw: string | undefined | null): ((name: string) => string) | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    return (name: string) => {
      const lines = [`@dataclass`, `class ${name}:`];
      for (const [k, v] of Object.entries(obj)) {
        lines.push(`    ${k}: ${inferPyType(v)}`);
      }
      return lines.join("\n");
    };
  } catch {
    return null;
  }
}

function inferTsType(val: unknown): string {
  if (val === null) return "unknown";
  if (typeof val === "string") return "string";
  if (typeof val === "number") return "number";
  if (typeof val === "boolean") return "boolean";
  if (Array.isArray(val)) {
    if (val.length === 0) return "unknown[]";
    return `${inferTsType(val[0])}[]`;
  }
  if (typeof val === "object") return "Record<string, unknown>";
  return "unknown";
}

function inferPyType(val: unknown): string {
  if (val === null) return "Optional[str]";
  if (typeof val === "string") return "str";
  if (typeof val === "number") return Number.isInteger(val) ? "int" : "float";
  if (typeof val === "boolean") return "bool";
  if (Array.isArray(val)) return "list";
  if (typeof val === "object") return "dict";
  return "str";
}

function groupByFolder(endpoints: ParsedEndpoint[]): Record<string, ParsedEndpoint[]> {
  const groups: Record<string, ParsedEndpoint[]> = {};
  for (const ep of endpoints) {
    const folder = ep.folderPath.length > 0 ? ep.folderPath.join(" / ") : "Ungrouped";
    if (!groups[folder]) groups[folder] = [];
    groups[folder].push(ep);
  }
  return groups;
}

function formatEndpointDetailed(ep: ParsedEndpoint): string {
  const lines: string[] = [];

  lines.push(`### ${ep.method.toUpperCase()} \`${ep.url}\``);
  lines.push(`**${ep.name}**`);
  lines.push("");

  if (ep.description) {
    lines.push(ep.description);
    lines.push("");
  }

  // Headers
  const activeHeaders = ep.headers.filter((h) => !h.disabled && h.key);
  if (activeHeaders.length > 0) {
    lines.push("**Headers**:");
    lines.push("| Header | Value |");
    lines.push("|--------|-------|");
    for (const h of activeHeaders) {
      lines.push(`| \`${h.key}\` | \`${h.value || ""}\` |`);
    }
    lines.push("");
  }

  // Path variables
  if (ep.pathVariables.length > 0) {
    lines.push("**Path Parameters**:");
    lines.push("| Parameter | Description |");
    lines.push("|-----------|-------------|");
    for (const p of ep.pathVariables) {
      lines.push(`| \`:${p.key}\` | ${p.description || p.value || "—"} |`);
    }
    lines.push("");
  }

  // Query params
  const activeQuery = ep.queryParams.filter((q) => !q.disabled);
  if (activeQuery.length > 0) {
    lines.push("**Query Parameters**:");
    lines.push("| Parameter | Default | Description |");
    lines.push("|-----------|---------|-------------|");
    for (const q of activeQuery) {
      lines.push(`| \`${q.key}\` | \`${q.value || ""}\` | ${q.description || "—"} |`);
    }
    lines.push("");
  }

  // Body
  if (ep.body?.raw && ["POST", "PUT", "PATCH"].includes(ep.method.toUpperCase())) {
    lines.push("**Request Body** (JSON):");
    lines.push("```json");
    try {
      const parsed = JSON.parse(ep.body.raw);
      lines.push(JSON.stringify(parsed, null, 2));
    } catch {
      lines.push(ep.body.raw);
    }
    lines.push("```");
    lines.push("");

    // Field descriptions
    try {
      const parsed = JSON.parse(ep.body.raw);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        lines.push("**Body Fields**:");
        lines.push("| Field | Type | Example |");
        lines.push("|-------|------|---------|");
        for (const [k, v] of Object.entries(parsed)) {
          const type = v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
          lines.push(`| \`${k}\` | ${type} | \`${JSON.stringify(v)}\` |`);
        }
        lines.push("");
      }
    } catch { /* skip */ }
  }

  // Responses
  if (ep.responses.length > 0) {
    lines.push("**Responses**:");
    for (const res of ep.responses) {
      const code = res.code || "???";
      lines.push(`- **${code}** ${res.status || res.name}`);
      if (res.body) {
        lines.push("```json");
        try {
          const parsed = JSON.parse(res.body);
          lines.push(JSON.stringify(parsed, null, 2));
        } catch {
          lines.push(truncate(res.body, 500));
        }
        lines.push("```");
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function inferCollectionAuth(endpoints: ParsedEndpoint[]): string | null {
  const bearerCount = endpoints.filter((e) =>
    e.auth?.type === "bearer" || e.headers.some((h) => h.key.toLowerCase() === "authorization" && h.value?.toLowerCase().includes("bearer"))
  ).length;
  const apiKeyCount = endpoints.filter((e) => e.auth?.type === "apikey").length;

  if (bearerCount > endpoints.length * 0.3) {
    return "- **Type**: Bearer Token\n- **Header**: `Authorization: Bearer {{token}}`\n- Most endpoints require authentication.";
  }
  if (apiKeyCount > endpoints.length * 0.3) {
    return "- **Type**: API Key\n- Pass the API key as specified by the collection.";
  }
  if (bearerCount > 0 || apiKeyCount > 0) {
    return "- Mixed authentication. See individual endpoint headers for details.";
  }
  return null;
}

function typeRequirement(framework: PromptFramework): string {
  switch (framework) {
    case "typescript":
    case "react":
    case "nextjs":
    case "vue":
    case "nodejs":
      return "**TypeScript interfaces** for all request bodies and response shapes";
    case "python":
      return "**Pydantic models** or dataclasses for all request/response shapes";
    case "flutter":
      return "**Dart model classes** with `fromJson`/`toJson` for all request/response shapes";
    case "swift":
      return "**Codable structs** for all request/response shapes";
    case "kotlin":
      return "**Data classes** for all request/response shapes";
    default:
      return "**Type definitions** for request/response shapes";
  }
}

function frameworkGuidelines(framework: PromptFramework): string[] {
  switch (framework) {
    case "typescript":
      return [
        "Use strict TypeScript — no `any` types",
        "Use the native `fetch` API",
        "Export all types and functions",
        "Use async/await throughout",
        "Use template literal types for URL patterns where appropriate",
      ];
    case "javascript":
      return [
        "Use modern ES2022+ syntax (async/await, optional chaining)",
        "Use the native `fetch` API",
        "Add JSDoc comments for function parameters and return types",
        "Use `const` and `let` — never `var`",
      ];
    case "react":
      return [
        "Create custom hooks (`useXxx`) for each endpoint",
        "Use `useState` + `useCallback` for state management",
        "Return `{ data, loading, error }` from each hook",
        "Use TypeScript generics for type safety",
        "Make hooks composable and reusable",
        "Handle cleanup/unmount properly",
      ];
    case "nextjs":
      return [
        "Use Server Actions with `'use server'` directive",
        "Return `ActionResult<T>` with success/error discriminated unions",
        "Use `process.env` for sensitive configuration",
        "Use `cache: 'force-cache'` for GET, `no-store` for mutations",
        "Keep server actions in a separate `actions/` directory",
      ];
    case "vue":
      return [
        "Use Composition API with `ref` and `computed`",
        "Create composables (`useXxx`) for each endpoint",
        "Return reactive refs for `data`, `loading`, `error`",
        "Use TypeScript generics",
        "Make composables tree-shakeable and reusable",
      ];
    case "python":
      return [
        "Use `requests` or `httpx` library",
        "Use dataclasses or Pydantic for type safety",
        "Create a client class with session management",
        "Handle exceptions with specific error types",
        "Use f-strings for URL interpolation",
        "Follow PEP 8 naming conventions",
      ];
    case "flutter":
      return [
        "Use the `http` package for HTTP requests",
        "Create model classes with `fromJson`/`toJson` factory methods",
        "Use `async/await` with `Future<T>` return types",
        "Handle errors with try/catch and custom exceptions",
        "Use dependency injection for the API client",
      ];
    case "swift":
      return [
        "Use `async/await` with `URLSession`",
        "Use `Codable` structs for JSON serialization",
        "Use `enum` for custom error types conforming to `Error`",
        "Use `Result<T, Error>` where appropriate",
        "Follow Swift API Design Guidelines naming conventions",
      ];
    case "kotlin":
      return [
        "Use Kotlin coroutines with `suspend` functions",
        "Use OkHttp or Ktor for HTTP",
        "Use `data class` for models",
        "Use Kotlin's `Result` type or sealed classes for error handling",
        "Follow Kotlin coding conventions",
      ];
    case "nodejs":
      return [
        "Use Node.js 18+ built-in `fetch` or axios",
        "Use TypeScript for type safety",
        "Export a client module/class",
        "Use environment variables for configuration",
        "Handle both network and HTTP errors",
      ];
    case "curl":
      return [
        "Use `-X` for HTTP method",
        "Use `-H` for headers",
        "Use `-d` for request body",
        "Include proper quoting for shell safety",
        "Use variables for tokens and base URL",
      ];
  }
}

// ─── Scope helpers ─────────────────────────────────────────────────────

export type PromptScopeV2 = "custom" | "collection";

/**
 * Resolve endpoints from a custom selection of folder names and/or endpoint IDs.
 */
export function resolveEndpoints(
  collection: ParsedCollection,
  selectedFolders: string[],
  selectedEndpointIds: string[],
): ParsedEndpoint[] {
  const byId = new Set(selectedEndpointIds);
  const eps: ParsedEndpoint[] = [];
  const seen = new Set<string>();

  // Endpoints explicitly selected by ID
  for (const ep of collection.endpoints) {
    if (byId.has(ep.id) && !seen.has(ep.id)) {
      eps.push(ep);
      seen.add(ep.id);
    }
  }

  // Endpoints belonging to selected folders
  for (const folder of selectedFolders) {
    for (const ep of collection.endpoints) {
      const path = ep.folderPath.join(" / ");
      if ((path === folder || path.startsWith(folder + " / ")) && !seen.has(ep.id)) {
        eps.push(ep);
        seen.add(ep.id);
      }
    }
  }

  return eps;
}

export interface FolderInfo {
  name: string;
  endpointCount: number;
}

export function getFolderList(collection: ParsedCollection): FolderInfo[] {
  const counts: Record<string, number> = {};
  function walk(nodes: FolderNode[]) {
    for (const n of nodes) {
      const key = n.path.length > 0 ? n.path.join(" / ") : n.name;
      if (key) {
        // Count endpoints recursively
        counts[key] = countEndpointsInFolder(n);
      }
      if (n.children.length) walk(n.children);
    }
  }
  walk(collection.folderTree);
  return Object.entries(counts)
    .map(([name, endpointCount]) => ({ name, endpointCount }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function countEndpointsInFolder(node: FolderNode): number {
  let count = node.endpoints.length;
  for (const child of node.children) {
    count += countEndpointsInFolder(child);
  }
  return count;
}

/**
 * API Code Snippet Generator
 *
 * Generates platform-specific HTTP request code from a ParsedEndpoint.
 * Auth tokens are injected into the snippets.
 */

import type { ParsedEndpoint } from "@/types/postman";
import type { AuthConfig } from "@/lib/api-request-executor";
import { buildAuthHeaders, applyBaseUrl } from "@/lib/api-request-executor";

// ─── Types ──────────────────────────────────────────────────────────

export type ApiSnippetPlatform =
  | "curl"
  | "javascript"
  | "react"
  | "python"
  | "nodejs"
  | "flutter"
  | "swift"
  | "kotlin";

export interface ApiPlatformDef {
  id: ApiSnippetPlatform;
  label: string;
  icon: string;
  language: string;
}

export const API_PLATFORMS: ApiPlatformDef[] = [
  { id: "curl", label: "cURL", icon: ">_", language: "bash" },
  { id: "javascript", label: "JavaScript", icon: "JS", language: "javascript" },
  { id: "react", label: "React", icon: "⚛", language: "tsx" },
  { id: "python", label: "Python", icon: "🐍", language: "python" },
  { id: "nodejs", label: "Node.js", icon: "⬢", language: "javascript" },
  { id: "flutter", label: "Flutter", icon: "🐦", language: "dart" },
  { id: "swift", label: "Swift", icon: "🍎", language: "swift" },
  { id: "kotlin", label: "Kotlin", icon: "K", language: "kotlin" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function allHeaders(
  endpoint: ParsedEndpoint,
  auth: AuthConfig
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of endpoint.headers) {
    if (!h.disabled && h.key) headers[h.key] = h.value || "";
  }
  Object.assign(headers, buildAuthHeaders(auth));
  // Add Content-Type for JSON bodies
  if (endpoint.body?.mode === "raw" && endpoint.body.raw) {
    try {
      JSON.parse(endpoint.body.raw);
      if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
    } catch {
      // not json
    }
  }
  return headers;
}

function bodyString(endpoint: ParsedEndpoint): string | null {
  if (!endpoint.body) return null;
  if (endpoint.body.mode === "raw" && endpoint.body.raw) {
    return endpoint.body.raw;
  }
  if (endpoint.body.mode === "urlencoded" && endpoint.body.urlencoded) {
    const parts = endpoint.body.urlencoded
      .filter((u) => !u.disabled && u.key)
      .map((u) => `${u.key}=${encodeURIComponent(u.value || "")}`);
    return parts.join("&");
  }
  if (endpoint.body.mode === "formdata" && endpoint.body.formdata) {
    const obj: Record<string, string> = {};
    for (const f of endpoint.body.formdata) {
      if (!f.disabled && f.key) obj[f.key] = f.value || "";
    }
    return JSON.stringify(obj, null, 2);
  }
  return null;
}

function indent(str: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return str
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

// ─── Generator ──────────────────────────────────────────────────────

export function generateApiSnippet(
  platform: ApiSnippetPlatform,
  endpoint: ParsedEndpoint,
  auth: AuthConfig,
  baseUrl?: string
): string {
  const gen = generators[platform];
  if (!gen) return `// Snippet not available for ${platform}`;

  // Apply base URL if provided
  const ep = baseUrl
    ? { ...endpoint, url: applyBaseUrl(endpoint.url, baseUrl) }
    : endpoint;

  return gen(ep, auth);
}

type SnippetGen = (ep: ParsedEndpoint, auth: AuthConfig) => string;

const generators: Record<ApiSnippetPlatform, SnippetGen> = {
  // ═══════════════════════════════════════════════════════════════════
  // cURL
  // ═══════════════════════════════════════════════════════════════════
  curl: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const lines: string[] = [`curl -X ${ep.method} \\`, `  '${ep.url}' \\`];

    for (const [k, v] of Object.entries(headers)) {
      lines.push(`  -H '${k}: ${v}' \\`);
    }

    if (body && !["GET", "HEAD"].includes(ep.method.toUpperCase())) {
      // Pretty print JSON
      try {
        const parsed = JSON.parse(body);
        lines.push(`  -d '${JSON.stringify(parsed)}'`);
      } catch {
        lines.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
      }
    } else {
      // Remove trailing backslash from last line
      lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
    }

    return lines.join("\n");
  },

  // ═══════════════════════════════════════════════════════════════════
  // JavaScript (fetch)
  // ═══════════════════════════════════════════════════════════════════
  javascript: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toUpperCase();

    let code = `const response = await fetch('${ep.url}', {\n`;
    code += `  method: '${method}',\n`;

    if (Object.keys(headers).length > 0) {
      code += `  headers: {\n`;
      for (const [k, v] of Object.entries(headers)) {
        code += `    '${k}': '${v}',\n`;
      }
      code += `  },\n`;
    }

    if (body && !["GET", "HEAD"].includes(method)) {
      try {
        JSON.parse(body);
        code += `  body: JSON.stringify(${indent(body, 2).trim()}),\n`;
      } catch {
        code += `  body: '${body.replace(/'/g, "\\'")}',\n`;
      }
    }

    code += `});\n\n`;
    code += `const data = await response.json();\n`;
    code += `console.log(data);`;

    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // React (custom hook)
  // ═══════════════════════════════════════════════════════════════════
  react: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toUpperCase();
    const hookName = `use${camelToPascal(sanitizeName(ep.name))}`;
    const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (isWrite) {
      let code = `import { useState, useCallback } from 'react';\n\n`;
      code += `function ${hookName}() {\n`;
      code += `  const [data, setData] = useState(null);\n`;
      code += `  const [loading, setLoading] = useState(false);\n`;
      code += `  const [error, setError] = useState(null);\n\n`;
      code += `  const execute = useCallback(async (${body ? "body" : ""}) => {\n`;
      code += `    setLoading(true);\n`;
      code += `    setError(null);\n`;
      code += `    try {\n`;
      code += `      const res = await fetch('${ep.url}', {\n`;
      code += `        method: '${method}',\n`;
      if (Object.keys(headers).length > 0) {
        code += `        headers: {\n`;
        for (const [k, v] of Object.entries(headers)) {
          code += `          '${k}': '${v}',\n`;
        }
        code += `        },\n`;
      }
      if (body) {
        code += `        body: JSON.stringify(body),\n`;
      }
      code += `      });\n`;
      code += `      const json = await res.json();\n`;
      code += `      setData(json);\n`;
      code += `      return json;\n`;
      code += `    } catch (err) {\n`;
      code += `      setError(err.message);\n`;
      code += `    } finally {\n`;
      code += `      setLoading(false);\n`;
      code += `    }\n`;
      code += `  }, []);\n\n`;
      code += `  return { execute, data, loading, error };\n`;
      code += `}\n\n`;
      code += `// Usage\n`;
      code += `function MyComponent() {\n`;
      code += `  const { execute, data, loading, error } = ${hookName}();\n\n`;
      if (body) {
        try {
          const parsed = JSON.parse(body);
          code += `  const handleSubmit = () => execute(${JSON.stringify(parsed, null, 2).split("\n").map((l, i) => i === 0 ? l : "    " + l).join("\n")});\n`;
        } catch {
          code += `  const handleSubmit = () => execute({ /* your data */ });\n`;
        }
      } else {
        code += `  const handleSubmit = () => execute();\n`;
      }
      code += `\n  if (loading) return <p>Loading...</p>;\n`;
      code += `  if (error) return <p>Error: {error}</p>;\n`;
      code += `  return <pre>{JSON.stringify(data, null, 2)}</pre>;\n`;
      code += `}`;
      return code;
    }

    // GET hook
    let code = `import { useState, useEffect } from 'react';\n\n`;
    code += `function ${hookName}() {\n`;
    code += `  const [data, setData] = useState(null);\n`;
    code += `  const [loading, setLoading] = useState(true);\n`;
    code += `  const [error, setError] = useState(null);\n\n`;
    code += `  useEffect(() => {\n`;
    code += `    const fetchData = async () => {\n`;
    code += `      try {\n`;
    code += `        const res = await fetch('${ep.url}'`;
    if (Object.keys(headers).length > 0) {
      code += `, {\n`;
      code += `          headers: {\n`;
      for (const [k, v] of Object.entries(headers)) {
        code += `            '${k}': '${v}',\n`;
      }
      code += `          },\n`;
      code += `        }`;
    }
    code += `);\n`;
    code += `        const json = await res.json();\n`;
    code += `        setData(json);\n`;
    code += `      } catch (err) {\n`;
    code += `        setError(err.message);\n`;
    code += `      } finally {\n`;
    code += `        setLoading(false);\n`;
    code += `      }\n`;
    code += `    };\n`;
    code += `    fetchData();\n`;
    code += `  }, []);\n\n`;
    code += `  return { data, loading, error };\n`;
    code += `}\n\n`;
    code += `// Usage\n`;
    code += `function MyComponent() {\n`;
    code += `  const { data, loading, error } = ${hookName}();\n\n`;
    code += `  if (loading) return <p>Loading...</p>;\n`;
    code += `  if (error) return <p>Error: {error}</p>;\n`;
    code += `  return <pre>{JSON.stringify(data, null, 2)}</pre>;\n`;
    code += `}`;
    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // Python (requests)
  // ═══════════════════════════════════════════════════════════════════
  python: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toLowerCase();

    let code = `import requests\n\n`;
    code += `url = "${ep.url}"\n\n`;

    if (Object.keys(headers).length > 0) {
      code += `headers = {\n`;
      for (const [k, v] of Object.entries(headers)) {
        code += `    "${k}": "${v}",\n`;
      }
      code += `}\n\n`;
    }

    if (body && !["get", "head"].includes(method)) {
      try {
        const parsed = JSON.parse(body);
        code += `payload = ${JSON.stringify(parsed, null, 4)}\n\n`;
        code += `response = requests.${method}(url`;
        if (Object.keys(headers).length > 0) code += `, headers=headers`;
        code += `, json=payload`;
        code += `)\n`;
      } catch {
        code += `data = """${body}"""\n\n`;
        code += `response = requests.${method}(url`;
        if (Object.keys(headers).length > 0) code += `, headers=headers`;
        code += `, data=data`;
        code += `)\n`;
      }
    } else {
      code += `response = requests.${method}(url`;
      if (Object.keys(headers).length > 0) code += `, headers=headers`;
      code += `)\n`;
    }

    code += `\nprint(response.status_code)\n`;
    code += `print(response.json())`;

    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // Node.js (fetch / node 18+)
  // ═══════════════════════════════════════════════════════════════════
  nodejs: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toUpperCase();

    let code = `// Node.js 18+ (built-in fetch)\n\n`;
    code += `const response = await fetch('${ep.url}', {\n`;
    code += `  method: '${method}',\n`;

    if (Object.keys(headers).length > 0) {
      code += `  headers: {\n`;
      for (const [k, v] of Object.entries(headers)) {
        code += `    '${k}': '${v}',\n`;
      }
      code += `  },\n`;
    }

    if (body && !["GET", "HEAD"].includes(method)) {
      try {
        JSON.parse(body);
        code += `  body: JSON.stringify(${indent(body, 2).trim()}),\n`;
      } catch {
        code += `  body: '${body.replace(/'/g, "\\'")}',\n`;
      }
    }

    code += `});\n\n`;
    code += `const data = await response.json();\n`;
    code += `console.log(response.status, data);`;

    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // Flutter / Dart (http package)
  // ═══════════════════════════════════════════════════════════════════
  flutter: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toLowerCase();

    let code = `import 'dart:convert';\n`;
    code += `import 'package:http/http.dart' as http;\n\n`;
    code += `final url = Uri.parse('${ep.url}');\n\n`;

    if (Object.keys(headers).length > 0) {
      code += `final headers = {\n`;
      for (const [k, v] of Object.entries(headers)) {
        code += `  '${k}': '${v}',\n`;
      }
      code += `};\n\n`;
    }

    if (body && !["get", "head"].includes(method)) {
      try {
        const parsed = JSON.parse(body);
        code += `final body = jsonEncode(${JSON.stringify(parsed, null, 2).split("\n").map((l, i) => i === 0 ? l : "  " + l).join("\n")});\n\n`;
      } catch {
        code += `final body = '${body}';\n\n`;
      }
      code += `final response = await http.${method}(\n`;
      code += `  url,\n`;
      if (Object.keys(headers).length > 0) code += `  headers: headers,\n`;
      code += `  body: body,\n`;
      code += `);\n`;
    } else {
      code += `final response = await http.${method}(\n`;
      code += `  url,\n`;
      if (Object.keys(headers).length > 0) code += `  headers: headers,\n`;
      code += `);\n`;
    }

    code += `\nprint('Status: \${response.statusCode}');\n`;
    code += `print('Body: \${response.body}');`;

    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // Swift (URLSession)
  // ═══════════════════════════════════════════════════════════════════
  swift: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toUpperCase();

    let code = `import Foundation\n\n`;
    code += `let url = URL(string: "${ep.url}")!\n`;
    code += `var request = URLRequest(url: url)\n`;
    code += `request.httpMethod = "${method}"\n\n`;

    for (const [k, v] of Object.entries(headers)) {
      code += `request.setValue("${v}", forHTTPHeaderField: "${k}")\n`;
    }

    if (body && !["GET", "HEAD"].includes(method)) {
      try {
        JSON.parse(body);
        code += `\nlet body = """\n${body}\n"""\n`;
        code += `request.httpBody = body.data(using: .utf8)\n`;
      } catch {
        code += `\nrequest.httpBody = "${body.replace(/"/g, '\\"')}".data(using: .utf8)\n`;
      }
    }

    code += `\nlet (data, response) = try await URLSession.shared.data(for: request)\n`;
    code += `let httpResponse = response as! HTTPURLResponse\n`;
    code += `print("Status:", httpResponse.statusCode)\n`;
    code += `\nif let json = try? JSONSerialization.jsonObject(with: data) {\n`;
    code += `    print(json)\n`;
    code += `}`;

    return code;
  },

  // ═══════════════════════════════════════════════════════════════════
  // Kotlin (OkHttp)
  // ═══════════════════════════════════════════════════════════════════
  kotlin: (ep, auth) => {
    const headers = allHeaders(ep, auth);
    const body = bodyString(ep);
    const method = ep.method.toUpperCase();

    let code = `import okhttp3.*\n`;
    code += `import okhttp3.MediaType.Companion.toMediaType\n`;
    code += `import okhttp3.RequestBody.Companion.toRequestBody\n\n`;
    code += `val client = OkHttpClient()\n\n`;

    if (body && !["GET", "HEAD"].includes(method)) {
      code += `val mediaType = "application/json".toMediaType()\n`;
      try {
        JSON.parse(body);
        code += `val body = """${body}""".toRequestBody(mediaType)\n\n`;
      } catch {
        code += `val body = "${body.replace(/"/g, '\\"')}".toRequestBody(mediaType)\n\n`;
      }
    }

    code += `val request = Request.Builder()\n`;
    code += `    .url("${ep.url}")\n`;
    code += `    .method("${method}"`;
    if (body && !["GET", "HEAD"].includes(method)) {
      code += `, body`;
    } else if (!["GET", "HEAD"].includes(method)) {
      code += `, null`;
    }
    code += `)\n`;

    for (const [k, v] of Object.entries(headers)) {
      code += `    .addHeader("${k}", "${v}")\n`;
    }

    code += `    .build()\n\n`;
    code += `val response = client.newCall(request).execute()\n`;
    code += `println("Status: \${response.code}")\n`;
    code += `println(response.body?.string())`;

    return code;
  },
};

// ─── Utils ──────────────────────────────────────────────────────────

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, " ").trim();
}

function camelToPascal(str: string): string {
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

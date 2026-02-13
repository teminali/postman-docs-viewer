/**
 * API Request Executor
 *
 * Sends HTTP requests through our proxy route to avoid CORS.
 * Handles auth injection, variable substitution, and response parsing.
 */

import type { ParsedEndpoint, PostmanAuth, PostmanHeader } from "@/types/postman";

// ─── Types ──────────────────────────────────────────────────────────

export interface AuthConfig {
  type: "bearer" | "apikey" | "basic" | "none";
  token?: string;       // Bearer token
  apiKey?: string;       // API key value
  apiKeyHeader?: string; // API key header name (default: X-API-Key)
  username?: string;     // Basic auth
  password?: string;     // Basic auth
}

export interface RequestOverrides {
  url?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
}

export interface ExecutionResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  elapsed: number;
  size: number;
  isJson: boolean;
  parsedJson?: unknown;
}

// ─── Auth helpers ───────────────────────────────────────────────────

/** Build auth headers from config. */
export function buildAuthHeaders(auth: AuthConfig): Record<string, string> {
  switch (auth.type) {
    case "bearer":
      return auth.token ? { Authorization: `Bearer ${auth.token}` } : {};
    case "apikey":
      return auth.apiKey
        ? { [auth.apiKeyHeader || "X-API-Key"]: auth.apiKey }
        : {};
    case "basic": {
      if (!auth.username) return {};
      const encoded = btoa(`${auth.username}:${auth.password || ""}`);
      return { Authorization: `Basic ${encoded}` };
    }
    default:
      return {};
  }
}

/** Infer auth type from a Postman endpoint. */
export function inferAuthType(auth: PostmanAuth | null): AuthConfig {
  if (!auth) return { type: "none" };
  switch (auth.type) {
    case "bearer":
      return {
        type: "bearer",
        token: auth.bearer?.find((b) => b.key === "token")?.value || "",
      };
    case "apikey":
      return {
        type: "apikey",
        apiKey: auth.apikey?.find((b) => b.key === "value")?.value || "",
        apiKeyHeader: auth.apikey?.find((b) => b.key === "key")?.value || "X-API-Key",
      };
    case "basic":
      return {
        type: "basic",
        username: auth.basic?.find((b) => b.key === "username")?.value || "",
        password: auth.basic?.find((b) => b.key === "password")?.value || "",
      };
    default:
      return { type: "none" };
  }
}

// ─── Base URL management ────────────────────────────────────────────

const BASE_URL_STORAGE_KEY = "api-playground-base-url";

/** Get the stored base URL, or empty string if not set. */
export function getStoredBaseUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(BASE_URL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

/** Save the base URL to sessionStorage. */
export function setStoredBaseUrl(baseUrl: string): void {
  try {
    if (baseUrl.trim()) {
      sessionStorage.setItem(BASE_URL_STORAGE_KEY, baseUrl.trim());
    } else {
      sessionStorage.removeItem(BASE_URL_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Apply a base URL to an endpoint URL.
 * If the endpoint URL starts with http(s)://, replace the origin.
 * If the endpoint URL is a path (e.g. /api/users), prepend the base URL.
 */
export function applyBaseUrl(endpointUrl: string, baseUrl: string): string {
  if (!baseUrl) return endpointUrl;
  const trimmedBase = baseUrl.replace(/\/+$/, ""); // remove trailing slashes

  try {
    // If endpoint URL is fully qualified, replace origin
    const parsed = new URL(endpointUrl);
    const pathAndQuery = parsed.pathname + parsed.search + parsed.hash;
    return trimmedBase + pathAndQuery;
  } catch {
    // Endpoint URL is a relative path — just prepend
    const path = endpointUrl.startsWith("/") ? endpointUrl : "/" + endpointUrl;
    return trimmedBase + path;
  }
}

// ─── Variable substitution ──────────────────────────────────────────

/** Replace {{variable}} placeholders in a string with provided values. */
export function substituteVariables(
  str: string,
  variables: Record<string, string>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

/** Extract all {{variable}} names from a string. */
export function extractVariables(str: string): string[] {
  const matches = str.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

// ─── Request builder ────────────────────────────────────────────────

/** Build the final URL with query params. */
function buildUrl(
  endpoint: ParsedEndpoint,
  overrides: RequestOverrides,
  variables: Record<string, string>,
  baseUrl?: string
): string {
  let url = overrides.url || endpoint.url;
  url = substituteVariables(url, variables);
  if (baseUrl) url = applyBaseUrl(url, baseUrl);

  // Merge query params
  const params = new URLSearchParams();
  for (const qp of endpoint.queryParams) {
    if (!qp.disabled && qp.key) {
      params.set(qp.key, substituteVariables(qp.value || "", variables));
    }
  }
  // Override params
  if (overrides.queryParams) {
    for (const [k, v] of Object.entries(overrides.queryParams)) {
      if (v) params.set(k, v);
    }
  }

  const paramStr = params.toString();
  if (paramStr) {
    url += (url.includes("?") ? "&" : "?") + paramStr;
  }

  return url;
}

/** Build headers from endpoint + auth + overrides. */
function buildHeaders(
  endpoint: ParsedEndpoint,
  auth: AuthConfig,
  overrides: RequestOverrides,
  variables: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Endpoint headers
  for (const h of endpoint.headers) {
    if (!h.disabled && h.key) {
      headers[h.key] = substituteVariables(h.value || "", variables);
    }
  }

  // Auth headers
  const authHeaders = buildAuthHeaders(auth);
  Object.assign(headers, authHeaders);

  // Override headers
  if (overrides.headers) {
    Object.assign(headers, overrides.headers);
  }

  return headers;
}

// ─── Executor ───────────────────────────────────────────────────────

/** Execute an API request through the proxy. */
export async function executeRequest(
  endpoint: ParsedEndpoint,
  auth: AuthConfig,
  overrides: RequestOverrides = {},
  variables: Record<string, string> = {},
  baseUrl?: string
): Promise<ExecutionResult> {
  const url = buildUrl(endpoint, overrides, variables, baseUrl);
  const headers = buildHeaders(endpoint, auth, overrides, variables);
  const method = endpoint.method.toUpperCase();

  // Body
  let body: string | null = null;
  if (overrides.body !== undefined) {
    body = overrides.body;
  } else if (endpoint.body) {
    if (endpoint.body.mode === "raw" && endpoint.body.raw) {
      body = substituteVariables(endpoint.body.raw, variables);
    } else if (endpoint.body.mode === "urlencoded" && endpoint.body.urlencoded) {
      const params = new URLSearchParams();
      for (const item of endpoint.body.urlencoded) {
        if (!item.disabled && item.key) {
          params.set(item.key, substituteVariables(item.value || "", variables));
        }
      }
      body = params.toString();
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    } else if (endpoint.body.mode === "formdata" && endpoint.body.formdata) {
      // For formdata we serialize as JSON with a note — true multipart isn't proxied
      const obj: Record<string, string> = {};
      for (const item of endpoint.body.formdata) {
        if (!item.disabled && item.key) {
          obj[item.key] = substituteVariables(item.value || "", variables);
        }
      }
      body = JSON.stringify(obj);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  // Auto-set Content-Type for raw JSON bodies
  if (body && !headers["Content-Type"]) {
    try {
      JSON.parse(body);
      headers["Content-Type"] = "application/json";
    } catch {
      // Not JSON — leave it
    }
  }

  // Call proxy
  const res = await fetch("/api/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, method, headers, body }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Proxy error" }));
    throw new Error(err.error || `Proxy returned ${res.status}`);
  }

  const data = await res.json();

  // Try to parse response body as JSON
  let isJson = false;
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(data.body);
    isJson = true;
  } catch {
    // Not JSON
  }

  return {
    status: data.status,
    statusText: data.statusText,
    headers: data.headers,
    body: data.body,
    elapsed: data.elapsed,
    size: new TextEncoder().encode(data.body).length,
    isJson,
    parsedJson,
  };
}

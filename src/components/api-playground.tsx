"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Send,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Clock,
  Lock,
  Key,
  EyeOff,
  Eye,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  executeRequest,
  inferAuthType,
  extractVariables,
  getStoredBaseUrl,
  setStoredBaseUrl,
  type AuthConfig,
  type ExecutionResult,
  type RequestOverrides,
} from "@/lib/api-request-executor";
import type { ParsedEndpoint } from "@/types/postman";
import { getMethodColor } from "@/lib/postman-parser";

interface ApiPlaygroundProps {
  endpoint: ParsedEndpoint;
}

const AUTH_STORAGE_KEY = "api-playground-auth";

function loadStoredAuth(): AuthConfig {
  if (typeof window === "undefined") return { type: "none" };
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { type: "none" };
}

function saveAuth(auth: AuthConfig) {
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {}
}

export function ApiPlayground({ endpoint }: ApiPlaygroundProps) {
  // Auth — persisted in sessionStorage (cleared on tab close)
  const [auth, setAuth] = useState<AuthConfig>(() => {
    const stored = loadStoredAuth();
    if (stored.type !== "none") return stored;
    return inferAuthType(endpoint.auth);
  });

  // Base URL — persisted in sessionStorage alongside auth
  const [baseUrl, setBaseUrl] = useState(() => getStoredBaseUrl());

  const handleBaseUrlChange = useCallback((value: string) => {
    setBaseUrl(value);
    setStoredBaseUrl(value);
  }, []);

  // URL & body overrides
  const [url, setUrl] = useState(endpoint.url);
  const [bodyOverride, setBodyOverride] = useState(
    endpoint.body?.raw || ""
  );

  // Variables
  const allVars = useMemo(() => {
    const vars = new Set<string>();
    extractVariables(endpoint.url).forEach((v) => vars.add(v));
    if (endpoint.body?.raw) {
      extractVariables(endpoint.body.raw).forEach((v) => vars.add(v));
    }
    for (const h of endpoint.headers) {
      extractVariables(h.value || "").forEach((v) => vars.add(v));
    }
    return Array.from(vars);
  }, [endpoint]);

  const [variables, setVariables] = useState<Record<string, string>>(() =>
    Object.fromEntries(allVars.map((v) => [v, ""]))
  );

  // Execution state
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Reset URL/body when endpoint changes
  useEffect(() => {
    setUrl(endpoint.url);
    setBodyOverride(endpoint.body?.raw || "");
    setResult(null);
    setError(null);
  }, [endpoint]);

  const handleAuthChange = useCallback(
    (update: Partial<AuthConfig>) => {
      const next = { ...auth, ...update };
      setAuth(next);
      saveAuth(next);
    },
    [auth]
  );

  const handleSend = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const overrides: RequestOverrides = {};
      if (url !== endpoint.url) overrides.url = url;
      if (bodyOverride !== (endpoint.body?.raw || ""))
        overrides.body = bodyOverride;

      const res = await executeRequest(endpoint, auth, overrides, variables, baseUrl || undefined);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [endpoint, auth, url, bodyOverride, variables, baseUrl]);

  const handleCopyResponse = useCallback(() => {
    if (!result) return;
    const text = result.isJson
      ? JSON.stringify(result.parsedJson, null, 2)
      : result.body;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const hasBody = !["GET", "HEAD"].includes(endpoint.method.toUpperCase());

  return (
    <div className="space-y-4">
      {/* Base URL */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Base URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            value={baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder="https://api.example.com (leave empty to use endpoint URL as-is)"
            className="font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            {baseUrl
              ? "All endpoint paths will be appended to this base URL."
              : "No base URL set \u2014 using the full URL from each endpoint."}
            {" "}Stored in session only.
          </p>
        </CardContent>
      </Card>

      {/* Auth config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(["none", "bearer", "apikey", "basic"] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleAuthChange({ type: t })}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-xs transition-all",
                  auth.type === t
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "hover:bg-muted"
                )}
              >
                {t === "none" ? "None" : t === "bearer" ? "Bearer Token" : t === "apikey" ? "API Key" : "Basic Auth"}
              </button>
            ))}
          </div>

          {auth.type === "bearer" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Token</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={auth.token || ""}
                    onChange={(e) => handleAuthChange({ token: e.target.value })}
                    placeholder="Enter your bearer token..."
                    className="font-mono text-xs pr-8"
                  />
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowToken(!showToken)}
                    type="button"
                  >
                    {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Stored in session only — cleared when you close the tab.
              </p>
            </div>
          )}

          {auth.type === "apikey" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Header name</Label>
                <Input
                  value={auth.apiKeyHeader || "X-API-Key"}
                  onChange={(e) =>
                    handleAuthChange({ apiKeyHeader: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">API Key</Label>
                <Input
                  type={showToken ? "text" : "password"}
                  value={auth.apiKey || ""}
                  onChange={(e) =>
                    handleAuthChange({ apiKey: e.target.value })
                  }
                  placeholder="Enter API key..."
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}

          {auth.type === "basic" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Username</Label>
                <Input
                  value={auth.username || ""}
                  onChange={(e) =>
                    handleAuthChange({ username: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Password</Label>
                <Input
                  type="password"
                  value={auth.password || ""}
                  onChange={(e) =>
                    handleAuthChange({ password: e.target.value })
                  }
                  className="font-mono text-xs"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Variables */}
      {allVars.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              Variables
              <Badge variant="secondary" className="text-[10px]">
                {allVars.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {allVars.map((v) => (
                <div key={v} className="space-y-1">
                  <Label className="text-[10px] font-mono text-muted-foreground">
                    {`{{${v}}}`}
                  </Label>
                  <Input
                    value={variables[v] || ""}
                    onChange={(e) =>
                      setVariables((prev) => ({
                        ...prev,
                        [v]: e.target.value,
                      }))
                    }
                    placeholder={v}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* URL */}
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={`${getMethodColor(endpoint.method)} text-xs font-mono font-bold px-2 py-1 shrink-0 self-center`}
            >
              {endpoint.method}
            </Badge>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-xs flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={loading}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send
            </Button>
          </div>

          {/* Body editor */}
          {hasBody && (
            <div className="space-y-1.5">
              <Label className="text-xs">Body</Label>
              <textarea
                value={bodyOverride}
                onChange={(e) => setBodyOverride(e.target.value)}
                className="w-full rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
                placeholder="Request body (JSON, form data, etc.)"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Response */}
      {result && (
        <Card>
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5",
                  result.status >= 200 && result.status < 300
                    ? "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30"
                    : result.status >= 400
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30"
                    : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
                )}
              >
                {result.status} {result.statusText}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {result.elapsed}ms
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {formatSize(result.size)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={handleCopyResponse}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <CardContent className="p-0">
            <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
              {result.isJson
                ? JSON.stringify(result.parsedJson, null, 2)
                : result.body}
            </pre>
          </CardContent>

          {/* Response headers (collapsible) */}
          <ResponseHeaders headers={result.headers} />
        </Card>
      )}
    </div>
  );
}

// ─── Response headers (collapsible) ─────────────────────────────────

function ResponseHeaders({ headers }: { headers: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(headers);
  if (entries.length === 0) return null;

  return (
    <div className="border-t">
      <button
        className="flex items-center gap-2 w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Response Headers ({entries.length})
      </button>
      {open && (
        <div className="px-4 pb-3">
          <table className="w-full text-xs">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k} className="border-b last:border-0">
                  <td className="py-1 pr-3 font-mono text-muted-foreground whitespace-nowrap">
                    {k}
                  </td>
                  <td className="py-1 font-mono break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

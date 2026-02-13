"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, Code2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  generateApiSnippet,
  API_PLATFORMS,
  type ApiSnippetPlatform,
} from "@/lib/api-snippet-generator";
import {
  inferAuthType,
  getStoredBaseUrl,
  type AuthConfig,
} from "@/lib/api-request-executor";
import type { ParsedEndpoint } from "@/types/postman";

interface ApiCodeSnippetsProps {
  endpoint: ParsedEndpoint;
}

const AUTH_STORAGE_KEY = "api-playground-auth";

function loadStoredAuth(): AuthConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function ApiCodeSnippets({ endpoint }: ApiCodeSnippetsProps) {
  const [platform, setPlatform] = useState<ApiSnippetPlatform>("curl");
  const [copied, setCopied] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const currentPlatform = API_PLATFORMS.find((p) => p.id === platform)!;

  // Use stored auth (from playground) or infer from endpoint
  const auth = useMemo(() => {
    return loadStoredAuth() || inferAuthType(endpoint.auth);
  }, [endpoint]);

  // Use stored base URL (from playground)
  const baseUrl = useMemo(() => getStoredBaseUrl(), []);

  const snippet = useMemo(
    () => generateApiSnippet(platform, endpoint, auth, baseUrl || undefined),
    [platform, endpoint, auth, baseUrl]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snippet]);

  const visiblePlatforms = showAllPlatforms
    ? API_PLATFORMS
    : API_PLATFORMS.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Platform selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {visiblePlatforms.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
                  platform === p.id
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border hover:border-foreground/50 hover:bg-muted"
                )}
              >
                <span className="text-xs w-5 text-center shrink-0">
                  {p.icon}
                </span>
                {p.label}
              </button>
            ))}
            {!showAllPlatforms && API_PLATFORMS.length > 5 && (
              <button
                onClick={() => setShowAllPlatforms(true)}
                className="flex items-center gap-1 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all"
              >
                +{API_PLATFORMS.length - 5} more
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code output */}
      <Card>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono">
              {currentPlatform.language}
            </Badge>
            <span className="text-sm font-medium">
              {currentPlatform.label}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono font-bold"
            >
              {endpoint.method}
            </Badge>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {endpoint.name}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs shrink-0"
            onClick={handleCopy}
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
          <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-[500px] overflow-y-auto">
            {snippet}
          </pre>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        {auth.type !== "none"
          ? `Your ${auth.type} credentials are included in the snippet.`
          : "Set up authentication in the Playground tab to include credentials."}{" "}
        Replace {`{{variables}}`} with actual values.
      </p>
    </div>
  );
}

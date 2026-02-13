"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, Code2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  generateSnippet,
  PLATFORMS,
  OPERATIONS,
  type SnippetPlatform,
  type SnippetOperation,
} from "@/lib/firestore-snippet-generator";
import type { FirestoreCollectionSchema } from "@/types/firestore-schema";

interface FirestoreCodeSnippetsProps {
  collection: FirestoreCollectionSchema;
}

export function FirestoreCodeSnippets({
  collection: col,
}: FirestoreCodeSnippetsProps) {
  const [platform, setPlatform] = useState<SnippetPlatform>("javascript");
  const [operation, setOperation] = useState<SnippetOperation>("getAll");
  const [copied, setCopied] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const currentOperation = OPERATIONS.find((o) => o.id === operation)!;

  const snippet = useMemo(
    () => generateSnippet(platform, operation, col),
    [platform, operation, col]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snippet]);

  // Show top 4 platforms by default, expand to show all
  const visiblePlatforms = showAllPlatforms ? PLATFORMS : PLATFORMS.slice(0, 4);

  return (
    <div className="space-y-6 max-w-4xl">
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
                <span className="text-xs w-5 text-center shrink-0">{p.icon}</span>
                {p.label}
              </button>
            ))}
            {!showAllPlatforms && PLATFORMS.length > 4 && (
              <button
                onClick={() => setShowAllPlatforms(true)}
                className="flex items-center gap-1 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-all"
              >
                +{PLATFORMS.length - 4} more
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operation selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {OPERATIONS.map((op) => (
              <button
                key={op.id}
                onClick={() => setOperation(op.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-all",
                  operation === op.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/50 hover:bg-muted"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium",
                    operation === op.id ? "text-background" : "text-foreground"
                  )}
                >
                  {op.label}
                </p>
                <p
                  className={cn(
                    "text-[11px] mt-0.5",
                    operation === op.id
                      ? "text-background/70"
                      : "text-muted-foreground"
                  )}
                >
                  {op.description}
                </p>
              </button>
            ))}
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
            <span className="text-sm font-medium">{currentPlatform.label}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground">{currentOperation.label}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <code className="text-xs font-mono text-muted-foreground">{col.path}</code>
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
          <div className="relative">
            <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed max-h-[500px] overflow-y-auto">
              {snippet}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Quick info */}
      <p className="text-[11px] text-muted-foreground text-center">
        Snippets are generated from your <strong>{col.name}</strong> schema ({col.fields.length} fields).
        Replace placeholder values with your actual credentials and data.
      </p>
    </div>
  );
}

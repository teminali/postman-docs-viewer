"use client";

import { useState, useCallback } from "react";
import { Bot, Loader2, Send, FolderTree, FileJson, FileText, Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SimpleMarkdown } from "@/components/simple-markdown";
import { getAPIKey } from "@/lib/ai-settings";
import { generateWithGemini } from "@/lib/gemini";
import {
  buildCollectionIndex,
  buildScopedIndex,
  buildMinimalCollectionIndex,
  buildMinimalScopedIndex,
  listFoldersForScope,
} from "@/lib/ai-collection-index";
import { findRelatedEndpoints } from "@/lib/related-endpoints";
import { buildPromptForAI } from "@/lib/prompt-for-ai";
import type { ParsedCollection } from "@/lib/postman-parser";
import { cn } from "@/lib/utils";

interface AIAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: ParsedCollection;
  onOpenSettings?: () => void;
}

type Scope = "entire" | "folders";

export function AIAssistantSheet({
  open,
  onOpenChange,
  collection,
  onOpenSettings,
}: AIAssistantSheetProps) {
  const [scope, setScope] = useState<Scope>("entire");
  const [selectedPathKeys, setSelectedPathKeys] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [contentType, setContentType] = useState<"ask" | "prompt">("ask");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const folderList = listFoldersForScope(collection);

  const filteredFolders = folderList.filter((f) =>
    f.pathKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pathKeysForScope =
    scope === "entire"
      ? null
      : selectedPathKeys.length > 0
        ? selectedPathKeys
        : folderList.map((f) => f.pathKey);

  const toggleFolder = useCallback((pathKey: string) => {
    setSelectedPathKeys((prev) =>
      prev.includes(pathKey) ? prev.filter((k) => k !== pathKey) : [...prev, pathKey]
    );
  }, []);

  const handleSend = useCallback(async () => {
    const apiKey = getAPIKey("gemini");
    if (!apiKey?.trim()) {
      setError("No API key set. Open Settings to add your Gemini API key.");
      return;
    }
    const q = question.trim();
    if (!q) return;

    setError(null);
    setResponse("");
    setContentType("ask");
    setLoading(true);

    try {
      const pathKeys = scope === "entire" ? null : selectedPathKeys.length ? selectedPathKeys : folderList.map((f) => f.pathKey);
      const needsFullContext = /flow|sequence|order|steps|explain|how|describe|auth|summary|overview/i.test(q);
      const index =
        scope === "entire"
          ? needsFullContext
            ? buildCollectionIndex(collection)
            : buildMinimalCollectionIndex(collection)
          : needsFullContext
            ? buildScopedIndex(collection, pathKeys!)
            : buildMinimalScopedIndex(collection, pathKeys!);
      const connections = pathKeys ? findRelatedEndpoints(collection, pathKeys) : [];
      const payload = connections.length > 0 ? { ...index, connections } : index;
      const contextJson = JSON.stringify(payload, null, 0);
      const result = await generateWithGemini(apiKey, q, contextJson);
      if (result.error) {
        setError(result.error);
      } else {
        setResponse(result.text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [collection, scope, selectedPathKeys, folderList, question]);

  const handleGeneratePrompt = useCallback(() => {
    setError(null);
    const prompt = buildPromptForAI(collection, pathKeysForScope ?? null);
    setResponse(prompt);
    setContentType("prompt");
  }, [collection, pathKeysForScope]);

  const handleCopyPrompt = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response);
      toast.success("Copied to clipboard");
    }
  }, [response]);

  const hasKey = !!getAPIKey("gemini")?.trim();
  const hasOutput = !!response.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-lg"
        showCloseButton={true}
      >
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </SheetTitle>
          <SheetDescription>
            Ask questions about this API collection, or generate a prompt (endpoints + example requests/responses) to copy into any AI for implementation tasks.
          </SheetDescription>
        </SheetHeader>

        {!hasKey && (
          <div className="mx-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Set your Gemini API key in Settings to use the assistant.
            </p>
            {onOpenSettings && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => { onOpenChange(false); onOpenSettings(); }}
              >
                Open Settings
              </Button>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4">
          {/* Scope */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Scope</span>
            <div className="flex gap-2">
              <Button
                variant={scope === "entire" ? "default" : "outline"}
                size="sm"
                onClick={() => setScope("entire")}
              >
                <FileJson className="mr-1 h-3.5 w-3.5" />
                Entire collection
              </Button>
              <Button
                variant={scope === "folders" ? "default" : "outline"}
                size="sm"
                onClick={() => setScope("folders")}
              >
                <FolderTree className="mr-1 h-3.5 w-3.5" />
                Selected folders
              </Button>
            </div>
          </div>

          {scope === "folders" && (
            <div className="space-y-2 flex flex-col flex-1 min-h-0">
              <span className="text-sm font-medium">Folders (select to include)</span>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-1">
                  {filteredFolders.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No folders found</p>
                  ) : filteredFolders.map((f) => {
                    const selected = selectedPathKeys.includes(f.pathKey);
                    return (
                      <button
                        key={f.pathKey}
                        type="button"
                        onClick={() => toggleFolder(f.pathKey)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                          selected
                            ? "bg-primary/15 text-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs",
                            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                          )}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <span className="truncate" title={f.pathKey}>{f.pathKey}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {f.endpointCount} eps
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Question */}
          <div className="space-y-2 shrink-0">
            <label className="text-sm font-medium">Your question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What authentication methods are used? Summarize the User Management endpoints."
              className="min-h-[80px] w-full resize-y rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              disabled={!hasKey}
            />
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              onClick={handleSend}
              disabled={loading || !question.trim() || !hasKey}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? "Analyzing…" : "Ask"}
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePrompt}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate prompt
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive shrink-0">
              {error}
            </div>
          )}

          {hasOutput && (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-sm font-medium">
                  {contentType === "prompt" ? "Generated prompt" : "Response"}
                </span>
                {contentType === "prompt" && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyPrompt}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                )}
              </div>
              <ScrollArea className="min-h-0 flex-1 rounded-md border bg-muted/30 p-3">
                <div className="pr-2">
                  {contentType === "prompt" ? (
                    <pre className="whitespace-pre-wrap text-xs font-mono">{response}</pre>
                  ) : (
                    <SimpleMarkdown text={response} />
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

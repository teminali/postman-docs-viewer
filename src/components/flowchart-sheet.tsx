"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GitBranch, Loader2, Sparkles, FolderTree, FileJson, Copy, Download, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { collectionToMermaidStructure } from "@/lib/flow-graph";
import { buildCollectionIndex, buildScopedIndex, listFoldersForScope } from "@/lib/ai-collection-index";
import { generateFlowchartWithGemini } from "@/lib/ai-flowchart";
import { getAPIKey } from "@/lib/ai-settings";
import { downloadDiagramAsPng, downloadDiagramAsPdf } from "@/lib/export-diagram";
import type { ParsedCollection } from "@/lib/postman-parser";
import { cn } from "@/lib/utils";

const DRAWER_MIN_WIDTH = 320;
const DRAWER_MAX_WIDTH = 1200;
const DRAWER_DEFAULT_WIDTH = 420;

interface FlowchartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: ParsedCollection;
  onOpenSettings?: () => void;
}

type Scope = "entire" | "folders";

export function FlowchartSheet({
  open,
  onOpenChange,
  collection,
  onOpenSettings,
}: FlowchartSheetProps) {
  const [scope, setScope] = useState<Scope>("folders");
  const [selectedPathKeys, setSelectedPathKeys] = useState<string[]>([]);
  const [mermaidCode, setMermaidCode] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(DRAWER_DEFAULT_WIDTH);
  const [resizing, setResizing] = useState(false);
  const resizeStartRef = useRef({ x: 0, w: 0 });
  const diagramSvgRef = useRef<string | null>(null);

  const folderList = listFoldersForScope(collection);

  // Resize: drag left edge (sheet is on the right, so left edge = handle)
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const { x, w } = resizeStartRef.current;
      const delta = x - e.clientX; // drag left = positive delta = wider
      let next = w + delta;
      next = Math.max(DRAWER_MIN_WIDTH, Math.min(DRAWER_MAX_WIDTH, next));
      setDrawerWidth(next);
    };
    const onUp = () => {
      setResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizing]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeStartRef.current = { x: e.clientX, w: drawerWidth };
    setResizing(true);
  }, [drawerWidth]);

  const toggleFolder = useCallback((pathKey: string) => {
    setSelectedPathKeys((prev) =>
      prev.includes(pathKey) ? prev.filter((k) => k !== pathKey) : [...prev, pathKey]
    );
  }, []);

  const folderPathKeys = scope === "folders" && selectedPathKeys.length > 0
    ? selectedPathKeys
    : folderList.map((f) => f.pathKey);

  const handleFromStructure = useCallback(() => {
    setError(null);
    diagramSvgRef.current = null;
    const code =
      scope === "entire"
        ? collectionToMermaidStructure(collection)
        : collectionToMermaidStructure(collection, folderPathKeys);
    setMermaidCode(code);
  }, [collection, scope, folderPathKeys]);

  const handleGenerateWithAI = useCallback(async () => {
    const apiKey = getAPIKey("gemini");
    if (!apiKey?.trim()) {
      setError("No API key set. Open Settings to add your Gemini API key.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const index =
        scope === "entire"
          ? buildCollectionIndex(collection)
          : buildScopedIndex(
              collection,
              selectedPathKeys.length ? selectedPathKeys : folderList.map((f) => f.pathKey)
            );
      const indexJson = JSON.stringify(index);
      const result = await generateFlowchartWithGemini(apiKey, indexJson, aiPrompt.trim() || undefined);
      if (result.error) {
        setError(result.error);
      } else if (result.mermaid) {
        diagramSvgRef.current = null;
        setMermaidCode(result.mermaid);
      } else {
        setError("No diagram returned.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [collection, scope, selectedPathKeys, folderList, aiPrompt]);

  const copyMermaid = useCallback(() => {
    if (mermaidCode) {
      navigator.clipboard.writeText(mermaidCode);
    }
  }, [mermaidCode]);

  const handleSvgReady = useCallback((svg: string) => {
    diagramSvgRef.current = svg;
  }, []);

  const handleExportPng = useCallback(async () => {
    const svg = diagramSvgRef.current;
    if (!svg) {
      setError("No diagram to export. Generate a flowchart first.");
      return;
    }
    setError(null);
    try {
      await downloadDiagramAsPng(svg, "flowchart.png");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    const svg = diagramSvgRef.current;
    if (!svg) {
      setError("No diagram to export. Generate a flowchart first.");
      return;
    }
    setError(null);
    try {
      await downloadDiagramAsPdf(svg, "flowchart.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }, []);

  const hasKey = !!getAPIKey("gemini")?.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col"
        style={{
          width: drawerWidth,
          minWidth: DRAWER_MIN_WIDTH,
          maxWidth: "90vw",
        }}
        showCloseButton
      >
        {/* Resize handle: hover on left edge and drag */}
        <div
          role="separator"
          aria-label="Resize flowchart panel"
          onMouseDown={handleResizeStart}
          className="absolute left-0 top-0 z-10 h-full w-2 cursor-col-resize border-l border-transparent hover:border-primary/50 hover:bg-primary/5"
          style={{ touchAction: "none" }}
        />
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Flowchart
          </SheetTitle>
          <SheetDescription>
            Generate a flowchart from your API structure (by folder) or let AI suggest a flow. Data is keyed by endpoint IDs so the diagram stays connected to your collection.
          </SheetDescription>
        </SheetHeader>

        {!hasKey && (
          <div className="mx-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              &quot;From structure&quot; works without an API key. Set your Gemini key in Settings to use &quot;Generate with AI&quot;.
            </p>
            {onOpenSettings && (
              <Button variant="outline" size="sm" className="mt-2" onClick={() => { onOpenChange(false); onOpenSettings(); }}>
                Open Settings
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4">
          {/* Scope */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Scope</span>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="pointer-events-none opacity-50"
                    >
                      <FileJson className="mr-1 h-3.5 w-3.5" />
                      Entire collection
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Not available yet
                </TooltipContent>
              </Tooltip>
              <Button variant={scope === "folders" ? "default" : "outline"} size="sm" onClick={() => setScope("folders")}>
                <FolderTree className="mr-1 h-3.5 w-3.5" />
                Selected folders
              </Button>
            </div>
          </div>

          {scope === "folders" && (
            <div className="space-y-2">
              <span className="text-sm font-medium">Folders</span>
              <ScrollArea className="h-28 rounded-md border p-2">
                <div className="space-y-1">
                  {folderList.map((f) => {
                    const selected = selectedPathKeys.includes(f.pathKey);
                    return (
                      <button
                        key={f.pathKey}
                        type="button"
                        onClick={() => toggleFolder(f.pathKey)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                          selected ? "bg-primary/15" : "hover:bg-muted"
                        )}
                      >
                        <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground")}>
                          {selected ? "✓" : ""}
                        </span>
                        <span className="truncate">{f.pathKey}</span>
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">{f.endpointCount} endpoints</span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleFromStructure} className="gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              From structure
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={loading || !hasKey}
              className="gap-1.5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Generating…" : "Generate with AI"}
            </Button>
          </div>

          {hasKey && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Optional: describe the flow (e.g. &quot;typical login then user profile&quot;)</label>
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. login → get user → update profile"
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {mermaidCode && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Diagram</span>
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowRaw((r) => !r)}>
                    {showRaw ? "Hide" : "Show"} code
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copyMermaid}>
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExportPng}>
                    <FileImage className="h-3 w-3" /> PNG
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleExportPdf}>
                    <Download className="h-3 w-3" /> PDF
                  </Button>
                </div>
              </div>
              {showRaw && (
                <pre className="max-h-32 overflow-auto rounded border bg-muted/30 p-2 text-xs">{mermaidCode}</pre>
              )}
              <ScrollArea className="min-h-[200px] flex-1 rounded-lg border">
                <div className="p-4">
                  <MermaidDiagram chart={mermaidCode} onSvgReady={handleSvgReady} />
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

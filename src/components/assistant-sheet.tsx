"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Code2,
  FileText,
  ChevronDown,
  Zap,
  Search,
  Folder,
  Globe,
  X,
  Rocket,
  Bug,
  Pencil,
  Recycle,
  FlaskConical,
  Package,
  FileEdit,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import {
  generate,
  resolveEndpoints,
  getFolderList,
  FRAMEWORKS,
  PROMPT_TEMPLATES,
  DEFAULT_OPTIONS,
  type PromptFramework,
  type PromptOptions,
  type GenerationMode,
  type PromptTemplateId,
  type FolderInfo,
} from "@/lib/prompt-engine";
import type { ParsedEndpoint } from "@/types/postman";
import type { ParsedCollection } from "@/lib/postman-parser";
import { CodeViewer } from "@/components/code-viewer";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<PromptTemplateId, LucideIcon> = {
  implement: Rocket,
  bugfix: Bug,
  update: Pencil,
  refactor: Recycle,
  test: FlaskConical,
  migrate: Package,
  document: FileEdit,
  optimize: Gauge,
};

// ─── Props ─────────────────────────────────────────────────────────────

interface AssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: ParsedCollection;
  selectedEndpoint: ParsedEndpoint | null;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AssistantSheet({
  open,
  onOpenChange,
  collection,
  selectedEndpoint,
}: AssistantSheetProps) {
  const [mode, setMode] = useState<GenerationMode>("prompt");
  const [framework, setFramework] = useState<PromptFramework>("typescript");
  const [template, setTemplate] = useState<PromptTemplateId>("implement");
  const [options, setOptions] = useState<PromptOptions>(DEFAULT_OPTIONS);
  const [output, setOutput] = useState<string>("");
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);

  // ── Selection state ──
  const [scopeMode, setScopeMode] = useState<"all" | "custom">("custom");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [selectedEndpointIds, setSelectedEndpointIds] = useState<string[]>(() =>
    selectedEndpoint ? [selectedEndpoint.id] : []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [pickerTab, setPickerTab] = useState<"folders" | "endpoints">("folders");

  // ── Derived data ──
  const folders = useMemo(() => getFolderList(collection), [collection]);

  // Initialize selection when endpoint changes
  useMemo(() => {
    if (selectedEndpoint) {
      setSelectedEndpointIds((prev) =>
        prev.length === 0 ? [selectedEndpoint.id] : prev
      );
    }
  }, [selectedEndpoint]);

  const resolvedEndpoints = useMemo(() => {
    if (scopeMode === "all") return collection.endpoints;
    return resolveEndpoints(collection, selectedFolders, selectedEndpointIds);
  }, [scopeMode, collection, selectedFolders, selectedEndpointIds]);

  // ── Filtered lists for search ──
  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return folders;
    const q = searchQuery.toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, searchQuery]);

  const filteredEndpoints = useMemo(() => {
    if (!searchQuery.trim()) return collection.endpoints;
    const q = searchQuery.toLowerCase();
    return collection.endpoints.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        ep.url.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.folderPath.join(" ").toLowerCase().includes(q)
    );
  }, [collection.endpoints, searchQuery]);

  // ── Handlers ──
  const handleGenerate = useCallback(() => {
    const eps = resolvedEndpoints.length > 0 ? resolvedEndpoints : collection.endpoints;
    const scope = scopeMode === "all" ? "collection" as const : (eps.length === 1 ? "endpoint" as const : "folder" as const);

    const folderName =
      selectedFolders.length === 1
        ? selectedFolders[0]
        : selectedFolders.length > 1
        ? `${selectedFolders.length} folders`
        : undefined;

    const result = generate(
      mode,
      framework,
      eps,
      collection,
      options,
      scope,
      folderName,
      mode === "prompt" ? template : undefined,
    );
    setOutput(result);
  }, [mode, framework, template, resolvedEndpoints, collection, options, scopeMode, selectedFolders]);

  const toggleOption = (key: keyof PromptOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFolder = (name: string) => {
    setSelectedFolders((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  const toggleEndpoint = (id: string) => {
    setSelectedEndpointIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectAllFolders = () => setSelectedFolders(folders.map((f) => f.name));
  const clearFolders = () => setSelectedFolders([]);
  const selectAllEndpoints = () => setSelectedEndpointIds(filteredEndpoints.map((e) => e.id));
  const clearEndpoints = () => setSelectedEndpointIds([]);

  const fw = FRAMEWORKS.find((f) => f.id === framework)!;
  const visibleFrameworks = showAllFrameworks ? FRAMEWORKS : FRAMEWORKS.slice(0, 6);
  const totalSelected = selectedFolders.length + selectedEndpointIds.length;

  // Method color helper
  const methodColor = (m: string) => {
    switch (m.toUpperCase()) {
      case "GET": return "text-green-500";
      case "POST": return "text-yellow-500";
      case "PUT": return "text-blue-500";
      case "PATCH": return "text-orange-500";
      case "DELETE": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Assistant
          </SheetTitle>
          <SheetDescription>
            Generate integration prompts or code snippets. Select endpoints, pick a template, and go.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col px-6 pb-6 gap-4">
            {/* ── Mode toggle ── */}
            <Tabs
              value={mode}
              onValueChange={(v) => { setMode(v as GenerationMode); setOutput(""); }}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="prompt" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Generate Prompt
                </TabsTrigger>
                <TabsTrigger value="code" className="gap-1.5">
                  <Code2 className="h-3.5 w-3.5" />
                  Generate Code
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* ── Template (Prompt mode only) ── */}
            {mode === "prompt" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Template
                </Label>
                <div className="flex flex-wrap gap-1">
                  {PROMPT_TEMPLATES.map((tpl) => {
                    const Icon = TEMPLATE_ICONS[tpl.id];
                    return (
                      <Button
                        key={tpl.id}
                        variant={template === tpl.id ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-[11px] gap-1 px-2"
                        onClick={() => setTemplate(tpl.id)}
                      >
                        <Icon className="h-3 w-3" />
                        {tpl.label}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {PROMPT_TEMPLATES.find((t) => t.id === template)?.description}
                </p>
              </div>
            )}

            {/* ── Scope: All or Custom ── */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scope
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={scopeMode === "all" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  onClick={() => setScopeMode("all")}
                >
                  <Globe className="h-3 w-3" />
                  All endpoints ({collection.totalRequests})
                </Button>
                <Button
                  variant={scopeMode === "custom" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  onClick={() => setScopeMode("custom")}
                >
                  <Search className="h-3 w-3" />
                  Custom selection
                  {scopeMode === "custom" && totalSelected > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 text-[9px] px-1">
                      {resolvedEndpoints.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* ── Custom picker (folders + endpoints with search) ── */}
            {scopeMode === "custom" && (
              <div className="rounded-lg border bg-muted/20">
                {/* Search bar */}
                <div className="relative border-b">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search folders or endpoints..."
                    className="border-0 pl-9 h-9 text-xs bg-transparent focus-visible:ring-0"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Tabs: Folders / Endpoints */}
                <div className="flex items-center border-b">
                  <button
                    onClick={() => setPickerTab("folders")}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-medium text-center transition-colors",
                      pickerTab === "folders"
                        ? "border-b-2 border-foreground text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Folders ({folders.length})
                  </button>
                  <button
                    onClick={() => setPickerTab("endpoints")}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-medium text-center transition-colors",
                      pickerTab === "endpoints"
                        ? "border-b-2 border-foreground text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Endpoints ({collection.totalRequests})
                  </button>
                </div>

                {/* Selection actions */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                  <span className="text-[10px] text-muted-foreground">
                    {pickerTab === "folders"
                      ? `${selectedFolders.length} folder${selectedFolders.length !== 1 ? "s" : ""} selected`
                      : `${selectedEndpointIds.length} endpoint${selectedEndpointIds.length !== 1 ? "s" : ""} selected`}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={pickerTab === "folders" ? selectAllFolders : selectAllEndpoints}
                    >
                      Select all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={pickerTab === "folders" ? clearFolders : clearEndpoints}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-48 overflow-y-auto">
                  {pickerTab === "folders" ? (
                    filteredFolders.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No folders match &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      filteredFolders.map((f) => (
                        <label
                          key={f.name}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedFolders.includes(f.name)}
                            onCheckedChange={() => toggleFolder(f.name)}
                            className="h-3.5 w-3.5"
                          />
                          <Folder className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{f.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {f.endpointCount}
                          </span>
                        </label>
                      ))
                    )
                  ) : (
                    filteredEndpoints.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No endpoints match &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      filteredEndpoints.map((ep) => (
                        <label
                          key={ep.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedEndpointIds.includes(ep.id)}
                            onCheckedChange={() => toggleEndpoint(ep.id)}
                            className="h-3.5 w-3.5"
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-mono font-bold px-1 py-0 min-w-[36px] text-center justify-center shrink-0",
                              methodColor(ep.method)
                            )}
                          >
                            {ep.method.toUpperCase()}
                          </Badge>
                          <span className="flex-1 truncate" title={ep.url}>
                            {ep.name}
                          </span>
                        </label>
                      ))
                    )
                  )}
                </div>

                {/* Summary bar */}
                {resolvedEndpoints.length > 0 && (
                  <div className="border-t px-3 py-1.5 bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">
                      {resolvedEndpoints.length} endpoint{resolvedEndpoints.length !== 1 ? "s" : ""} will be included in the output
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Framework ── */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Framework
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {visibleFrameworks.map((f) => (
                  <Button
                    key={f.id}
                    variant={framework === f.id ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2"
                    onClick={() => setFramework(f.id)}
                  >
                    <span className="text-xs">{f.icon}</span>
                    {f.label}
                  </Button>
                ))}
                {!showAllFrameworks && FRAMEWORKS.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2 text-muted-foreground"
                    onClick={() => setShowAllFrameworks(true)}
                  >
                    +{FRAMEWORKS.length - 6} more
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{fw.description}</p>
            </div>

            {/* ── Options ── */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Include
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: "includeTypes" as const, label: "Type definitions" },
                    { key: "includeErrorHandling" as const, label: "Error handling" },
                    { key: "includeAuth" as const, label: "Authentication" },
                    { key: "includeExamples" as const, label: "Usage examples" },
                    { key: "includeTests" as const, label: "Unit tests" },
                  ] as const
                ).map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Checkbox
                      checked={options[key]}
                      onCheckedChange={() => toggleOption(key)}
                      className="h-3.5 w-3.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* ── Generate button ── */}
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={scopeMode === "custom" && resolvedEndpoints.length === 0}
            >
              <Zap className="h-4 w-4" />
              {mode === "prompt"
                ? `Generate ${PROMPT_TEMPLATES.find((t) => t.id === template)?.label || ""} Prompt`
                : "Generate Code"}
              {scopeMode === "custom" && resolvedEndpoints.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-[9px] px-1.5">
                  {resolvedEndpoints.length} endpoints
                </Badge>
              )}
            </Button>

            {/* ── Output ── */}
            {output && (
              <>
                <Separator />
                <CodeViewer
                  code={output}
                  language={mode === "code" ? fw.language : "markdown"}
                  fileName={mode === "code" ? `api-client${fw.fileExt}` : `prompt-${template}.md`}
                  badge={
                    mode === "prompt"
                      ? PROMPT_TEMPLATES.find((t) => t.id === template)?.label || "Prompt"
                      : fw.label
                  }
                />
              </>
            )}

            {/* Empty state hint */}
            {!output && (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="rounded-full bg-muted p-3 mb-3">
                  {mode === "prompt" ? (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Code2 className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {mode === "prompt"
                    ? "Generate an AI-ready prompt"
                    : "Generate integration code"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {mode === "prompt"
                    ? "Select endpoints, pick a template, and generate a structured prompt for Cursor, Copilot, or ChatGPT."
                    : "Select endpoints and generate production-ready code with types, error handling, and auth."}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

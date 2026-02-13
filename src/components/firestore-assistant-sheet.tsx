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
  Database,
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
  firestoreGenerate,
  resolveCollections,
  getCollectionList,
  FIRESTORE_FRAMEWORKS,
  FIRESTORE_TEMPLATES,
  DEFAULT_FIRESTORE_OPTIONS,
  type FirestoreFramework,
  type FirestorePromptOptions,
  type FirestoreGenerationMode,
  type FirestoreTemplateId,
  type CollectionInfo,
} from "@/lib/firestore-prompt-engine";
import type { FirestoreSchema } from "@/types/firestore-schema";
import { CodeViewer } from "@/components/code-viewer";
import { cn } from "@/lib/utils";

const TEMPLATE_ICONS: Record<FirestoreTemplateId, LucideIcon> = {
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

interface FirestoreAssistantSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: FirestoreSchema;
}

// ─── Component ─────────────────────────────────────────────────────────

export function FirestoreAssistantSheet({
  open,
  onOpenChange,
  schema,
}: FirestoreAssistantSheetProps) {
  const [mode, setMode] = useState<FirestoreGenerationMode>("prompt");
  const [framework, setFramework] = useState<FirestoreFramework>("typescript");
  const [template, setTemplate] = useState<FirestoreTemplateId>("implement");
  const [options, setOptions] = useState<FirestorePromptOptions>(DEFAULT_FIRESTORE_OPTIONS);
  const [output, setOutput] = useState<string>("");
  const [showAllFrameworks, setShowAllFrameworks] = useState(false);

  // ── Selection state ──
  const [scopeMode, setScopeMode] = useState<"all" | "custom">("all");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived data ──
  const collections = useMemo(() => getCollectionList(schema), [schema]);
  const totalCollections = collections.length;

  const resolvedCollections = useMemo(() => {
    if (scopeMode === "all") {
      // flatten all
      const all: import("@/types/firestore-schema").FirestoreCollectionSchema[] = [];
      function walk(col: import("@/types/firestore-schema").FirestoreCollectionSchema) {
        all.push(col);
        col.subcollections.forEach(walk);
      }
      schema.collections.forEach(walk);
      return all;
    }
    return resolveCollections(schema, selectedPaths);
  }, [scopeMode, schema, selectedPaths]);

  // ── Filtered collections for search ──
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const q = searchQuery.toLowerCase();
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q)
    );
  }, [collections, searchQuery]);

  // ── Handlers ──
  const handleGenerate = useCallback(() => {
    const cols = resolvedCollections.length > 0 ? resolvedCollections : resolvedCollections;
    const result = firestoreGenerate(
      mode,
      framework,
      cols,
      schema,
      options,
      mode === "prompt" ? template : undefined,
    );
    setOutput(result);
  }, [mode, framework, template, resolvedCollections, schema, options]);

  const toggleOption = (key: keyof FirestorePromptOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCollection = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const selectAllCollections = () => setSelectedPaths(collections.map((c) => c.path));
  const clearCollections = () => setSelectedPaths([]);

  const fw = FIRESTORE_FRAMEWORKS.find((f) => f.id === framework)!;
  const visibleFrameworks = showAllFrameworks ? FIRESTORE_FRAMEWORKS : FIRESTORE_FRAMEWORKS.slice(0, 6);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Assistant
          </SheetTitle>
          <SheetDescription>
            Generate Firestore integration prompts or code snippets. Select collections, pick a template, and go.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col px-6 pb-6 gap-4">
            {/* ── Mode toggle ── */}
            <Tabs
              value={mode}
              onValueChange={(v) => { setMode(v as FirestoreGenerationMode); setOutput(""); }}
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
                  {FIRESTORE_TEMPLATES.map((tpl) => {
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
                  {FIRESTORE_TEMPLATES.find((t) => t.id === template)?.description}
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
                  All collections ({totalCollections})
                </Button>
                <Button
                  variant={scopeMode === "custom" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px] gap-1.5"
                  onClick={() => setScopeMode("custom")}
                >
                  <Search className="h-3 w-3" />
                  Custom selection
                  {scopeMode === "custom" && selectedPaths.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 text-[9px] px-1">
                      {selectedPaths.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* ── Custom picker (collections with search) ── */}
            {scopeMode === "custom" && (
              <div className="rounded-lg border bg-muted/20">
                {/* Search bar */}
                <div className="relative border-b">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collections..."
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

                {/* Selection actions */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
                  <span className="text-[10px] text-muted-foreground">
                    {selectedPaths.length} collection{selectedPaths.length !== 1 ? "s" : ""} selected
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={selectAllCollections}
                    >
                      Select all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5"
                      onClick={clearCollections}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCollections.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No collections match &ldquo;{searchQuery}&rdquo;
                    </p>
                  ) : (
                    filteredCollections.map((col) => (
                      <label
                        key={col.path}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedPaths.includes(col.path)}
                          onCheckedChange={() => toggleCollection(col.path)}
                          className="h-3.5 w-3.5"
                        />
                        <Database className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{col.path}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {col.fieldCount} fields
                        </span>
                      </label>
                    ))
                  )}
                </div>

                {/* Summary bar */}
                {resolvedCollections.length > 0 && (
                  <div className="border-t px-3 py-1.5 bg-muted/30">
                    <p className="text-[10px] text-muted-foreground">
                      {resolvedCollections.length} collection{resolvedCollections.length !== 1 ? "s" : ""} will be included in the output
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
                {!showAllFrameworks && FIRESTORE_FRAMEWORKS.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] gap-1 px-2 text-muted-foreground"
                    onClick={() => setShowAllFrameworks(true)}
                  >
                    +{FIRESTORE_FRAMEWORKS.length - 6} more
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
                    { key: "includeCrud" as const, label: "CRUD operations" },
                    { key: "includeRealtimeListeners" as const, label: "Realtime listeners" },
                    { key: "includeSecurityRules" as const, label: "Security rules" },
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
              disabled={scopeMode === "custom" && resolvedCollections.length === 0}
            >
              <Zap className="h-4 w-4" />
              {mode === "prompt"
                ? `Generate ${FIRESTORE_TEMPLATES.find((t) => t.id === template)?.label || ""} Prompt`
                : "Generate Code"}
              {scopeMode === "custom" && selectedPaths.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 text-[9px] px-1.5">
                  {selectedPaths.length} collections
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
                  fileName={mode === "code" ? `firestore-client${fw.fileExt}` : `prompt-${template}.md`}
                  badge={
                    mode === "prompt"
                      ? FIRESTORE_TEMPLATES.find((t) => t.id === template)?.label || "Prompt"
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
                    : "Generate Firestore integration code"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {mode === "prompt"
                    ? "Select collections, pick a template, and generate a structured prompt for Cursor, Copilot, or ChatGPT."
                    : "Select collections and generate production-ready Firebase SDK code with types, CRUD, and listeners."}
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

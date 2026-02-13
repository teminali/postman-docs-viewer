"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  FileDown,
  ChevronRight,
  ChevronLeft,
  Folder,
  FolderOpen,
  Table2,
  ShieldCheck,
  ListTree,
  FileJson,
  CloudUpload,
  Globe,
  Layers,
  Hash,
  RefreshCw,
  MoreVertical,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Cloud,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isExternalDbConnected } from "@/lib/external-db-settings";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/contexts/auth-context";
import { FirestoreCollectionDetail } from "@/components/firestore-collection-detail";
import {
  schemaToMarkdown,
  indexesToMarkdown,
  rulesToMarkdown,
} from "@/lib/firestore-schema-export";
import { downloadMarkdown, slug } from "@/lib/markdown-export";
import type {
  FirestoreSchema,
  FirestoreCollectionSchema,
} from "@/types/firestore-schema";

interface FirestoreSchemaViewerProps {
  schema: FirestoreSchema;
  onReset: () => void;
  onPublish?: () => void;
  onRescan?: () => void;
  onEditConnection?: () => void;
  onOpenPublishedDocs?: () => void;
  onOpenFlowchart?: () => void;
  onOpenAssistant?: () => void;
}

type ViewTarget =
  | { type: "overview" }
  | { type: "collection"; collection: FirestoreCollectionSchema }
  | { type: "indexes" }
  | { type: "rules" };

export function FirestoreSchemaViewer({
  schema,
  onReset,
  onPublish,
  onRescan,
  onEditConnection,
  onOpenPublishedDocs,
  onOpenFlowchart,
  onOpenAssistant,
}: FirestoreSchemaViewerProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [viewTarget, setViewTarget] = useState<ViewTarget>({ type: "overview" });
  const [sidebarOpen] = useState(true);

  const handleExportFull = useCallback(() => {
    const md = schemaToMarkdown(schema);
    downloadMarkdown(md, `${slug(schema.projectName)}-db-docs.md`);
  }, [schema]);

  const handleExportIndexes = useCallback(() => {
    const md = indexesToMarkdown(schema.indexes, schema.fieldOverrides);
    downloadMarkdown(md, `${slug(schema.projectName)}-indexes.md`);
  }, [schema]);

  const handleExportRules = useCallback(() => {
    if (!schema.rawRules) return;
    const md = rulesToMarkdown(schema.rawRules);
    downloadMarkdown(md, `${slug(schema.projectName)}-rules.md`);
  }, [schema]);

  const totalFields = useMemo(
    () => schema.collections.reduce((sum, c) => sum + c.fields.length, 0),
    [schema]
  );

  const dbConnected = useMemo(() => isExternalDbConnected(), []);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header — matches Postman viewer 3-zone layout */}
      <header className="flex h-12 items-center gap-2 border-b px-3 shrink-0">
        {/* ── Left zone: back + project name ── */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs px-2" onClick={onReset}>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="hidden sm:flex items-center gap-1.5 min-w-0">
            <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {schema.projectName}
            </span>
          </div>
        </div>

        {/* ── Center zone: spacer ── */}
        <div className="flex-1" />

        {/* ── Right zone: actions ── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          {/* ── Assistant button ── */}
          {onOpenAssistant && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs px-2.5"
                  onClick={onOpenAssistant}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Assistant</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Generate prompts & code</TooltipContent>
            </Tooltip>
          )}

          {/* ── Actions menu ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className="w-56">
                {/* Schema actions */}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Schema</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportFull}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                {onRescan && (
                  <DropdownMenuItem onClick={onRescan}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-scan database
                  </DropdownMenuItem>
                )}
                {onPublish && (
                  <DropdownMenuItem onClick={onPublish}>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Publish docs
                  </DropdownMenuItem>
                )}
                {onOpenPublishedDocs && (
                  <DropdownMenuItem onClick={onOpenPublishedDocs}>
                    <Cloud className="h-4 w-4 mr-2" />
                    Browse published docs
                  </DropdownMenuItem>
                )}

                {/* Database */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Database</DropdownMenuLabel>
                {onEditConnection && (
                  <DropdownMenuItem onClick={onEditConnection}>
                    <Database className="h-4 w-4 mr-2" />
                    {dbConnected ? "Edit connection" : "Connect database"}
                  </DropdownMenuItem>
                )}

                {/* Tools */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Tools</DropdownMenuLabel>
                {onOpenFlowchart && (
                  <DropdownMenuItem onClick={onOpenFlowchart}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Flowchart
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>

          {/* ── User menu / Sign in ── */}
          {!authLoading && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Account">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col">
                          {user.displayName && (
                            <span className="font-medium text-sm">{user.displayName}</span>
                          )}
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/docs">
                          <Cloud className="h-4 w-4 mr-2" />
                          My published docs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
                </DropdownMenu>
              ) : (
                <Button variant="default" size="sm" className="h-7 text-xs px-3" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — matches Postman sidebar */}
        {sidebarOpen && (
          <aside className="hidden md:flex w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
              <span className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
                Collections
              </span>
              <span className="text-xs text-muted-foreground">
                {schema.collections.length}
              </span>
            </div>
            <ScrollArea className="h-full">
              <div className="space-y-0.5 p-2">
                {/* Overview */}
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left",
                    viewTarget.type === "overview" && "bg-muted font-medium"
                  )}
                  onClick={() => setViewTarget({ type: "overview" })}
                >
                  <FileJson className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">Overview</span>
                </button>

                {/* Collections */}
                {schema.collections.map((col) => (
                  <CollectionTreeItem
                    key={col.path}
                    collection={col}
                    selectedPath={
                      viewTarget.type === "collection"
                        ? viewTarget.collection.path
                        : null
                    }
                    onSelect={(c) =>
                      setViewTarget({ type: "collection", collection: c })
                    }
                    depth={0}
                  />
                ))}

                {/* Indexes */}
                {schema.indexes.length > 0 && (
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left",
                      viewTarget.type === "indexes" && "bg-muted font-medium"
                    )}
                    onClick={() => setViewTarget({ type: "indexes" })}
                  >
                    <ListTree className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">Indexes</span>
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
                    >
                      {schema.indexes.length}
                    </Badge>
                  </button>
                )}

                {/* Rules */}
                {schema.rawRules && (
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left",
                      viewTarget.type === "rules" && "bg-muted font-medium"
                    )}
                    onClick={() => setViewTarget({ type: "rules" })}
                  >
                    <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">Security Rules</span>
                  </button>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Content */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="p-6 md:p-8 min-w-0">
            {viewTarget.type === "overview" && (
              <OverviewView
                schema={schema}
                totalFields={totalFields}
                onSelectCollection={(c) =>
                  setViewTarget({ type: "collection", collection: c })
                }
                onExportFull={handleExportFull}
                onExportIndexes={handleExportIndexes}
                onExportRules={handleExportRules}
              />
            )}
            {viewTarget.type === "collection" && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs -ml-2"
                  onClick={() => setViewTarget({ type: "overview" })}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to overview
                </Button>
                <FirestoreCollectionDetail
                  collection={viewTarget.collection}
                  schema={schema}
                  onSelectSubcollection={(sub) =>
                    setViewTarget({ type: "collection", collection: sub })
                  }
                  showExplorer={dbConnected}
                />
              </div>
            )}
            {viewTarget.type === "indexes" && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs -ml-2"
                  onClick={() => setViewTarget({ type: "overview" })}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to overview
                </Button>
                <IndexesView schema={schema} onExport={handleExportIndexes} />
              </div>
            )}
            {viewTarget.type === "rules" && schema.rawRules && (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs -ml-2"
                  onClick={() => setViewTarget({ type: "overview" })}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to overview
                </Button>
                <RulesView rawRules={schema.rawRules} onExport={handleExportRules} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Sidebar tree item — matches SidebarNav FolderItem pattern ──────

function CollectionTreeItem({
  collection: col,
  selectedPath,
  onSelect,
  depth,
}: {
  collection: FirestoreCollectionSchema;
  selectedPath: string | null;
  onSelect: (c: FirestoreCollectionSchema) => void;
  depth: number;
}) {
  const isSelected = selectedPath === col.path;
  const hasChildren = col.subcollections.length > 0;
  const [open, setOpen] = useState(depth === 0);

  return (
    <div>
      <button
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left",
          isSelected && "bg-muted font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          onSelect(col);
          if (hasChildren) setOpen(!open);
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-90"
            )}
          />
        )}
        {hasChildren ? (
          open ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate">{col.name}</span>
        <Badge
          variant="secondary"
          className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
        >
          {col.fields.length}
        </Badge>
      </button>
      {open &&
        col.subcollections.map((sub) => (
          <CollectionTreeItem
            key={sub.path}
            collection={sub}
            selectedPath={selectedPath}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

// ─── Overview — matches CollectionOverview pattern ───────────────────

function OverviewView({
  schema,
  totalFields,
  onSelectCollection,
  onExportFull,
  onExportIndexes,
  onExportRules,
}: {
  schema: FirestoreSchema;
  totalFields: number;
  onSelectCollection: (c: FirestoreCollectionSchema) => void;
  onExportFull: () => void;
  onExportIndexes: () => void;
  onExportRules: () => void;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header — same pattern as CollectionOverview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            Database Documentation
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {schema.projectName}
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Scanned {new Date(schema.scannedAt).toLocaleString()}
        </p>
      </div>

      <Separator />

      {/* Stats — same grid + card pattern as Postman stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schema.collections.length}</p>
                <p className="text-xs text-muted-foreground">Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Table2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalFields}</p>
                <p className="text-xs text-muted-foreground">Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{schema.indexes.length}</p>
                <p className="text-xs text-muted-foreground">Indexes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {schema.rawRules ? "Yes" : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export buttons — styled like methods overview card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Export Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={onExportFull}>
              <FileDown className="h-3.5 w-3.5" />
              Full database .md
            </Button>
            {schema.indexes.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2" onClick={onExportIndexes}>
                <FileDown className="h-3.5 w-3.5" />
                Indexes .md
              </Button>
            )}
            {schema.rawRules && (
              <Button variant="outline" size="sm" className="gap-2" onClick={onExportRules}>
                <FileDown className="h-3.5 w-3.5" />
                Rules .md
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collections — styled like Postman FolderSection cards */}
      {schema.collections.map((col) => (
        <Card key={col.path} className="scroll-mt-20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 w-full">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                {col.name}
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  — {col.fields.length} fields, {col.sampleDocCount} docs sampled
                </span>
              </CardTitle>
            </div>
          </CardHeader>
          <div className="p-6 pt-0">
            <div className="space-y-1">
              {col.fields.slice(0, 8).map((field) => (
                <button
                  key={field.name}
                  onClick={() => onSelectCollection(col)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left group"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      field.frequency === field.sampleSize
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    )}
                  />
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono font-bold px-1.5 py-0 min-w-[60px] text-center justify-center shrink-0"
                  >
                    {field.type}
                  </Badge>
                  <span className="font-medium group-hover:underline">
                    {field.name}
                  </span>
                  <span className="text-xs text-muted-foreground hidden md:block">
                    {field.frequency === field.sampleSize ? "required" : "optional"}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    View →
                  </span>
                </button>
              ))}
              {col.fields.length > 8 && (
                <button
                  onClick={() => onSelectCollection(col)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                >
                  <span className="text-xs">
                    + {col.fields.length - 8} more fields
                  </span>
                </button>
              )}
              {col.fields.length === 0 && (
                <button
                  onClick={() => onSelectCollection(col)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
                >
                  No documents sampled — click to view details
                </button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Indexes view ───────────────────────────────────────────────────

function IndexesView({
  schema,
  onExport,
}: {
  schema: FirestoreSchema;
  onExport: () => void;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ListTree className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            Index Configuration
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Composite Indexes
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          {schema.indexes.length} index{schema.indexes.length !== 1 ? "es" : ""} configured
        </p>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <FileDown className="h-3.5 w-3.5" />
          Export .md
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium text-xs">Collection</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Scope</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Fields</th>
                </tr>
              </thead>
              <tbody>
                {schema.indexes.map((idx, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">
                      {idx.collectionGroup}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px]">
                        {idx.queryScope}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1.5">
                        {idx.fields.map((f, j) => (
                          <Badge
                            key={j}
                            variant="secondary"
                            className="text-[11px] font-mono"
                          >
                            {f.fieldPath}{" "}
                            <span className="text-muted-foreground ml-1">
                              {f.order ?? f.arrayConfig ?? ""}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Rules view ─────────────────────────────────────────────────────

function RulesView({
  rawRules,
  onExport,
}: {
  rawRules: string;
  onExport: () => void;
}) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            Access Control
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Security Rules
        </h1>
      </div>

      <Separator />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <FileDown className="h-3.5 w-3.5" />
          Export .md
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <pre className="p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {rawRules.trim()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

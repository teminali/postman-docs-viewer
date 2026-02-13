"use client";

import {
  Database,
  FileDown,
  ChevronRight,
  ShieldCheck,
  ListTree,
  Table2,
  Globe,
  Layers,
  Hash,
  Terminal,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  FirestoreCollectionSchema,
  FirestoreFieldSchema,
  FirestoreSchema,
} from "@/types/firestore-schema";
import {
  collectionToSchemaMarkdown,
} from "@/lib/firestore-schema-export";
import { downloadMarkdown, slug } from "@/lib/markdown-export";
import { FirestoreDataExplorer } from "@/components/firestore-data-explorer";
import { FirestoreCodeSnippets } from "@/components/firestore-code-snippets";

interface FirestoreCollectionDetailProps {
  collection: FirestoreCollectionSchema;
  schema: FirestoreSchema;
  onSelectSubcollection?: (sub: FirestoreCollectionSchema) => void;
  /** Show the interactive Data Explorer tab (requires external DB connection). */
  showExplorer?: boolean;
}

export function FirestoreCollectionDetail({
  collection: col,
  schema,
  onSelectSubcollection,
  showExplorer = false,
}: FirestoreCollectionDetailProps) {
  const colIndexes = schema.indexes.filter(
    (idx) => idx.collectionGroup === col.name
  );

  const requiredCount = col.fields.filter(
    (f) => f.sampleSize > 0 && f.frequency === f.sampleSize
  ).length;

  const handleExport = () => {
    const md = collectionToSchemaMarkdown(col, schema);
    downloadMarkdown(md, `${slug(col.name)}-schema.md`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <Badge variant="outline" className="text-xs">
            Collection
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{col.name}</h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Path: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{col.path}</code>
        </p>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Table2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{col.fields.length}</p>
                <p className="text-xs text-muted-foreground">Fields</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{col.sampleDocCount}</p>
                <p className="text-xs text-muted-foreground">Docs Sampled</p>
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
                <p className="text-2xl font-bold">{requiredCount}</p>
                <p className="text-xs text-muted-foreground">Required</p>
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
                <p className="text-2xl font-bold">{col.subcollections.length}</p>
                <p className="text-xs text-muted-foreground">Subcollections</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Tabbed sections ═══ */}
      <Tabs defaultValue="schema" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="schema" className="gap-1.5 text-xs">
            <Table2 className="h-3.5 w-3.5" />
            Schema
          </TabsTrigger>
          {showExplorer && (
            <TabsTrigger value="explorer" className="gap-1.5 text-xs">
              <Terminal className="h-3.5 w-3.5" />
              Data Explorer
            </TabsTrigger>
          )}
          <TabsTrigger value="snippets" className="gap-1.5 text-xs">
            <Code2 className="h-3.5 w-3.5" />
            Code Snippets
          </TabsTrigger>
        </TabsList>

        {/* ─── Schema tab ─── */}
        <TabsContent value="schema" className="mt-6">
          <div className="space-y-6">
            {/* Export */}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                <FileDown className="h-3.5 w-3.5" />
                Export .md
              </Button>
            </div>

            {/* Fields table */}
            {col.fields.length > 0 ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Table2 className="h-4 w-4 text-muted-foreground" />
                    Fields
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-lg border-0 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-xs">Field</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Required</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Frequency</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Sample</th>
                        </tr>
                      </thead>
                      <tbody>
                        {col.fields.map((field) => (
                          <FieldRow key={field.name} field={field} depth={0} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground text-sm">
                  No documents found in this collection, or the collection is empty.
                </CardContent>
              </Card>
            )}

            {/* Subcollections */}
            {col.subcollections.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ListTree className="h-4 w-4 text-muted-foreground" />
                    Subcollections
                  </CardTitle>
                </CardHeader>
                <div className="p-6 pt-0">
                  <div className="space-y-1">
                    {col.subcollections.map((sub) => (
                      <button
                        key={sub.path}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left group"
                        onClick={() => onSelectSubcollection?.(sub)}
                      >
                        <Database className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium group-hover:underline">
                          {sub.name}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground truncate hidden md:block">
                          {sub.path}
                        </span>
                        <div className="ml-auto flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px]">
                            {sub.fields.length} fields
                          </Badge>
                          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            View →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Indexes */}
            {colIndexes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ListTree className="h-4 w-4 text-muted-foreground" />
                    Indexes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="rounded-lg border-0 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-xs">Scope</th>
                          <th className="px-3 py-2 text-left font-medium text-xs">Fields</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colIndexes.map((idx, i) => (
                          <tr key={i} className="border-b last:border-0">
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
            )}

            {/* Security Rules */}
            {col.rules && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    Security Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-md bg-muted p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {col.rules}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Data Explorer tab ─── */}
        {showExplorer && (
          <TabsContent value="explorer" className="mt-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Data Explorer</h2>
                <p className="text-sm text-muted-foreground">
                  Interact with live data in <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{col.path}</code>. Browse, query, create, update, and delete documents.
                </p>
              </div>
              <FirestoreDataExplorer collection={col} />
            </div>
          </TabsContent>
        )}

        {/* ─── Code Snippets tab ─── */}
        <TabsContent value="snippets" className="mt-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Code Snippets</h2>
              <p className="text-sm text-muted-foreground">
                Ready-to-use code for <strong>{col.name}</strong> — generated from your schema for 7 platforms.
              </p>
            </div>
            <FirestoreCodeSnippets collection={col} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Field row ──────────────────────────────────────────────────────

function FieldRow({
  field,
  depth,
  parentName,
}: {
  field: FirestoreFieldSchema;
  depth: number;
  parentName?: string;
}) {
  const displayName = parentName ? `${parentName}.${field.name}` : field.name;
  const isRequired =
    field.sampleSize > 0 && field.frequency === field.sampleSize;
  const freqPct =
    field.sampleSize > 0
      ? Math.round((field.frequency / field.sampleSize) * 100)
      : 0;

  const sample = field.sampleValues?.[0];
  const sampleStr =
    sample === null || sample === undefined ? "—" : String(sample);
  const truncatedSample =
    sampleStr.length > 50 ? sampleStr.slice(0, 50) + "..." : sampleStr;

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/50">
        <td className="px-3 py-2">
          <code
            className="font-mono text-xs"
            style={{ paddingLeft: depth * 16 }}
          >
            {depth > 0 && (
              <span className="text-muted-foreground mr-1">↳</span>
            )}
            {field.name}
          </code>
        </td>
        <td className="px-3 py-2">
          <Badge
            variant="outline"
            className="text-[10px] font-mono"
          >
            {field.type}
          </Badge>
        </td>
        <td className="px-3 py-2">
          {isRequired ? (
            <Badge className="text-[10px] bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30">
              Required
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Optional
            </Badge>
          )}
        </td>
        <td className="px-3 py-2 text-xs text-muted-foreground">
          {field.frequency}/{field.sampleSize} ({freqPct}%)
        </td>
        <td className="px-3 py-2">
          <code className="text-[11px] text-muted-foreground font-mono">
            {truncatedSample}
          </code>
        </td>
      </tr>
      {field.nestedFields?.map((nf) => (
        <FieldRow
          key={`${displayName}.${nf.name}`}
          field={nf}
          depth={depth + 1}
          parentName={displayName}
        />
      ))}
    </>
  );
}

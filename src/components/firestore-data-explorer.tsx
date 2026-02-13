"use client";

import { useState, useCallback } from "react";
import {
  List,
  Search,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Hash,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  listDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  countDocuments,
  SUPPORTED_OPERATORS,
  type ExplorerDocument,
  type QueryFilter,
} from "@/lib/firestore-data-explorer";
import type { FirestoreCollectionSchema } from "@/types/firestore-schema";

interface FirestoreDataExplorerProps {
  collection: FirestoreCollectionSchema;
}

export function FirestoreDataExplorer({
  collection: col,
}: FirestoreDataExplorerProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="browse" className="gap-1.5 text-xs">
            <List className="h-3.5 w-3.5" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="get" className="gap-1.5 text-xs">
            <Search className="h-3.5 w-3.5" />
            Get by ID
          </TabsTrigger>
          <TabsTrigger value="query" className="gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5" />
            Query
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Create
          </TabsTrigger>
          <TabsTrigger value="update" className="gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" />
            Update
          </TabsTrigger>
          <TabsTrigger value="delete" className="gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </TabsTrigger>
          <TabsTrigger value="count" className="gap-1.5 text-xs">
            <Hash className="h-3.5 w-3.5" />
            Count
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <BrowseTab collectionPath={col.path} fields={col.fields} />
        </TabsContent>
        <TabsContent value="get">
          <GetByIdTab collectionPath={col.path} />
        </TabsContent>
        <TabsContent value="query">
          <QueryTab collectionPath={col.path} fields={col.fields} />
        </TabsContent>
        <TabsContent value="create">
          <CreateTab collectionPath={col.path} fields={col.fields} />
        </TabsContent>
        <TabsContent value="update">
          <UpdateTab collectionPath={col.path} />
        </TabsContent>
        <TabsContent value="delete">
          <DeleteTab collectionPath={col.path} />
        </TabsContent>
        <TabsContent value="count">
          <CountTab collectionPath={col.path} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Browse tab ─────────────────────────────────────────────────────

function BrowseTab({
  collectionPath,
  fields,
}: {
  collectionPath: string;
  fields: FirestoreCollectionSchema["fields"];
}) {
  const [docs, setDocs] = useState<ExplorerDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitCount, setLimitCount] = useState(5);
  const [orderByField, setOrderByField] = useState("");
  const [fetched, setFetched] = useState(false);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listDocuments(collectionPath, {
        limitCount,
        orderByField: orderByField.trim() || undefined,
        direction: "desc",
      });
      setDocs(result);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [collectionPath, limitCount, orderByField]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <List className="h-4 w-4 text-muted-foreground" />
          Browse Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Limit</Label>
            <div className="flex gap-1">
              {[5, 10, 20].map((n) => (
                <Button
                  key={n}
                  variant={limitCount === n ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs px-3"
                  onClick={() => setLimitCount(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[150px]">
            <Label className="text-xs">Order by (optional)</Label>
            <Input
              value={orderByField}
              onChange={(e) => setOrderByField(e.target.value)}
              placeholder={fields[0]?.name ?? "createdAt"}
              className="h-8 text-xs font-mono"
            />
          </div>
          <Button onClick={handleFetch} disabled={loading} size="sm" className="h-8 gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <List className="h-3.5 w-3.5" />}
            Fetch
          </Button>
        </div>

        <ErrorDisplay error={error} />

        {fetched && docs.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents found.</p>
        )}

        {docs.length > 0 && <DocumentList docs={docs} />}
      </CardContent>
    </Card>
  );
}

// ─── Get by ID tab ──────────────────────────────────────────────────

function GetByIdTab({ collectionPath }: { collectionPath: string }) {
  const [docId, setDocId] = useState("");
  const [result, setResult] = useState<ExplorerDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!docId.trim()) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);
    try {
      const doc = await getDocumentById(collectionPath, docId.trim());
      if (!doc) {
        setNotFound(true);
      } else {
        setResult(doc);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [collectionPath, docId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          Get Document by ID
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={docId}
            onChange={(e) => setDocId(e.target.value)}
            placeholder="Enter document ID..."
            className="font-mono text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          />
          <Button onClick={handleFetch} disabled={loading || !docId.trim()} size="sm" className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Get
          </Button>
        </div>

        <ErrorDisplay error={error} />

        {notFound && (
          <p className="text-sm text-muted-foreground text-center py-4">Document not found.</p>
        )}

        {result && <DocumentList docs={[result]} />}
      </CardContent>
    </Card>
  );
}

// ─── Query tab ──────────────────────────────────────────────────────

function QueryTab({
  collectionPath,
  fields,
}: {
  collectionPath: string;
  fields: FirestoreCollectionSchema["fields"];
}) {
  const [field, setField] = useState(fields[0]?.name ?? "");
  const [operator, setOperator] = useState<string>("==");
  const [value, setValue] = useState("");
  const [docs, setDocs] = useState<ExplorerDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleQuery = useCallback(async () => {
    if (!field.trim() || !value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await queryDocuments(
        collectionPath,
        { field: field.trim(), operator: operator as QueryFilter["operator"], value: value.trim() },
        10
      );
      setDocs(result);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }, [collectionPath, field, operator, value]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Query Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1.5 flex-1 min-w-[120px]">
            <Label className="text-xs">Field</Label>
            <Input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="field name"
              className="h-8 text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5 min-w-[150px]">
            <Label className="text-xs">Operator</Label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="h-8 rounded-md border bg-background px-2 text-xs w-full"
            >
              {SUPPORTED_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 flex-1 min-w-[120px]">
            <Label className="text-xs">Value</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="value"
              className="h-8 text-xs font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
          </div>
          <Button onClick={handleQuery} disabled={loading || !field.trim()} size="sm" className="h-8 gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
            Run
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Values are auto-parsed: numbers, booleans (true/false), null, or strings.
        </p>

        <ErrorDisplay error={error} />

        {fetched && docs.length === 0 && !error && (
          <p className="text-sm text-muted-foreground text-center py-4">No documents matched.</p>
        )}

        {docs.length > 0 && <DocumentList docs={docs} />}
      </CardContent>
    </Card>
  );
}

// ─── Create tab ─────────────────────────────────────────────────────

function CreateTab({
  collectionPath,
  fields,
}: {
  collectionPath: string;
  fields: FirestoreCollectionSchema["fields"];
}) {
  const template = fields.length > 0
    ? JSON.stringify(
        Object.fromEntries(
          fields.slice(0, 10).map((f) => [f.name, getDefaultForType(f.type)])
        ),
        null,
        2
      )
    : '{\n  "key": "value"\n}';

  const [jsonInput, setJsonInput] = useState(template);
  const [customId, setCustomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const handleCreate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCreatedId(null);
    try {
      const data = JSON.parse(jsonInput);
      const id = await createDocument(collectionPath, data, customId.trim() || undefined);
      setCreatedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create document");
    } finally {
      setLoading(false);
    }
  }, [collectionPath, jsonInput, customId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          Create Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Document ID (optional — leave blank for auto-generated)</Label>
          <Input
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            placeholder="Auto-generated if empty"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Document data (JSON)</Label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} disabled={loading} size="sm" className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create
          </Button>
        </div>

        <ErrorDisplay error={error} />

        {createdId && (
          <SuccessMessage message={`Document created with ID: ${createdId}`} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Update tab ─────────────────────────────────────────────────────

function UpdateTab({ collectionPath }: { collectionPath: string }) {
  const [docId, setDocId] = useState("");
  const [jsonInput, setJsonInput] = useState('{\n  "field": "new value"\n}');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLoadExisting = useCallback(async () => {
    if (!docId.trim()) return;
    setFetching(true);
    setError(null);
    try {
      const doc = await getDocumentById(collectionPath, docId.trim());
      if (doc) {
        setJsonInput(JSON.stringify(doc.data, null, 2));
      } else {
        setError("Document not found");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setFetching(false);
    }
  }, [collectionPath, docId]);

  const handleUpdate = useCallback(async () => {
    if (!docId.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = JSON.parse(jsonInput);
      await updateDocument(collectionPath, docId.trim(), data);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }, [collectionPath, docId, jsonInput]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Pencil className="h-4 w-4 text-muted-foreground" />
          Update Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Document ID</Label>
          <div className="flex gap-2">
            <Input
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder="Enter document ID..."
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={handleLoadExisting}
              disabled={fetching || !docId.trim()}
            >
              {fetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Load
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Load an existing document to edit, or type the ID and data manually.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Fields to update (JSON — merged into existing doc)</Label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full rounded-md border bg-muted p-3 font-mono text-xs leading-relaxed min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            spellCheck={false}
          />
        </div>

        <Button onClick={handleUpdate} disabled={loading || !docId.trim()} size="sm" className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
          Update
        </Button>

        <ErrorDisplay error={error} />
        {success && <SuccessMessage message="Document updated successfully." />}
      </CardContent>
    </Card>
  );
}

// ─── Delete tab ─────────────────────────────────────────────────────

function DeleteTab({ collectionPath }: { collectionPath: string }) {
  const [docId, setDocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!docId.trim()) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await deleteDocument(collectionPath, docId.trim());
      setSuccess(true);
      setConfirming(false);
      setDocId("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }, [collectionPath, docId, confirming]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          Delete Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Document ID</Label>
          <Input
            value={docId}
            onChange={(e) => {
              setDocId(e.target.value);
              setConfirming(false);
            }}
            placeholder="Enter document ID to delete..."
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDelete}
            disabled={loading || !docId.trim()}
            variant={confirming ? "destructive" : "outline"}
            size="sm"
            className="gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {confirming ? "Confirm delete" : "Delete"}
          </Button>
          {confirming && (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          )}
        </div>

        {confirming && !loading && (
          <p className="text-xs text-destructive">
            This will permanently delete the document. Click &quot;Confirm delete&quot; to proceed.
          </p>
        )}

        <ErrorDisplay error={error} />
        {success && <SuccessMessage message="Document deleted successfully." />}
      </CardContent>
    </Card>
  );
}

// ─── Count tab ──────────────────────────────────────────────────────

function CountTab({ collectionPath }: { collectionPath: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCount = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await countDocuments(collectionPath);
      setCount(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to count");
    } finally {
      setLoading(false);
    }
  }, [collectionPath]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Hash className="h-4 w-4 text-muted-foreground" />
          Count Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleCount} disabled={loading} size="sm" className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Hash className="h-3.5 w-3.5" />}
          Count
        </Button>

        <ErrorDisplay error={error} />

        {count !== null && !error && (
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-3xl font-bold">{count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              documents in <code className="font-mono">{collectionPath}</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Shared components ──────────────────────────────────────────────

function DocumentList({ docs }: { docs: ExplorerDocument[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
      </div>
      {docs.map((doc) => (
        <DocumentCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}

function DocumentCard({ doc }: { doc: ExplorerDocument }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const jsonStr = JSON.stringify(doc.data, null, 2);
  const preview = JSON.stringify(doc.data);
  const isLong = preview.length > 120;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonStr]);

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <button
          className="flex items-center gap-1.5 text-xs font-mono font-medium hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {doc.id}
        </button>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[10px]">
          {Object.keys(doc.data).length} fields
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCopy}
          title="Copy JSON"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      {expanded ? (
        <pre className="p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
          {jsonStr}
        </pre>
      ) : (
        <div className="px-3 py-2">
          <code className="text-[11px] font-mono text-muted-foreground">
            {isLong ? preview.slice(0, 120) + "..." : preview}
          </code>
        </div>
      )}
    </div>
  );
}

function ErrorDisplay({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-start gap-2">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      {error}
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
      <Check className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function getDefaultForType(type: string): unknown {
  switch (type) {
    case "string": return "";
    case "number": return 0;
    case "boolean": return false;
    case "timestamp": return new Date().toISOString();
    case "array": return [];
    case "map": return {};
    case "null": return null;
    default: return "";
  }
}

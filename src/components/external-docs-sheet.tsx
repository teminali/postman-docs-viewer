"use client";

import { useState, useEffect, useCallback } from "react";
import {
  listExternalDocs,
  getExternalDoc,
  deleteExternalDoc,
  type ExternalDocMeta,
} from "@/lib/external-db-docs";
import { isExternalDbConnected } from "@/lib/external-db-settings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Database,
  Loader2,
  Search,
  FileJson,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Trash2,
  Settings2,
} from "lucide-react";

interface ExternalDocsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCollection: (json: unknown, fileName: string) => void;
  onOpenConnectDb?: () => void;
}

export function ExternalDocsSheet({
  open,
  onOpenChange,
  onLoadCollection,
  onOpenConnectDb,
}: ExternalDocsSheetProps) {
  const [docs, setDocs] = useState<ExternalDocMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isConnected = isExternalDbConnected();

  const fetchDocs = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    setError(null);
    try {
      const result = await listExternalDocs(100);
      setDocs(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load docs");
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setError(null);
      fetchDocs();
    }
  }, [open, fetchDocs]);

  const handleLoadDoc = useCallback(
    async (docMeta: ExternalDocMeta) => {
      setLoadingDocId(docMeta.id);
      setError(null);
      try {
        const fullDoc = await getExternalDoc(docMeta.id);
        if (!fullDoc || !fullDoc.collectionJson) {
          setError("Could not load this doc. It may have been deleted.");
          return;
        }
        const json = JSON.parse(fullDoc.collectionJson);
        onLoadCollection(json, `${docMeta.name}.json`);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load document");
      } finally {
        setLoadingDocId(null);
      }
    },
    [onLoadCollection, onOpenChange]
  );

  const handleDeleteDoc = useCallback(
    async (docMeta: ExternalDocMeta, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`Delete "${docMeta.name}" from your database?`)) return;
      setDeletingDocId(docMeta.id);
      try {
        await deleteExternalDoc(docMeta.id);
        setDocs((prev) => prev.filter((d) => d.id !== docMeta.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setDeletingDocId(null);
      }
    },
    []
  );

  const filteredDocs = searchQuery.trim()
    ? docs.filter((d) => {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
        );
      })
    : docs;

  const DocCard = ({ doc }: { doc: ExternalDocMeta }) => {
    const isLoading = loadingDocId === doc.id;
    const isDeleting = deletingDocId === doc.id;
    return (
      <Card
        className="group cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => !isLoading && !isDeleting && handleLoadDoc(doc)}
      >
        <CardContent className="flex items-start gap-3 p-3">
          <div className="rounded-md bg-muted p-2 shrink-0 mt-0.5">
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <span className="text-sm font-medium truncate block">{doc.name}</span>
            {doc.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {doc.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{doc.endpointCount} endpoints</span>
              <span>{doc.folderCount} folders</span>
            </div>
          </div>
          <div className="shrink-0 self-center flex items-center gap-1">
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDeleteDoc(doc, e)}
                aria-label={`Delete ${doc.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Your database
            </SheetTitle>
            {isConnected && onOpenConnectDb && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground gap-1.5"
                onClick={onOpenConnectDb}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          </div>
          <SheetDescription>
            Browse and load API docs from your connected database into the
            viewer.
          </SheetDescription>
        </SheetHeader>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">No database connected</p>
            <p className="text-xs text-muted-foreground max-w-xs mb-4">
              Connect your Firestore database to browse and load your API docs.
            </p>
            {onOpenConnectDb && (
              <Button variant="outline" size="sm" onClick={onOpenConnectDb}>
                <Database className="h-4 w-4 mr-1.5" />
                Connect database
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 px-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search docs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {filteredDocs.length} doc{filteredDocs.length !== 1 ? "s" : ""}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={fetchDocs}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>

                <ScrollArea className="flex-1 min-h-0 max-h-[calc(100vh-320px)]">
                  {filteredDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Database className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery
                          ? "No matching docs found."
                          : "No docs in your database yet. Publish a collection to get started."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pr-3">
                      {filteredDocs.map((doc) => (
                        <DocCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

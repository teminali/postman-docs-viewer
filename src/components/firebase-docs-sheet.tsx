"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getFirestoreDb } from "@/lib/firebase";
import {
  listMyPublishedDocs,
  listPublicPublishedDocs,
  getPublishedDoc,
  type PublishedDocMeta,
} from "@/lib/published-docs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Cloud,
  Globe,
  Lock,
  Loader2,
  Search,
  FileJson,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface FirebaseDocsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadCollection: (json: unknown, fileName: string) => void;
}

export function FirebaseDocsSheet({
  open,
  onOpenChange,
  onLoadCollection,
}: FirebaseDocsSheetProps) {
  const { user } = useAuth();
  const isConfigured = !!getFirestoreDb();

  const [myDocs, setMyDocs] = useState<PublishedDocMeta[]>([]);
  const [publicDocs, setPublicDocs] = useState<PublishedDocMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocs = useCallback(async () => {
    if (!isConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const [my, pub] = await Promise.all([
        user ? listMyPublishedDocs(user.uid) : [],
        listPublicPublishedDocs(50),
      ]);
      setMyDocs(my);
      setPublicDocs(pub);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load docs");
    } finally {
      setLoading(false);
    }
  }, [isConfigured, user]);

  useEffect(() => {
    if (open) {
      setSearchQuery("");
      fetchDocs();
    }
  }, [open, fetchDocs]);

  const handleLoadDoc = useCallback(
    async (doc: PublishedDocMeta) => {
      setLoadingDocId(doc.id);
      setError(null);
      try {
        const fullDoc = await getPublishedDoc(doc.id, user?.uid ?? null);
        if (!fullDoc || !fullDoc.collectionJson) {
          setError("Could not load this doc. It may have been deleted or you don't have access.");
          return;
        }
        const json = JSON.parse(fullDoc.collectionJson);
        onLoadCollection(json, `${doc.name}.json`);
        onOpenChange(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load document");
      } finally {
        setLoadingDocId(null);
      }
    },
    [user, onLoadCollection, onOpenChange]
  );

  const filterDocs = (docs: PublishedDocMeta[]) => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.ownerEmail && d.ownerEmail.toLowerCase().includes(q))
    );
  };

  const filteredMyDocs = filterDocs(myDocs);
  const filteredPublicDocs = filterDocs(
    // Exclude user's own docs from the public list to avoid duplicates
    publicDocs.filter((d) => !user || d.ownerId !== user.uid)
  );

  const DocCard = ({ doc }: { doc: PublishedDocMeta }) => {
    const isLoading = loadingDocId === doc.id;
    return (
      <Card
        className="group cursor-pointer transition-colors hover:bg-accent/50"
        onClick={() => !isLoading && handleLoadDoc(doc)}
      >
        <CardContent className="flex items-start gap-3 p-3">
          <div className="rounded-md bg-muted p-2 shrink-0 mt-0.5">
            <FileJson className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{doc.name}</span>
              <Badge variant="outline" className="text-[10px] shrink-0 h-5">
                {doc.visibility === "public" ? (
                  <><Globe className="h-2.5 w-2.5" /> Public</>
                ) : (
                  <><Lock className="h-2.5 w-2.5" /> Private</>
                )}
              </Badge>
            </div>
            {doc.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{doc.endpointCount} endpoints</span>
              <span>{doc.folderCount} folders</span>
              {doc.ownerEmail && <span className="truncate">{doc.ownerEmail}</span>}
            </div>
          </div>
          <div className="shrink-0 self-center">
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

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Cloud className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Published docs
          </SheetTitle>
          <SheetDescription>
            Browse and load published API docs into the full viewer with AI, flowcharts, and export.
          </SheetDescription>
        </SheetHeader>

        {!isConfigured ? (
          <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium mb-1">Not configured</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Add the required environment variables to .env.local to browse published docs.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 px-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search docs by name, description, or author..."
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
              <Tabs defaultValue={user ? "mine" : "public"} className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center gap-2">
                  <TabsList className="h-8">
                    {user && (
                      <TabsTrigger value="mine" className="text-xs h-7 px-3">
                        My Docs
                        {myDocs.length > 0 && (
                          <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1.5">
                            {myDocs.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="public" className="text-xs h-7 px-3">
                      Public
                      {filteredPublicDocs.length > 0 && (
                        <Badge variant="secondary" className="ml-1.5 h-4 text-[10px] px-1.5">
                          {filteredPublicDocs.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto"
                    onClick={fetchDocs}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>

                {user && (
                  <TabsContent value="mine" className="flex-1 min-h-0 mt-3">
                    <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                      {filteredMyDocs.length === 0 ? (
                        <EmptyState
                          message={
                            searchQuery
                              ? "No matching docs found."
                              : "You haven't published any docs yet. Open a collection and use the publish button."
                          }
                        />
                      ) : (
                        <div className="space-y-2 pr-3">
                          {filteredMyDocs.map((doc) => (
                            <DocCard key={doc.id} doc={doc} />
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                )}

                <TabsContent value="public" className="flex-1 min-h-0 mt-3">
                  <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
                    {filteredPublicDocs.length === 0 ? (
                      <EmptyState
                        message={
                          searchQuery
                            ? "No matching public docs found."
                            : "No public docs available yet."
                        }
                      />
                    ) : (
                      <div className="space-y-2 pr-3">
                        {filteredPublicDocs.map((doc) => (
                          <DocCard key={doc.id} doc={doc} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

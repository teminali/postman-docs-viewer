"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getPublishedDoc, updatePublishedDocContent } from "@/lib/published-docs";
import { setStoredCurrent, addToHistory } from "@/lib/collection-storage";
import { parsePostmanCollection, type ParsedCollection } from "@/lib/postman-parser";
import type { ParsedEndpoint, ViewMode, FolderNode, PostmanCollection } from "@/types/postman";
import type { FirestoreSchema } from "@/types/firestore-schema";
import { CollectionOverview } from "@/components/collection-overview";
import { DevView } from "@/components/dev-view";
import { UserView } from "@/components/user-view";
import { SidebarNav } from "@/components/sidebar-nav";
import { SearchCommand } from "@/components/search-command";
import { FirestoreSchemaViewer } from "@/components/firestore-schema-viewer";
import { FirestoreAssistantSheet } from "@/components/firestore-assistant-sheet";
import { FirestoreSchemaUpload } from "@/components/firestore-schema-upload";
import { schemaToMarkdown } from "@/lib/firestore-schema-export";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileJson,
  Loader2,
  ChevronLeft,
  Code2,
  BookOpen,
  FileDown,
  Maximize2,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  collectionToMarkdown,
  endpointToMarkdown,
  folderToMarkdown,
  downloadMarkdown,
  slug,
} from "@/lib/markdown-export";

function ViewPublishedDocContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const id = useMemo(() => searchParams.get("id"), [searchParams]);

  const router = useRouter();
  const [collection, setCollection] = useState<ParsedCollection | null>(null);
  const [rawCollectionJson, setRawCollectionJson] = useState<string | null>(null);
  const [firestoreSchema, setFirestoreSchema] = useState<FirestoreSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [mode, setMode] = useState<ViewMode>("dev");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateMode, setUpdateMode] = useState<"rescan" | null>(null);
  const [firestoreAssistantOpen, setFirestoreAssistantOpen] = useState(false);

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const isOwner = !!user && !!ownerId && user.uid === ownerId;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid doc ID");
      return;
    }
    let cancelled = false;
    getPublishedDoc(id, user?.uid ?? null)
      .then((doc) => {
        if (cancelled) return;
        if (!doc || !doc.collectionJson) {
          setError(
            !user
              ? "sign-in-required"
              : "Doc not found or you don't have access."
          );
          return;
        }

        setOwnerId(doc.ownerId);

        try {
          const payload = JSON.parse(doc.collectionJson);

          // Detect Firestore schema docs
          if (payload && payload.type === "firestore-schema" && payload.schema) {
            setFirestoreSchema(payload.schema as FirestoreSchema);
            return;
          }

          // Otherwise treat as Postman collection
          const parsed = parsePostmanCollection(payload);
          setCollection(parsed);
          setRawCollectionJson(doc.collectionJson);
        } catch {
          setError("Invalid collection data.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load doc.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user?.uid]);

  const handleSelectEndpoint = useCallback((ep: ParsedEndpoint) => {
    setSelectedEndpoint(ep);
  }, []);

  const handleBack = useCallback(() => setSelectedEndpoint(null), []);

  const handleExportEndpoint = useCallback(
    (ep: ParsedEndpoint) => {
      const md = endpointToMarkdown(ep, mode);
      downloadMarkdown(md, `${slug(ep.name)}-endpoint.md`);
    },
    [mode]
  );

  const handleExportFolder = useCallback(
    (folder: FolderNode) => {
      const md = folderToMarkdown(folder, mode);
      const baseName = folder.path.length > 0 ? folder.path.join("-") : folder.name;
      downloadMarkdown(md, `${slug(baseName)}-folder.md`);
    },
    [mode]
  );

  const handleExportUserGuidePdf = useCallback(() => {
    if (!collection) return;
    import("@/lib/user-guide-export").then(({ exportUserGuidePdf }) => exportUserGuidePdf(collection));
  }, [collection]);

  const handleExportUserGuideDocx = useCallback(() => {
    if (!collection) return;
    import("@/lib/user-guide-export").then(({ exportUserGuideDocx }) => exportUserGuideDocx(collection));
  }, [collection]);

  const handleExportUserGuideMd = useCallback(() => {
    if (!collection) return;
    import("@/lib/user-guide-export").then(({ exportUserGuideMd }) => exportUserGuideMd(collection));
  }, [collection]);

  // ─── Update handlers ────────────────────────────────────────────

  /** Re-upload Postman JSON for a published doc */
  const handleReplacePostmanFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !id || !user) return;
      e.target.value = "";

      setUpdating(true);
      try {
        const text = await file.text();
        const json = JSON.parse(text) as PostmanCollection;
        const parsed = parsePostmanCollection(json);

        await updatePublishedDocContent(id, user.uid, {
          collectionJson: text,
          name: parsed.name,
          endpointCount: parsed.totalRequests,
          folderCount: parsed.totalFolders,
        });

        // Refresh local state
        setCollection(parsed);
        setRawCollectionJson(text);
        setSelectedEndpoint(null);
      } catch (err) {
        console.error("Update failed:", err);
        setError(err instanceof Error ? err.message : "Failed to update");
      } finally {
        setUpdating(false);
      }
    },
    [id, user]
  );

  /** Re-scan Firestore schema and update the published doc */
  const handleUpdateFirestoreSchema = useCallback(
    async (newSchema: FirestoreSchema) => {
      if (!id || !user) return;
      setUpdating(true);
      try {
        const markdown = schemaToMarkdown(newSchema);
        const docPayload = JSON.stringify({
          type: "firestore-schema",
          projectName: newSchema.projectName,
          markdown,
          schema: newSchema,
        });

        await updatePublishedDocContent(id, user.uid, {
          collectionJson: docPayload,
          name: `${newSchema.projectName} — Database Docs`,
          endpointCount: newSchema.collections.length,
          folderCount: newSchema.indexes.length,
        });

        setFirestoreSchema(newSchema);
        setUpdateMode(null);
      } catch (err) {
        console.error("Update failed:", err);
        setError(err instanceof Error ? err.message : "Failed to update");
      } finally {
        setUpdating(false);
      }
    },
    [id, user]
  );

  const flatFolders = useMemo(() => {
    if (!collection) return [];
    const flat: FolderNode[] = [];
    const traverse = (nodes: FolderNode[]) => {
      for (const node of nodes) {
        flat.push(node);
        if (node.children.length) traverse(node.children);
      }
    };
    traverse(collection.folderTree);
    return flat;
  }, [collection]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Firestore schema re-scan mode
  if (updateMode === "rescan" && firestoreSchema) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <FirestoreSchemaUpload
            onSchemaLoaded={handleUpdateFirestoreSchema}
          />
          {updating && (
            <div className="mt-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating published docs...
            </div>
          )}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground text-xs"
              onClick={() => setUpdateMode(null)}
            >
              <ChevronLeft className="h-3 w-3 mr-1" />
              Back to docs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Firestore schema doc — render the schema viewer
  if (firestoreSchema) {
    return (
      <>
        <FirestoreSchemaViewer
          schema={firestoreSchema}
          onReset={() => router.push("/docs")}
          onPublish={
            isOwner
              ? () => setUpdateMode("rescan")
              : undefined
          }
          onOpenAssistant={() => setFirestoreAssistantOpen(true)}
        />
        <FirestoreAssistantSheet
          open={firestoreAssistantOpen}
          onOpenChange={setFirestoreAssistantOpen}
          schema={firestoreSchema}
        />
      </>
    );
  }

  if (error || !collection) {
    const needsSignIn = error === "sign-in-required";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        {needsSignIn ? (
          <>
            <Lock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-lg font-semibold mb-1">Sign in to view this doc</p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
              This is a private doc. Create an account or sign in to access it.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/login?redirect=/docs/view?id=${id}`}>Sign in</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/signup?redirect=/docs/view?id=${id}`}>Create account</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-destructive mb-4">{error ?? "Not found"}</p>
            <Button variant="outline" asChild>
              <Link href="/docs">Back to published docs</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 items-center gap-3 border-b px-4 shrink-0">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/docs">
            <ChevronLeft className="h-3.5 w-3.5" />
            Docs
          </Link>
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <FileJson className="h-4 w-4 shrink-0" />
          <span className="text-sm font-semibold truncate">{collection.name}</span>
        </div>
        <div className="flex-1 flex justify-center px-4">
          <SearchCommand
            endpoints={collection.endpoints}
            folders={flatFolders}
            onSelect={(item) => {
              if ("method" in item) {
                handleSelectEndpoint(item as ParsedEndpoint);
              } else {
                setSelectedEndpoint(null);
                setTimeout(() => {
                  const suffix = item.path.length > 0 ? item.path.join("-") : item.name;
                  const id = `folder-${suffix}`;
                  const el = document.getElementById(id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }, 100);
              }
            }}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={mode === "dev" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs px-3"
            onClick={() => setMode("dev")}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dev</span>
          </Button>
          <Button
            variant={mode === "user" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1.5 text-xs px-3"
            onClick={() => setMode("user")}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">User</span>
          </Button>
        </div>

        {/* Update — re-upload JSON (owner only) */}
        {isOwner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => replaceInputRef.current?.click()}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Update — re-upload JSON
            </TooltipContent>
          </Tooltip>
        )}
        <input
          ref={replaceInputRef}
          type="file"
          accept=".json"
          onChange={handleReplacePostmanFile}
          className="hidden"
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            const md = collectionToMarkdown(collection, mode);
            downloadMarkdown(md, `${slug(collection.name)}-api-docs.md`);
          }}
          title="Export as Markdown"
        >
          <FileDown className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => {
            if (rawCollectionJson) {
              setStoredCurrent(rawCollectionJson);
              addToHistory(collection.name, rawCollectionJson);
              router.push("/app");
            }
          }}
          disabled={!rawCollectionJson}
          title="Open in full viewer with AI, flowcharts, and more"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Full viewer</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="hidden md:flex w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
              <span className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
                Endpoints
              </span>
              <span className="text-xs text-muted-foreground">{collection.totalRequests}</span>
            </div>
            <SidebarNav
              folderTree={collection.folderTree}
              selectedEndpoint={selectedEndpoint}
              onSelectEndpoint={handleSelectEndpoint}
              allEndpoints={collection.endpoints}
            />
          </aside>
        )}
        <ScrollArea className="flex-1 min-w-0">
          <div className="p-6 md:p-8 min-w-0">
            {selectedEndpoint ? (
              <div className="space-y-4">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2" onClick={handleBack}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Back to overview
                </Button>
                {mode === "dev" ? (
                  <DevView
                    endpoint={selectedEndpoint}
                    onExportMd={() => handleExportEndpoint(selectedEndpoint)}
                  />
                ) : (
                  <UserView
                    endpoint={selectedEndpoint}
                    onExportMd={() => handleExportEndpoint(selectedEndpoint)}
                  />
                )}
              </div>
            ) : (
              <CollectionOverview
                collection={collection}
                mode={mode}
                onSelectEndpoint={handleSelectEndpoint}
                onExportFolder={handleExportFolder}
                onExportUserGuidePdf={handleExportUserGuidePdf}
                onExportUserGuideDocx={handleExportUserGuideDocx}
                onExportUserGuideMd={handleExportUserGuideMd}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function ViewPublishedDocPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ViewPublishedDocContent />
    </Suspense>
  );
}

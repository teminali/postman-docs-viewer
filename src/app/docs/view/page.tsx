"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getPublishedDoc } from "@/lib/published-docs";
import { setStoredCurrent, addToHistory } from "@/lib/collection-storage";
import { parsePostmanCollection, type ParsedCollection } from "@/lib/postman-parser";
import type { ParsedEndpoint, ViewMode, FolderNode } from "@/types/postman";
import { CollectionOverview } from "@/components/collection-overview";
import { DevView } from "@/components/dev-view";
import { UserView } from "@/components/user-view";
import { SidebarNav } from "@/components/sidebar-nav";
import { SearchCommand } from "@/components/search-command";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileJson, Loader2, ChevronLeft, Code2, BookOpen, FileDown, Maximize2, Lock } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ParsedEndpoint | null>(null);
  const [mode, setMode] = useState<ViewMode>("dev");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        try {
          const parsed = parsePostmanCollection(JSON.parse(doc.collectionJson));
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

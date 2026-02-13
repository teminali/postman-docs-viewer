"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { SearchCommand } from "@/components/search-command";
import { SidebarNav } from "@/components/sidebar-nav";
import { DevView } from "@/components/dev-view";
import { UserView } from "@/components/user-view";
import { CollectionOverview } from "@/components/collection-overview";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  parsePostmanCollection,
  type ParsedCollection,
} from "@/lib/postman-parser";
import {
  getStoredCurrent,
  setStoredCurrent,
  clearStoredCurrent,
  getHistory,
  addToHistory,
  loadFromHistory,
  type HistoryEntry,
} from "@/lib/collection-storage";
import type { ParsedEndpoint, PostmanCollection, ViewMode } from "@/types/postman";
import type { FolderNode } from "@/types/postman";
import {
  collectionToMarkdown,
  endpointToMarkdown,
  folderToMarkdown,
  downloadMarkdown,
  slug,
} from "@/lib/markdown-export";
import { exportUserGuidePdf, exportUserGuideDocx, exportUserGuideMd } from "@/lib/user-guide-export";
import {
  Code2,
  BookOpen,
  Upload,
  PanelLeftClose,
  PanelLeft,
  ChevronLeft,
  FileJson,
  Menu,
  FileDown,
  Moon,
  Sun,
  History,
  Sparkles,
  GitBranch,
  User,
  LogOut,
  Settings,
  CloudUpload,
  Cloud,
  Database,
  RefreshCw,
  MoreVertical,
  ScanSearch,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";
import { AssistantSheet } from "@/components/assistant-sheet";
import { FirestoreAssistantSheet } from "@/components/firestore-assistant-sheet";
import { FlowchartSheet } from "@/components/flowchart-sheet";
import { PublishSheet } from "@/components/publish-sheet";
import { FirebaseDocsSheet } from "@/components/firebase-docs-sheet";
import { ConnectDbSheet } from "@/components/connect-db-sheet";
// ExternalDocsSheet removed — browse DB replaced by document DB flow
import { isExternalDbConnected } from "@/lib/external-db-settings";
import { FirestoreSchemaUpload } from "@/components/firestore-schema-upload";
import { FirestoreSchemaViewer } from "@/components/firestore-schema-viewer";
import { FirestorePublishSheet } from "@/components/firestore-publish-sheet";
import type { FirestoreSchema } from "@/types/firestore-schema";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [collection, setCollection] = useState<ParsedCollection | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] =
    useState<ParsedEndpoint | null>(null);
  const [mode, setMode] = useState<ViewMode>("dev");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [restored, setRestored] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [firestoreAssistantOpen, setFirestoreAssistantOpen] = useState(false);
  const [flowchartOpen, setFlowchartOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishedDocsOpen, setPublishedDocsOpen] = useState(false);
  const [connectDbOpen, setConnectDbOpen] = useState(false);
  const [externalDbConnected, setExternalDbConnected] = useState(false);
  const [dbDocMode, setDbDocMode] = useState<"upload" | "viewer" | null>(null);
  const [firestoreSchema, setFirestoreSchema] = useState<FirestoreSchema | null>(null);
  const [firestorePublishOpen, setFirestorePublishOpen] = useState(false);

  // Check external DB connection status on mount and when it changes
  useEffect(() => {
    setExternalDbConnected(isExternalDbConnected());
  }, []);

  // Restore current collection from browser storage on mount
  useEffect(() => {
    const raw = getStoredCurrent();
    if (raw) {
      try {
        const json = JSON.parse(raw) as PostmanCollection;
        const parsed = parsePostmanCollection(json);
        setCollection(parsed);
      } catch {
        clearStoredCurrent();
      }
    }
    setRestored(true);
  }, []);

  const handleFileLoaded = useCallback((json: unknown, _fileName: string) => {
    try {
      // Check if this is a Firestore schema document
      const payload = json as Record<string, unknown>;
      if (payload && payload.type === "firestore-schema" && payload.schema) {
        setFirestoreSchema(payload.schema as FirestoreSchema);
        setDbDocMode("viewer");
        return;
      }

      const parsed = parsePostmanCollection(json as PostmanCollection);
      const jsonStr = JSON.stringify(json);
      setStoredCurrent(jsonStr);
      addToHistory(parsed.name, jsonStr);
      setCollection(parsed);
      setSelectedEndpoint(null);
    } catch (err) {
      console.error("Failed to parse collection:", err);
    }
  }, []);

  const handleSelectEndpoint = useCallback((endpoint: ParsedEndpoint) => {
    // Find the matching endpoint from the flattened list
    setSelectedEndpoint(endpoint);
    setMobileSidebarOpen(false);
  }, []);

  const handleReset = useCallback(() => {
    clearStoredCurrent();
    setCollection(null);
    setSelectedEndpoint(null);
  }, []);

  // Hidden file input for replacing the current collection JSON
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const handleReplaceFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          handleFileLoaded(json, file.name);
        } catch {
          console.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [handleFileLoaded]
  );

  const handleLoadFromHistory = useCallback((entry: HistoryEntry) => {
    const raw = loadFromHistory(entry.id);
    if (!raw) return;
    try {
      const json = JSON.parse(raw) as PostmanCollection;
      const parsed = parsePostmanCollection(json);
      setStoredCurrent(raw);
      setCollection(parsed);
      setSelectedEndpoint(null);
    } catch {
      // invalid stored data
    }
  }, []);

  const handleBack = useCallback(() => {
    setSelectedEndpoint(null);
  }, []);

  const handleExportEndpoint = useCallback((endpoint: ParsedEndpoint) => {
    const md = endpointToMarkdown(endpoint, mode);
    downloadMarkdown(md, `${slug(endpoint.name)}-endpoint.md`);
  }, [mode]);

  const handleExportFolder = useCallback((folder: FolderNode) => {
    const md = folderToMarkdown(folder, mode);
    const baseName = folder.path.length > 0 ? folder.path.join("-") : folder.name;
    downloadMarkdown(md, `${slug(baseName)}-folder.md`);
  }, [mode]);

  const handleExportUserGuidePdf = useCallback(() => {
    if (!collection) return;
    exportUserGuidePdf(collection);
  }, [collection]);

  const handleExportUserGuideDocx = useCallback(() => {
    if (!collection) return;
    exportUserGuideDocx(collection);
  }, [collection]);

  const handleExportUserGuideMd = useCallback(() => {
    if (!collection) return;
    exportUserGuideMd(collection);
  }, [collection]);

  const history = restored ? getHistory() : [];

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

  // If viewing Firestore schema documentation
  if (firestoreSchema && dbDocMode === "viewer") {
    return (
      <>
        <FirestoreSchemaViewer
          schema={firestoreSchema}
          onReset={() => {
            setFirestoreSchema(null);
            setDbDocMode(null);
          }}
          onPublish={user ? () => setFirestorePublishOpen(true) : undefined}
          onRescan={() => {
            setFirestoreSchema(null);
            setDbDocMode("upload");
          }}
          onEditConnection={() => setConnectDbOpen(true)}
          onOpenPublishedDocs={() => setPublishedDocsOpen(true)}
          onOpenAssistant={() => setFirestoreAssistantOpen(true)}
        />
        <FirestoreAssistantSheet
          open={firestoreAssistantOpen}
          onOpenChange={setFirestoreAssistantOpen}
          schema={firestoreSchema}
        />
        {user && (
          <FirestorePublishSheet
            open={firestorePublishOpen}
            onOpenChange={setFirestorePublishOpen}
            schema={firestoreSchema}
            userId={user.uid}
            userEmail={user.email}
          />
        )}
        <FirebaseDocsSheet
          open={publishedDocsOpen}
          onOpenChange={setPublishedDocsOpen}
          onLoadCollection={handleFileLoaded}
        />
        <ConnectDbSheet
          open={connectDbOpen}
          onOpenChange={setConnectDbOpen}
          onConnectionChange={() => setExternalDbConnected(isExternalDbConnected())}
        />
      </>
    );
  }

  // If in db-doc upload mode (scanning)
  if (dbDocMode === "upload" && !collection) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <FirestoreSchemaUpload
              onSchemaLoaded={(schema) => {
                setFirestoreSchema(schema);
                setDbDocMode("viewer");
              }}
            />
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={() => setDbDocMode(null)}
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setConnectDbOpen(true)}
              >
                <Database className="h-3 w-3" />
                {externalDbConnected ? "Edit credentials" : "Connect database"}
              </Button>
            </div>
          </div>
        </div>
        <ConnectDbSheet
          open={connectDbOpen}
          onOpenChange={setConnectDbOpen}
          onConnectionChange={() => setExternalDbConnected(isExternalDbConnected())}
        />
      </>
    );
  }

  // If no collection is loaded (and we've checked storage), show the upload screen
  if (!collection) {
    return (
      <>
        <FileUpload
          onFileLoaded={handleFileLoaded}
          history={history}
          onSelectFromHistory={handleLoadFromHistory}
          onOpenPublishedDocs={() => setPublishedDocsOpen(true)}
          onOpenConnectDb={() => setConnectDbOpen(true)}
          onDocumentDb={() => setDbDocMode("upload")}
          isExternalDbConnected={externalDbConnected}
        />
        <FirebaseDocsSheet
          open={publishedDocsOpen}
          onOpenChange={setPublishedDocsOpen}
          onLoadCollection={handleFileLoaded}
        />
        <ConnectDbSheet
          open={connectDbOpen}
          onOpenChange={setConnectDbOpen}
          onConnectionChange={() => setExternalDbConnected(isExternalDbConnected())}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar — clean 3-zone layout: Left (nav) | Center (search) | Right (actions) */}
      <header className="flex h-12 items-center gap-2 border-b px-3 shrink-0">
        {/* ── Left zone: sidebar + collection name ── */}
        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
          {/* Mobile menu */}
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center gap-2 border-b px-4">
                  <FileJson className="h-4 w-4" />
                  <span className="text-sm font-semibold truncate">
                    {collection.name}
                  </span>
                </div>
                <SidebarNav
                  folderTree={collection.folderTree}
                  selectedEndpoint={selectedEndpoint}
                  onSelectEndpoint={handleSelectEndpoint}
                  allEndpoints={collection.endpoints}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Collection name */}
          <div className="hidden sm:flex items-center gap-1.5 min-w-0">
            <FileJson className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {collection.name}
            </span>
          </div>
        </div>

        {/* ── Center zone: search ── */}
        <div className="flex-1 flex justify-center px-2">
          <SearchCommand
            endpoints={collection.endpoints}
            folders={flatFolders}
            onSelect={(item) => {
              if ("method" in item) {
                handleSelectEndpoint(item as ParsedEndpoint);
              } else {
                setSelectedEndpoint(null);
                setMobileSidebarOpen(false);
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

        {/* ── Right zone: mode toggle + compact actions ── */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Mode Toggle */}
          <div className="flex items-center gap-0.5 rounded-md border p-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "dev" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 gap-1 text-[11px] px-2"
                  onClick={() => setMode("dev")}
                >
                  <Code2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Dev</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Developer mode</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "user" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 gap-1 text-[11px] px-2"
                  onClick={() => setMode("user")}
                >
                  <BookOpen className="h-3 w-3" />
                  <span className="hidden sm:inline">User</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">User-friendly mode</TooltipContent>
            </Tooltip>
          </div>

          {/* Theme toggle (icon only) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5" />
                ) : (
                  <Moon className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          {/* ── Assistant button ── */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs px-2.5"
                onClick={() => setAssistantOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Assistant</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Generate prompts & code</TooltipContent>
          </Tooltip>

          {/* ── Actions menu (everything else) ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className="w-56">
                {/* Collection actions */}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Collection</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => {
                  const md = collectionToMarkdown(collection, mode);
                  downloadMarkdown(md, `${slug(collection.name)}-api-docs.md`);
                }}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => replaceInputRef.current?.click()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update collection JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReset}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload new collection
                </DropdownMenuItem>

                {/* Publishing */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Publishing</DropdownMenuLabel>
                {user && (
                  <DropdownMenuItem onClick={() => setPublishOpen(true)}>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Publish docs
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setPublishedDocsOpen(true)}>
                  <Cloud className="h-4 w-4 mr-2" />
                  Browse published docs
                </DropdownMenuItem>

                {/* Database */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Database</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setConnectDbOpen(true)}>
                  <Database className="h-4 w-4 mr-2" />
                  {externalDbConnected ? "Edit connection" : "Connect database"}
                </DropdownMenuItem>
                {externalDbConnected && (
                  <DropdownMenuItem onClick={() => setDbDocMode("upload")}>
                    <ScanSearch className="h-4 w-4 mr-2" />
                    Document database
                  </DropdownMenuItem>
                )}

                {/* Tools */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Tools</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFlowchartOpen(true)}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Flowchart
                </DropdownMenuItem>

                {/* History */}
                {history.length > 0 && history.filter((e) => e.name !== collection.name).length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Recent</DropdownMenuLabel>
                    {history
                      .filter((e) => e.name !== collection.name)
                      .slice(0, 5)
                      .map((entry) => (
                        <DropdownMenuItem
                          key={entry.id}
                          onClick={() => handleLoadFromHistory(entry)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          <span className="truncate">{entry.name}</span>
                        </DropdownMenuItem>
                      ))}
                  </>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Account"
                    >
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
        <input
          ref={replaceInputRef}
          type="file"
          accept=".json"
          onChange={handleReplaceFile}
          className="hidden"
        />
      </header>

      <FirebaseDocsSheet
        open={publishedDocsOpen}
        onOpenChange={setPublishedDocsOpen}
        onLoadCollection={handleFileLoaded}
      />
      {user && (
        <PublishSheet
          open={publishOpen}
          onOpenChange={setPublishOpen}
          collection={collection}
          userId={user.uid}
          userEmail={user.email ?? null}
        />
      )}
      <ConnectDbSheet
        open={connectDbOpen}
        onOpenChange={setConnectDbOpen}
        onConnectionChange={() => setExternalDbConnected(isExternalDbConnected())}
      />
      <AssistantSheet
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        collection={collection}
        selectedEndpoint={selectedEndpoint}
      />
      <FlowchartSheet
        open={flowchartOpen}
        onOpenChange={setFlowchartOpen}
        collection={collection}
        onOpenSettings={() => setFlowchartOpen(false)}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {sidebarOpen && (
          <aside className="hidden md:flex w-72 shrink-0 border-r border-sidebar-border bg-sidebar flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border">
              <span className="text-xs font-medium text-sidebar-foreground uppercase tracking-wider">
                Endpoints
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Neutral
                </span>
                <span className="text-xs text-muted-foreground">
                  {collection.totalRequests}
                </span>
              </div>
            </div>
            <SidebarNav
              folderTree={collection.folderTree}
              selectedEndpoint={selectedEndpoint}
              onSelectEndpoint={handleSelectEndpoint}
              allEndpoints={collection.endpoints}
            />
          </aside>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="p-6 md:p-8 min-w-0">
            {selectedEndpoint ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs -ml-2"
                  onClick={handleBack}
                >
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

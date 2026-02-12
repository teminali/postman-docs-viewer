"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  KeyRound,
  Bot,
  GitBranch,
  User,
  LogOut,
  Settings,
  CloudUpload,
  Cloud,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";
import { AISettingsSheet } from "@/components/ai-settings-sheet";
import { AIAssistantSheet } from "@/components/ai-assistant-sheet";
import { FlowchartSheet } from "@/components/flowchart-sheet";
import { PublishSheet } from "@/components/publish-sheet";
import { FirebaseDocsSheet } from "@/components/firebase-docs-sheet";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiAssistantOpen, setAIAssistantOpen] = useState(false);
  const [flowchartOpen, setFlowchartOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [firebaseDocsOpen, setFirebaseDocsOpen] = useState(false);

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

  // If no collection is loaded (and we've checked storage), show the upload screen
  if (!collection) {
    return (
      <>
        <FileUpload
          onFileLoaded={handleFileLoaded}
          history={history}
          onSelectFromHistory={handleLoadFromHistory}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenFirebaseDocs={() => setFirebaseDocsOpen(true)}
        />
        <AISettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
        <FirebaseDocsSheet
          open={firebaseDocsOpen}
          onOpenChange={setFirebaseDocsOpen}
          onLoadCollection={handleFileLoaded}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex h-14 items-center gap-3 border-b px-4 shrink-0">
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
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {sidebarOpen ? "Close sidebar" : "Open sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* App name */}
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 hidden md:block" />
          <span className="text-sm font-semibold hidden sm:block">
            {collection.name}
          </span>
        </div>

        <div className="flex-1 flex justify-center px-4">
          <SearchCommand
            endpoints={collection.endpoints}
            folders={flatFolders}
            onSelect={(item) => {
              if ("method" in item) {
                // It's an endpoint
                handleSelectEndpoint(item as ParsedEndpoint);
              } else {
                // It's a folder
                setSelectedEndpoint(null);
                setMobileSidebarOpen(false);
                setTimeout(() => {
                  // Find ID to scroll to. CollectionOverview recursively renders folders with IDs:
                  // id={`folder-${folder.path.length > 0 ? folder.path.join("-") : folder.name}`}

                  // For root folder: path is empty. item.name is mostly correct but in FolderNode path is empty array.
                  // For nested folder: path is ["Root", "Sub"]. Join to "Root-Sub".

                  const suffix = item.path.length > 0 ? item.path.join("-") : item.name;
                  const id = `folder-${suffix}`;

                  const el = document.getElementById(id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                  } else {
                    console.warn("Could not find element with id:", id);
                  }
                }, 100);
              }
            }}
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "dev" ? "default" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 text-xs px-3"
                onClick={() => setMode("dev")}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dev</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Developer Mode — Technical API documentation
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mode === "user" ? "default" : "ghost"}
                size="sm"
                className="h-7 gap-1.5 text-xs px-3"
                onClick={() => setMode("user")}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">User</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              User Mode — Plain English user manual
            </TooltipContent>
          </Tooltip>
        </div>

        {/* AI Settings (API key) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSettingsOpen(true)}
              aria-label="AI settings / API key"
            >
              <KeyRound className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            AI settings & API key
          </TooltipContent>
        </Tooltip>

        {/* AI Assistant */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setAIAssistantOpen(true)}
              aria-label="AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            AI Assistant
          </TooltipContent>
        </Tooltip>

        {/* Flowchart */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFlowchartOpen(true)}
              aria-label="Flowchart"
            >
              <GitBranch className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Flowchart
          </TooltipContent>
        </Tooltip>

        {/* Auth: Sign in / User menu (always visible; login page shows setup if Firebase not configured) */}
        {!authLoading && (
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 max-w-[160px]"
                    aria-label="Account menu"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate text-xs">
                      {user.displayName || user.email || "Account"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        {user.displayName && (
                          <span className="font-medium">{user.displayName}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile &amp; Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/docs">
                        <CloudUpload className="h-4 w-4 mr-2" />
                        Published docs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => signOut()}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button variant="default" size="sm" className="h-8 text-xs" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Theme toggle + design badge (Nova / Neutral style) */}
        <div className="flex items-center gap-1.5 rounded-lg border px-2 py-1">
          <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-muted-foreground mr-0.5">
            Theme
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
          <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </div>

        {/* History */}
        {history.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Recent collections"
              >
                <History className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent align="end" className="max-h-[min(60vh,400px)] overflow-y-auto">
                <DropdownMenuLabel>Recent collections</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history
                  .filter((e) => e.name !== collection.name)
                  .map((entry) => (
                    <DropdownMenuItem
                      key={entry.id}
                      onClick={() => handleLoadFromHistory(entry)}
                    >
                      <FileJson className="h-3.5 w-3.5" />
                      {entry.name}
                    </DropdownMenuItem>
                  ))}
                {history.filter((e) => e.name !== collection.name).length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No other recent collections
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        )}

        {/* Browse Firebase Docs */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFirebaseDocsOpen(true)}
              aria-label="Browse Firebase docs"
            >
              <Cloud className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Browse Firebase docs
          </TooltipContent>
        </Tooltip>

        {/* Publish to Firebase (when signed in) */}
        {user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPublishOpen(true)}
                aria-label="Publish to Firebase"
              >
                <CloudUpload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Publish docs to Firebase (public or private)
            </TooltipContent>
          </Tooltip>
        )}

        {/* Export full doc as .md */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                const md = collectionToMarkdown(collection, mode);
                downloadMarkdown(md, `${slug(collection.name)}-api-docs.md`);
              }}
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Export full documentation as .md
          </TooltipContent>
        </Tooltip>

        {/* Upload new */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleReset}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Upload new collection</TooltipContent>
        </Tooltip>
      </header>

      <AISettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
      <FirebaseDocsSheet
        open={firebaseDocsOpen}
        onOpenChange={setFirebaseDocsOpen}
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
      <AIAssistantSheet
        open={aiAssistantOpen}
        onOpenChange={setAIAssistantOpen}
        collection={collection}
        onOpenSettings={() => {
          setAIAssistantOpen(false);
          setSettingsOpen(true);
        }}
      />
      <FlowchartSheet
        open={flowchartOpen}
        onOpenChange={setFlowchartOpen}
        collection={collection}
        onOpenSettings={() => {
          setFlowchartOpen(false);
          setSettingsOpen(true);
        }}
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
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

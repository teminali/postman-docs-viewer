"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";
import { getFirestoreDb } from "@/lib/firebase";
import {
  listMyPublishedDocs,
  listPublicPublishedDocs,
  unpublishDoc,
  type PublishedDocMeta,
} from "@/lib/published-docs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileJson,
  Loader2,
  Globe,
  Lock,
  Trash2,
  ExternalLink,
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  Cloud,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
} from "lucide-react";

export default function DocsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading: authLoading, signOut } = useAuth();
  const [myDocs, setMyDocs] = useState<PublishedDocMeta[]>([]);
  const [publicDocs, setPublicDocs] = useState<PublishedDocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Check configuration after mount to avoid hydration mismatch
  useEffect(() => {
    setIsConfigured(!!getFirestoreDb());
  }, []);

  useEffect(() => {
    if (isConfigured === null) return;
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [my, pub] = await Promise.all([
          user ? listMyPublishedDocs(user.uid) : [],
          listPublicPublishedDocs(30),
        ]);
        if (!cancelled) {
          setMyDocs(my);
          setPublicDocs(pub);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, user?.uid]);

  const handleRefresh = async () => {
    if (!isConfigured) return;
    setLoading(true);
    try {
      const [my, pub] = await Promise.all([
        user ? listMyPublishedDocs(user.uid) : [],
        listPublicPublishedDocs(30),
      ]);
      setMyDocs(my);
      setPublicDocs(pub);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await unpublishDoc(id, user.uid);
      setMyDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

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

  const filteredMyDocs = useMemo(() => filterDocs(myDocs), [myDocs, searchQuery]);
  const filteredPublicDocs = useMemo(
    () => filterDocs(publicDocs.filter((d) => !user || d.ownerId !== user.uid)),
    [publicDocs, user, searchQuery]
  );

  // ── Not configured ──
  if (isConfigured === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto rounded-full bg-muted p-4 w-fit">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Not configured</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Add the required environment variables to .env.local to use published docs.
          </p>
          <Button asChild>
            <Link href="/app">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to app
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (isConfigured === null || authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading docs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header — matches app 3-zone pattern ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-2 px-3 max-w-6xl mx-auto">
          {/* Left */}
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FileJson className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Docs Viewer</span>
          </Link>

          {/* Center */}
          <div className="flex-1" />

          {/* Right */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs px-3 gap-1.5" asChild>
              <Link href="/app">
                <ArrowLeft className="h-3 w-3" />
                Open viewer
              </Link>
            </Button>

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
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-6xl mx-auto py-8 px-4">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">Published</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Published Docs</h1>
            <p className="text-muted-foreground text-sm max-w-md">
              View and manage your published documentation, or explore publicly shared docs.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 self-start sm:self-auto" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={user ? "mine" : "public"}>
          <TabsList className="mb-6">
            {user && (
              <TabsTrigger value="mine" className="gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                My Docs
                {myDocs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">
                    {myDocs.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            <TabsTrigger value="public" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Public
              {filteredPublicDocs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 text-[10px] px-1.5">
                  {filteredPublicDocs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* My Docs */}
          {user && (
            <TabsContent value="mine">
              {filteredMyDocs.length === 0 ? (
                <EmptyState
                  icon={<Cloud className="h-10 w-10 text-muted-foreground/40" />}
                  message={
                    searchQuery
                      ? "No matching docs found."
                      : "You haven\u2019t published any docs yet."
                  }
                  hint={
                    searchQuery
                      ? "Try a different search term."
                      : "Open a collection in the viewer and use the Publish option from the actions menu."
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMyDocs.map((doc) => (
                    <DocCard
                      key={doc.id}
                      doc={doc}
                      isOwner
                      deleting={deletingId === doc.id}
                      onDelete={() => handleDelete(doc.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Public Docs */}
          <TabsContent value="public">
            {filteredPublicDocs.length === 0 ? (
              <EmptyState
                icon={<Globe className="h-10 w-10 text-muted-foreground/40" />}
                message={
                  searchQuery
                    ? "No matching public docs found."
                    : "No public docs available yet."
                }
                hint={
                  searchQuery
                    ? "Try a different search term."
                    : "Publish a collection with visibility set to Public to see it here."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPublicDocs.map((doc) => (
                  <DocCard key={doc.id} doc={doc} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Doc Card ──────────────────────────────────────────────────────────

function DocCard({
  doc,
  isOwner = false,
  deleting = false,
  onDelete,
}: {
  doc: PublishedDocMeta;
  isOwner?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
}) {
  return (
    <Card className="group flex flex-col transition-colors hover:bg-accent/30">
      <CardHeader className="pb-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="rounded-md bg-muted p-1.5 shrink-0">
              <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm truncate">
              <Link
                href={`/docs/view?id=${doc.id}`}
                className="hover:underline"
              >
                {doc.name}
              </Link>
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 h-5 gap-1">
            {doc.visibility === "public" ? (
              <><Globe className="h-2.5 w-2.5" /> Public</>
            ) : (
              <><Lock className="h-2.5 w-2.5" /> Private</>
            )}
          </Badge>
        </div>
        {doc.description && (
          <CardDescription className="line-clamp-2 text-xs mt-1">
            {doc.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
          <span>{doc.endpointCount} endpoints</span>
          <span>{doc.folderCount} folders</span>
          {doc.ownerEmail && !isOwner && (
            <span className="truncate">{doc.ownerEmail}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 flex-1" asChild>
            <Link href={`/docs/view?id=${doc.id}`}>
              <ExternalLink className="h-3 w-3" />
              View docs
            </Link>
          </Button>
          {isOwner && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unpublish this doc?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove &quot;{doc.name}&quot; from published docs. Anyone with the link will no longer be able to access it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Unpublish
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────

function EmptyState({
  icon,
  message,
  hint,
}: {
  icon: React.ReactNode;
  message: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="text-sm font-medium mt-4">{message}</p>
      {hint && (
        <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">{hint}</p>
      )}
    </div>
  );
}

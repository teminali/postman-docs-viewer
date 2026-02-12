"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getFirestoreDb } from "@/lib/firebase";
import { listMyPublishedDocs, listPublicPublishedDocs, unpublishDoc, type PublishedDocMeta } from "@/lib/published-docs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileJson, Loader2, Globe, Lock, Trash2, ExternalLink } from "lucide-react";

export default function DocsPage() {
  const { user, loading: authLoading } = useAuth();
  const [myDocs, setMyDocs] = useState<PublishedDocMeta[]>([]);
  const [publicDocs, setPublicDocs] = useState<PublishedDocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isConfigured = !!getFirestoreDb();

  useEffect(() => {
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

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Firebase not configured</CardTitle>
            <CardDescription>
              Add NEXT_PUBLIC_FIREBASE_* to .env.local to use published docs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app">Back to app</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <FileJson className="h-5 w-5" />
            <span className="font-semibold">Postman Docs Viewer</span>
          </Link>
          <nav className="flex-1" />
          <Button variant="outline" size="sm" asChild>
            <Link href="/app">Open viewer</Link>
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Published docs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Docs published to Firebase. View or manage your own; explore public ones.
          </p>
        </div>

        {user && (
          <section className="mb-10">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              My published docs
            </h2>
            {myDocs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  You haven’t published any docs yet. Open a collection in the viewer and use &quot;Publish to Firebase&quot; (cloud icon).
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myDocs.map((doc) => (
                  <Card key={doc.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base truncate">
                          <Link href={`/docs/view?id=${doc.id}`} className="hover:underline">
                            {doc.name}
                          </Link>
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          aria-label="Unpublish"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {doc.description || `${doc.endpointCount} endpoints · ${doc.folderCount} folders`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto flex items-center gap-2 pt-0">
                      <span className="text-xs text-muted-foreground">
                        {doc.visibility === "public" ? (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Private
                          </span>
                        )}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href={`/docs/view?id=${doc.id}`}>
                          View <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Explore public docs
          </h2>
          {publicDocs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No public docs yet. Publish a collection and set visibility to Public to see it here.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {publicDocs.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      <Link href={`/docs/view?id=${doc.id}`} className="hover:underline">
                        {doc.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {doc.description || `${doc.endpointCount} endpoints · ${doc.folderCount} folders`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-2">
                      by {doc.ownerEmail || "Unknown"}
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                      <Link href={`/docs/view?id=${doc.id}`}>
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

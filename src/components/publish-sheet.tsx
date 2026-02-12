"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Globe, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { getStoredCurrent } from "@/lib/collection-storage";
import { publishDoc, type PublishVisibility } from "@/lib/published-docs";
import type { ParsedCollection } from "@/lib/postman-parser";

interface PublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: ParsedCollection;
  userId: string;
  userEmail: string | null;
}

export function PublishSheet({
  open,
  onOpenChange,
  collection,
  userId,
  userEmail,
}: PublishSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<PublishVisibility>("private");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(collection.name);
      setDescription("");
      setVisibility("private");
      setError(null);
      setPublishedId(null);
    }
  }, [open, collection.name]);

  const handlePublish = async () => {
    const raw = getStoredCurrent();
    if (!raw) {
      setError("No collection data to publish. Upload or load a collection first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const id = await publishDoc(userId, userEmail, {
        name: name.trim() || collection.name,
        description: description.trim(),
        visibility,
        collectionJson: raw,
        endpointCount: collection.totalRequests,
        folderCount: collection.totalFolders,
      });
      setPublishedId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setBusy(false);
    }
  };

  const handleView = () => {
    onOpenChange(false);
    if (publishedId) router.push(`/docs/view?id=${publishedId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish to Firebase
          </SheetTitle>
          <SheetDescription>
            Save this API documentation to Firestore. Choose public (open to everyone) or private (requires sign-in to view).
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-6">
          {publishedId ? (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">Published</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your doc is saved. Share the link or view it now.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleView} size="sm">
                  View doc
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs">My published docs</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="publish-name">Name</Label>
                <Input
                  id="publish-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="API documentation name"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publish-desc">Description (optional)</Label>
                <Input
                  id="publish-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={visibility === "private" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setVisibility("private")}
                    disabled={busy}
                  >
                    <Lock className="h-4 w-4" />
                    Private
                  </Button>
                  <Button
                    type="button"
                    variant={visibility === "public" ? "default" : "outline"}
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => setVisibility("public")}
                    disabled={busy}
                  >
                    <Globe className="h-4 w-4" />
                    Public
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {visibility === "private"
                    ? "Anyone with the link can view this doc after signing in."
                    : "Anyone with the link can view this doc — no sign-in required."}
                </p>
              </div>
            </>
          )}
        </div>

        {!publishedId && (
          <SheetFooter className="px-4">
            <Button onClick={handlePublish} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

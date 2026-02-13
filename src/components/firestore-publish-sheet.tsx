"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Loader2, Globe, Lock, CheckCircle, Cloud, Database } from "lucide-react";
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
import { publishDoc, type PublishVisibility } from "@/lib/published-docs";
import { publishToExternalDb } from "@/lib/external-db-docs";
import { isExternalDbConnected } from "@/lib/external-db-settings";
import { schemaToMarkdown } from "@/lib/firestore-schema-export";
import type { FirestoreSchema } from "@/types/firestore-schema";

type PublishTarget = "platform" | "external";

interface FirestorePublishSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: FirestoreSchema;
  userId: string;
  userEmail: string | null;
}

export function FirestorePublishSheet({
  open,
  onOpenChange,
  schema,
  userId,
  userEmail,
}: FirestorePublishSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<PublishVisibility>("private");
  const [target, setTarget] = useState<PublishTarget>("platform");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [externalConnected, setExternalConnected] = useState(false);

  useEffect(() => {
    if (open) {
      setName(`${schema.projectName} — Database Docs`);
      setDescription(
        `${schema.collections.length} collections, ${schema.indexes.length} indexes`
      );
      setVisibility("private");
      setError(null);
      setPublishedId(null);
      setExternalConnected(isExternalDbConnected());
      setTarget("platform");
    }
  }, [open, schema]);

  const handlePublish = async () => {
    setBusy(true);
    setError(null);
    try {
      // Generate the full markdown from the schema
      const markdown = schemaToMarkdown(schema);

      // Wrap the markdown in a JSON envelope that looks like a doc payload
      // so it can be displayed in the published docs viewer
      const docPayload = JSON.stringify({
        type: "firestore-schema",
        projectName: schema.projectName,
        markdown,
        schema,
      });

      if (target === "external") {
        await publishToExternalDb({
          name: name.trim() || `${schema.projectName} DB Docs`,
          description: description.trim(),
          collectionJson: docPayload,
          endpointCount: schema.collections.length,
          folderCount: schema.indexes.length,
        });
        setPublishedId("external");
      } else {
        const id = await publishDoc(userId, userEmail, {
          name: name.trim() || `${schema.projectName} DB Docs`,
          description: description.trim(),
          visibility,
          collectionJson: docPayload,
          endpointCount: schema.collections.length,
          folderCount: schema.indexes.length,
        });
        setPublishedId(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setBusy(false);
    }
  };

  const handleView = () => {
    onOpenChange(false);
    if (publishedId && publishedId !== "external") {
      router.push(`/docs/view?id=${publishedId}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Publish database docs
          </SheetTitle>
          <SheetDescription>
            {target === "external"
              ? "Save your database documentation to your connected database."
              : "Publish your database documentation to the cloud. Choose public or private visibility."}
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
                {publishedId === "external"
                  ? "Your database docs are saved to your database."
                  : "Your database docs are published. Share the link or view them now."}
              </p>
              {publishedId !== "external" && (
                <div className="flex gap-2">
                  <Button onClick={handleView} size="sm">
                    View docs
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/docs">My published docs</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Publish target toggle */}
              {externalConnected && (
                <div className="space-y-2">
                  <Label>Publish to</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={target === "platform" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setTarget("platform")}
                      disabled={busy}
                    >
                      <Cloud className="h-4 w-4" />
                      Platform
                    </Button>
                    <Button
                      type="button"
                      variant={target === "external" ? "default" : "outline"}
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => setTarget("external")}
                      disabled={busy}
                    >
                      <Database className="h-4 w-4" />
                      My database
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="publish-name">Name</Label>
                <Input
                  id="publish-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Database documentation name"
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

              {/* Summary */}
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <p className="font-medium">What will be published:</p>
                <ul className="text-muted-foreground text-xs space-y-0.5 ml-4 list-disc">
                  <li>{schema.collections.length} collection{schema.collections.length !== 1 ? "s" : ""} with field schemas</li>
                  {schema.indexes.length > 0 && (
                    <li>{schema.indexes.length} composite index{schema.indexes.length !== 1 ? "es" : ""}</li>
                  )}
                  {schema.rawRules && <li>Security rules</li>}
                  <li>Full markdown documentation</li>
                </ul>
              </div>

              {/* Visibility — only for platform publishing */}
              {target === "platform" && (
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
                      ? "Anyone with the link can view after signing in."
                      : "Anyone with the link can view — no sign-in required."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {!publishedId && (
          <SheetFooter className="px-4">
            <Button onClick={handlePublish} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : target === "external" ? (
                "Publish to my database"
              ) : (
                "Publish"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

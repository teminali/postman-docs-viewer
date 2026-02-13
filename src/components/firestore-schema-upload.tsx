"use client";

import { useState, useCallback } from "react";
import {
  Database,
  FileJson,
  FileText,
  Loader2,
  CheckCircle,
  Plus,
  X,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  introspectFirestore,
  type IntrospectProgress,
} from "@/lib/firestore-introspector";
import type { FirestoreSchema } from "@/types/firestore-schema";

interface FirestoreSchemaUploadProps {
  onSchemaLoaded: (schema: FirestoreSchema) => void;
}

export function FirestoreSchemaUpload({
  onSchemaLoaded,
}: FirestoreSchemaUploadProps) {
  const [indexesJson, setIndexesJson] = useState<unknown>(null);
  const [indexesFileName, setIndexesFileName] = useState<string | null>(null);
  const [rulesText, setRulesText] = useState<string | null>(null);
  const [rulesFileName, setRulesFileName] = useState<string | null>(null);
  const [manualCollections, setManualCollections] = useState<string[]>([""]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<IntrospectProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIndexesFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          setIndexesJson(json);
          setIndexesFileName(file.name);
        } catch {
          setError("Failed to parse indexes JSON file.");
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const handleRulesFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setRulesText(text);
        setRulesFileName(file.name);
      };
      reader.readAsText(file);
    },
    []
  );

  const addManualCollection = () => {
    setManualCollections((prev) => [...prev, ""]);
  };

  const removeManualCollection = (index: number) => {
    setManualCollections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateManualCollection = (index: number, value: string) => {
    setManualCollections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const hasInput =
    indexesJson !== null ||
    rulesText !== null ||
    manualCollections.some((c) => c.trim() !== "");

  const handleScan = async () => {
    if (!hasInput) return;
    setScanning(true);
    setError(null);
    setProgress(null);

    try {
      const schema = await introspectFirestore(
        {
          indexesJson: indexesJson ?? undefined,
          rulesText: rulesText ?? undefined,
          manualCollections: manualCollections.filter((c) => c.trim()),
        },
        (p) => setProgress(p)
      );
      onSchemaLoaded(schema);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          Database Documentation
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          Document your Firestore
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Upload your indexes and/or security rules files, or specify collection
          names manually. We&apos;ll scan your database and generate documentation.
        </p>
      </div>

      {/* File uploads */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Indexes JSON */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileJson className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">firestore.indexes.json</Label>
          </div>
          {indexesFileName ? (
            <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 p-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="truncate text-green-700 dark:text-green-300">
                {indexesFileName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto shrink-0"
                onClick={() => {
                  setIndexesJson(null);
                  setIndexesFileName(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center rounded-md border-2 border-dashed p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <span className="text-xs text-muted-foreground">
                Click to upload
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleIndexesFile}
                className="hidden"
              />
            </label>
          )}
          <p className="text-[11px] text-muted-foreground">
            Export with: <code className="bg-muted px-1 rounded">firebase firestore:indexes &gt; firestore.indexes.json</code>
          </p>
        </Card>

        {/* Rules file */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">firestore.rules</Label>
          </div>
          {rulesFileName ? (
            <div className="flex items-center gap-2 rounded-md bg-green-500/10 border border-green-500/20 p-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="truncate text-green-700 dark:text-green-300">
                {rulesFileName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-auto shrink-0"
                onClick={() => {
                  setRulesText(null);
                  setRulesFileName(null);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center rounded-md border-2 border-dashed p-4 cursor-pointer hover:bg-accent/50 transition-colors">
              <span className="text-xs text-muted-foreground">
                Click to upload
              </span>
              <input
                type="file"
                accept=".rules,.txt"
                onChange={handleRulesFile}
                className="hidden"
              />
            </label>
          )}
          <p className="text-[11px] text-muted-foreground">
            Usually in your project root as <code className="bg-muted px-1 rounded">firestore.rules</code>
          </p>
        </Card>
      </div>

      {/* Manual collection names */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Collection names (optional)
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={addManualCollection}
          >
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Manually specify collections to scan, in case they&apos;re not in your
          indexes or rules files.
        </p>
        <div className="space-y-2">
          {manualCollections.map((col, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={col}
                onChange={(e) => updateManualCollection(i, e.target.value)}
                placeholder="e.g. users, orders, products..."
                className="font-mono text-sm"
              />
              {manualCollections.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => removeManualCollection(i)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Progress */}
      {scanning && progress && (
        <div className="rounded-md bg-muted p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress.phase === "parsing" && "Parsing files..."}
            {progress.phase === "scanning" &&
              `Scanning ${progress.currentCollection} (${progress.current}/${progress.total})...`}
            {progress.phase === "done" && "Done!"}
          </div>
          {progress.total > 0 && (
            <div className="w-full bg-background rounded-full h-1.5">
              <div
                className="bg-foreground h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.round((progress.current / progress.total) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Scan button */}
      <div className="text-center">
        <Button
          size="lg"
          disabled={!hasInput || scanning}
          onClick={handleScan}
          className="gap-2"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="h-4 w-4" />
          )}
          {scanning ? "Scanning..." : "Scan database"}
        </Button>
      </div>
    </div>
  );
}

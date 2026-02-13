"use client";

import { useState, useEffect } from "react";
import { Database, Loader2, CheckCircle, XCircle, Unplug } from "lucide-react";
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
import {
  getExternalDbConfig,
  setExternalDbConfig,
  clearExternalDbConfig,
  validateExternalDbConfig,
  EXTERNAL_DB_STORAGE_NOTICE,
  DEFAULT_COLLECTION_NAME,
  type ExternalDbConfig,
} from "@/lib/external-db-settings";
import { testExternalConnection } from "@/lib/external-db-docs";

interface ConnectDbSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the connection status changes (connected/disconnected). */
  onConnectionChange?: () => void;
}

export function ConnectDbSheet({
  open,
  onOpenChange,
  onConnectionChange,
}: ConnectDbSheetProps) {
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [appId, setAppId] = useState("");
  const [collectionName, setCollectionName] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (open) {
      const config = getExternalDbConfig();
      setIsConnected(!!config);
      if (config) {
        setApiKey(config.apiKey);
        setAuthDomain(config.authDomain ?? "");
        setProjectId(config.projectId);
        setStorageBucket(config.storageBucket ?? "");
        setAppId(config.appId);
        setCollectionName(config.collectionName ?? "");
      } else {
        setApiKey("");
        setAuthDomain("");
        setProjectId("");
        setStorageBucket("");
        setAppId("");
        setCollectionName("");
      }
      setTestResult(null);
      setTestError(null);
    }
  }, [open]);

  const currentConfig: Partial<ExternalDbConfig> = {
    apiKey: apiKey.trim(),
    authDomain: authDomain.trim(),
    projectId: projectId.trim(),
    storageBucket: storageBucket.trim() || undefined,
    appId: appId.trim(),
    collectionName: collectionName.trim() || undefined,
  };

  const isValid = validateExternalDbConfig(currentConfig);

  const handleTestConnection = async () => {
    if (!isValid) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    // Save config so the Firestore instance can be initialized
    setExternalDbConfig(currentConfig as ExternalDbConfig);

    try {
      await testExternalConnection();
      setTestResult("success");
      setIsConnected(true);
      onConnectionChange?.();
    } catch (e) {
      setTestResult("error");
      setTestError(
        e instanceof Error ? e.message : "Could not connect to the database"
      );
      // Revert config since the connection failed
      clearExternalDbConfig();
      setIsConnected(false);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!isValid) return;
    setExternalDbConfig(currentConfig as ExternalDbConfig);
    setIsConnected(true);
    onConnectionChange?.();
    onOpenChange(false);
  };

  const handleDisconnect = () => {
    clearExternalDbConfig();
    setIsConnected(false);
    setApiKey("");
    setAuthDomain("");
    setProjectId("");
    setStorageBucket("");
    setAppId("");
    setCollectionName("");
    setTestResult(null);
    setTestError(null);
    onConnectionChange?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Connect your database
          </SheetTitle>
          <SheetDescription>
            Link your own Firestore database to read and publish API docs
            directly from your project.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 py-2 flex-1 overflow-y-auto min-h-0">
          {/* Connection status */}
          {isConnected && testResult !== "error" && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Connected</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleDisconnect}
              >
                <Unplug className="h-3.5 w-3.5 mr-1" />
                Disconnect
              </Button>
            </div>
          )}

          {/* Config fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ext-apiKey" className="text-xs">
                API Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ext-apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-authDomain" className="text-xs">
                Auth Domain
              </Label>
              <Input
                id="ext-authDomain"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="your-project.firebaseapp.com"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-projectId" className="text-xs">
                Project ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ext-projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="your-project-id"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-storageBucket" className="text-xs">
                Storage Bucket
              </Label>
              <Input
                id="ext-storageBucket"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="your-project.appspot.com"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-appId" className="text-xs">
                App ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ext-appId"
                type="password"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abc123"
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ext-collectionName" className="text-xs">
                Collection name
              </Label>
              <Input
                id="ext-collectionName"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder={DEFAULT_COLLECTION_NAME}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                The Firestore collection that contains your docs. Defaults to <code className="font-mono bg-muted px-1 rounded">{DEFAULT_COLLECTION_NAME}</code>.
              </p>
            </div>
          </div>

          {/* Test result */}
          {testResult === "success" && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Connection successful
            </div>
          )}
          {testResult === "error" && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive flex items-start gap-2">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Connection failed</p>
                {testError && <p className="text-xs mt-0.5 opacity-80">{testError}</p>}
              </div>
            </div>
          )}

          {/* Security notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {EXTERNAL_DB_STORAGE_NOTICE}
            </p>
          </div>

          {/* Firestore rules hint */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-medium mb-1">Firestore rules</p>
            <p className="text-xs text-muted-foreground">
              Make sure your Firestore security rules allow read/write access to
              the <code className="font-mono text-[11px] bg-muted px-1 rounded">{collectionName.trim() || DEFAULT_COLLECTION_NAME}</code> collection.
            </p>
          </div>
        </div>

        <SheetFooter className="px-4 gap-2 border-t pt-4 shrink-0">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isValid || testing}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Database className="h-4 w-4 mr-1.5" />
            )}
            Test connection
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

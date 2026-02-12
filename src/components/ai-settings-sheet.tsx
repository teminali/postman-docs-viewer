"use client";

import { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  getAPIKey,
  setAPIKey,
  AI_STORAGE_NOTICE,
  type AIProvider,
} from "@/lib/ai-settings";

const PROVIDER_LABEL: Record<AIProvider, string> = {
  gemini: "Google Gemini",
};

interface AISettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISettingsSheet({ open, onOpenChange }: AISettingsSheetProps) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey(getAPIKey("gemini") ?? "");
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    setAPIKey("gemini", apiKey || null);
    setSaved(true);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            AI Assistant API Key
          </SheetTitle>
          <SheetDescription>
            Set your API key to use the AI assistant. Currently supported: Google Gemini. More models will be added later.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{PROVIDER_LABEL.gemini}</label>
            <Input
              type="password"
              placeholder="Paste your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Get a key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {AI_STORAGE_NOTICE}
            </p>
          </div>
        </div>

        <SheetFooter className="px-4">
          <Button onClick={handleSave}>
            {saved ? "Saved" : "Save in browser"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

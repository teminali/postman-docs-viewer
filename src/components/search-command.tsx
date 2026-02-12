"use client";

import { useEffect, useState, useMemo } from "react";
import Fuse from "fuse.js";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import type { ParsedEndpoint, FolderNode } from "@/types/postman";
import { getMethodColor } from "@/lib/postman-parser";
import { Folder } from "lucide-react";

interface SearchCommandProps {
  endpoints: ParsedEndpoint[];
  folders: FolderNode[];
  onSelect: (item: ParsedEndpoint | FolderNode) => void;
}

type SearchResult =
  | { type: "endpoint"; item: ParsedEndpoint }
  | { type: "folder"; item: FolderNode };

export function SearchCommand({ endpoints, folders, onSelect }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const searchIndex = useMemo(() => {
    const combined: SearchResult[] = [
      ...endpoints.map((ep) => ({ type: "endpoint" as const, item: ep })),
      ...folders.map((f) => ({ type: "folder" as const, item: f })),
    ];

    return new Fuse(combined, {
      keys: [
        { name: "item.name", weight: 0.4 },
        { name: "item.url", weight: 0.3 }, // only for endpoints
        { name: "item.description", weight: 0.2 },
        { name: "item.method", weight: 0.1 }, // only for endpoints
        { name: "item.folderPath", weight: 0.1 }, // only for endpoints
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  }, [endpoints, folders]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Return mix of recent/important items - for now just some folders and endpoints
      return [
        ...folders.slice(0, 3).map(f => ({ type: "folder" as const, item: f })),
        ...endpoints.slice(0, 10).map(ep => ({ type: "endpoint" as const, item: ep }))
      ];
    }

    return searchIndex.search(query).map((r) => r.item);
  }, [query, endpoints, folders, searchIndex]);

  // Group items
  const grouped = useMemo(() => {
    const groups: {
      folders: FolderNode[];
      endpoints: Record<string, ParsedEndpoint[]>;
    } = {
      folders: [],
      endpoints: {},
    };

    for (const result of results) {
      if (result.type === "folder") {
        groups.folders.push(result.item);
      } else {
        const ep = result.item;
        const folder = ep.folderPath.join(" / ") || "Root";
        if (!groups.endpoints[folder]) groups.endpoints[folder] = [];
        groups.endpoints[folder].push(ep);
      }
    }
    return groups;
  }, [results]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors w-full max-w-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="flex-1 text-left">Search endpoints, folders...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search endpoints, folders, methods..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>No results found.</p>
              <p className="mt-1 text-xs">
                Try searching for a folder name or endpoint path.
              </p>
            </div>
          </CommandEmpty>

          {grouped.folders.length > 0 && (
            <CommandGroup heading="Folders">
              {grouped.folders.map((folder) => (
                <CommandItem
                  key={`folder-${folder.name}-${folder.path.join("-")}`} // Fallback key
                  value={`folder ${folder.name}`}
                  onSelect={() => {
                    onSelect(folder);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Folder className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Folder • {folder.endpoints.length} endpoints
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {Object.entries(grouped.endpoints).map(([folder, eps]) => (
            <CommandGroup key={folder} heading={folder}>
              {eps.map((ep) => (
                <CommandItem
                  key={ep.id}
                  value={`${ep.method} ${ep.name} ${ep.url}`}
                  onSelect={() => {
                    onSelect(ep);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Badge
                    variant="outline"
                    className={`${getMethodColor(ep.method)} text-[10px] font-mono font-bold px-1.5 py-0 min-w-[52px] text-center justify-center`}
                  >
                    {ep.method}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ep.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {ep.url}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

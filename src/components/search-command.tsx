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
import type { ParsedEndpoint } from "@/types/postman";
import { getMethodColor } from "@/lib/postman-parser";

interface SearchCommandProps {
  endpoints: ParsedEndpoint[];
  onSelect: (endpoint: ParsedEndpoint) => void;
}

export function SearchCommand({ endpoints, onSelect }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(endpoints, {
        keys: [
          { name: "name", weight: 0.35 },
          { name: "url", weight: 0.25 },
          { name: "description", weight: 0.2 },
          { name: "method", weight: 0.1 },
          { name: "folderPath", weight: 0.1 },
        ],
        threshold: 0.4,
        includeScore: true,
        minMatchCharLength: 1,
        ignoreLocation: true,
      }),
    [endpoints]
  );

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
    if (!query.trim()) return endpoints.slice(0, 20);

    // Check for method filter
    const methodMatch = query.match(
      /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*/i
    );
    if (methodMatch) {
      const method = methodMatch[1].toUpperCase();
      const rest = query.slice(methodMatch[0].length).trim();
      if (!rest) {
        return endpoints.filter((ep) => ep.method === method);
      }
      return fuse
        .search(rest)
        .filter((r) => r.item.method === method)
        .map((r) => r.item);
    }

    return fuse.search(query).map((r) => r.item);
  }, [query, endpoints, fuse]);

  // Group results by folder
  const grouped = useMemo(() => {
    const groups: Record<string, ParsedEndpoint[]> = {};
    for (const ep of results) {
      const folder = ep.folderPath.join(" / ") || "Root";
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(ep);
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
        <span className="flex-1 text-left">Search endpoints...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by name, URL, method, or description..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="py-6 text-center text-sm text-muted-foreground">
              <p>No endpoints found.</p>
              <p className="mt-1 text-xs">
                Try: &quot;GET /users&quot;, &quot;auth&quot;, or &quot;POST&quot;
              </p>
            </div>
          </CommandEmpty>
          {Object.entries(grouped).map(([folder, eps]) => (
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

"use client";

import { useState } from "react";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { FolderNode, ParsedEndpoint } from "@/types/postman";
import { getMethodDot } from "@/lib/postman-parser";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  folderTree: FolderNode[];
  selectedEndpoint: ParsedEndpoint | null;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  allEndpoints: ParsedEndpoint[];
}

function FolderItem({
  node,
  depth,
  selectedEndpoint,
  onSelectEndpoint,
}: {
  node: FolderNode;
  depth: number;
  selectedEndpoint: ParsedEndpoint | null;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const totalEndpoints =
    node.endpoints.length +
    node.children.reduce(
      (sum, child) =>
        sum + child.endpoints.length,
      0
    );

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors",
          "text-left"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        {isOpen ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-medium">{node.name}</span>
        <Badge
          variant="secondary"
          className="h-5 min-w-5 justify-center px-1.5 text-[10px]"
        >
          {totalEndpoints}
        </Badge>
      </button>

      {isOpen && (
        <div>
          {node.endpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              onClick={() => onSelectEndpoint(endpoint)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors",
                selectedEndpoint?.id === endpoint.id && "bg-muted font-medium"
              )}
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  getMethodDot(endpoint.method)
                )}
              />
              <span className="flex-1 truncate text-left">{endpoint.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {endpoint.method}
              </span>
            </button>
          ))}
          {node.children.map((child) => (
            <FolderItem
              key={child.name}
              node={child}
              depth={depth + 1}
              selectedEndpoint={selectedEndpoint}
              onSelectEndpoint={onSelectEndpoint}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({
  folderTree,
  selectedEndpoint,
  onSelectEndpoint,
}: SidebarNavProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-0.5 p-2">
        {folderTree.map((node) => (
          <FolderItem
            key={node.name}
            node={node}
            depth={0}
            selectedEndpoint={selectedEndpoint}
            onSelectEndpoint={onSelectEndpoint}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

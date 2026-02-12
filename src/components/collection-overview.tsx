"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ParsedCollection } from "@/lib/postman-parser";
import type { ParsedEndpoint, ViewMode } from "@/types/postman";
import { getMethodColor, getMethodDot } from "@/lib/postman-parser";
import type { FolderNode } from "@/types/postman";
import {
  FolderTree,
  Globe,
  Hash,
  Layers,
  BookOpen,
  Code2,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CollectionOverviewProps {
  collection: ParsedCollection;
  mode: ViewMode;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  onExportFolder?: (folder: FolderNode) => void;
}

export function CollectionOverview({
  collection,
  mode,
  onSelectEndpoint,
  onExportFolder,
}: CollectionOverviewProps) {
  const isDevMode = mode === "dev";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {isDevMode ? (
            <Code2 className="h-5 w-5 text-muted-foreground" />
          ) : (
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          )}
          <Badge variant="outline" className="text-xs">
            {isDevMode ? "Developer Reference" : "User Guide"}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {collection.description}
          </p>
        )}
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collection.totalRequests}</p>
                <p className="text-xs text-muted-foreground">
                  {isDevMode ? "Endpoints" : "Available Actions"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collection.totalFolders}</p>
                <p className="text-xs text-muted-foreground">
                  {isDevMode ? "Folders" : "Categories"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Object.keys(collection.methods).length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isDevMode ? "HTTP Methods" : "Action Types"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {collection.variables.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isDevMode ? "Variables" : "Configurations"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methods Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {isDevMode ? "Methods Overview" : "Action Types"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(collection.methods)
              .sort(([, a], [, b]) => b - a)
              .map(([method, count]) => (
                <Badge
                  key={method}
                  variant="outline"
                  className={`${getMethodColor(method)} font-mono text-xs px-3 py-1`}
                >
                  {method}
                  <span className="ml-1.5 opacity-70">{count}</span>
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Endpoints List by Folder */}
      {collection.folderTree.map((folder) => (
        <Card key={folder.path.length ? folder.path.join("/") : folder.name}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-muted-foreground" />
                {folder.name}
                {folder.description && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    — {folder.description}
                  </span>
                )}
              </CardTitle>
              {onExportFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 text-xs gap-1.5"
                  onClick={() => onExportFolder(folder)}
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Export .md
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {folder.endpoints.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onSelectEndpoint(ep)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left group"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      getMethodDot(ep.method)
                    )}
                  />
                  {isDevMode && (
                    <Badge
                      variant="outline"
                      className={`${getMethodColor(ep.method)} text-[10px] font-mono font-bold px-1.5 py-0 min-w-[48px] text-center justify-center shrink-0`}
                    >
                      {ep.method}
                    </Badge>
                  )}
                  <span className="font-medium group-hover:underline">
                    {ep.name}
                  </span>
                  {isDevMode && (
                    <span className="text-xs font-mono text-muted-foreground truncate hidden md:block">
                      {ep.url}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    View →
                  </span>
                </button>
              ))}
              {folder.children.map((child) =>
                child.endpoints.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => onSelectEndpoint(ep)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left group pl-8"
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        getMethodDot(ep.method)
                      )}
                    />
                    {isDevMode && (
                      <Badge
                        variant="outline"
                        className={`${getMethodColor(ep.method)} text-[10px] font-mono font-bold px-1.5 py-0 min-w-[48px] text-center justify-center shrink-0`}
                      >
                        {ep.method}
                      </Badge>
                    )}
                    <span className="font-medium group-hover:underline">
                      {ep.name}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      View →
                    </span>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Variables (Dev Mode only) */}
      {isDevMode && collection.variables.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Collection Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-xs">
                      Variable
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-xs">
                      Value
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-xs">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collection.variables.map((v, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">
                        {`{{${v.key}}}`}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                        {v.value || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {v.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

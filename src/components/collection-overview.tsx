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
  FileText,
  FileType,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderSectionProps {
  folder: FolderNode;
  mode: ViewMode;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  onExportFolder?: (folder: FolderNode) => void;
  level?: number;
}

function FolderSection({
  folder,
  mode,
  onSelectEndpoint,
  onExportFolder,
  level = 0,
}: FolderSectionProps) {
  const isDevMode = mode === "dev";
  const id = `folder-${folder.path.length > 0 ? folder.path.join("-") : folder.name}`;

  // Use Card for top-level, custom div for nested
  const Container = level === 0 ? Card : "div";
  const containerProps = level === 0
    ? { className: "scroll-mt-20", id }
    : { className: cn("scroll-mt-20 mt-6 border-l-2 pl-4", level > 0 && "ml-2"), id };

  const Header = level === 0 ? CardHeader : "div";
  const headerProps = level === 0 ? { className: "pb-3" } : { className: "mb-3 flex items-center justify-between" };

  const Title = level === 0 ? CardTitle : "h3";
  const titleClassName = level === 0
    ? "text-sm font-medium flex items-center gap-2"
    : "text-sm font-semibold flex items-center gap-2";

  return (
    // @ts-ignore
    <Container {...containerProps}>
      {/* @ts-ignore */}
      <Header {...headerProps}>
        <div className="flex items-start justify-between gap-2 w-full">
          <Title className={titleClassName}>
            {level === 0 && <FolderTree className="h-4 w-4 text-muted-foreground" />}
            {folder.name}
            {folder.description && (
              <span className="text-xs text-muted-foreground font-normal ml-2">
                — {folder.description}
              </span>
            )}
          </Title>
          {onExportFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 h-7 text-xs gap-1.5"
              onClick={() => onExportFolder(folder)}
              title="Export as Markdown"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="sr-only">Export Markdown</span>
            </Button>
          )}
        </div>
      </Header>

      <div className={cn(level === 0 && "p-6 pt-0")}>
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
        </div>

        {folder.children.length > 0 && (
          <div className="space-y-6 mt-4">
            {folder.children.map((child) => (
              <FolderSection
                key={child.name}
                folder={child}
                mode={mode}
                onSelectEndpoint={onSelectEndpoint}
                onExportFolder={onExportFolder}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

interface CollectionOverviewProps {
  collection: ParsedCollection;
  mode: ViewMode;
  onSelectEndpoint: (endpoint: ParsedEndpoint) => void;
  onExportFolder?: (folder: FolderNode) => void;
  /** User Guide exports (only shown in user mode) */
  onExportUserGuidePdf?: () => void;
  onExportUserGuideDocx?: () => void;
  onExportUserGuideMd?: () => void;
}

export function CollectionOverview({
  collection,
  mode,
  onSelectEndpoint,
  onExportFolder,
  onExportUserGuidePdf,
  onExportUserGuideDocx,
  onExportUserGuideMd,
}: CollectionOverviewProps) {
  const isDevMode = mode === "dev";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
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
          {!isDevMode && (onExportUserGuidePdf || onExportUserGuideDocx || onExportUserGuideMd) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FileDown className="h-3.5 w-3.5" />
                  Export Guide
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onExportUserGuidePdf && (
                  <DropdownMenuItem onClick={onExportUserGuidePdf}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                )}
                {onExportUserGuideDocx && (
                  <DropdownMenuItem onClick={onExportUserGuideDocx}>
                    <FileType className="h-4 w-4 mr-2" />
                    Export as Word
                  </DropdownMenuItem>
                )}
                {onExportUserGuideMd && (
                  <DropdownMenuItem onClick={onExportUserGuideMd}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as Markdown
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

      {collection.folderTree.map((folder) => (
        <FolderSection
          key={folder.name}
          folder={folder}
          mode={mode}
          onSelectEndpoint={onSelectEndpoint}
          onExportFolder={onExportFolder}
        />
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

/**
 * Build a token-efficient, index-style summary of the collection for the AI.
 * We only include structure and short descriptions—no full bodies, headers, or large payloads—
 * so the model can answer questions without exhausting tokens.
 */

import type { ParsedCollection } from "@/lib/postman-parser";
import type { FolderNode, ParsedEndpoint } from "@/types/postman";

const MAX_DESCRIPTION_LEN = 120;

function truncate(s: string, max: number): string {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max) + "...";
}

function endpointSummary(ep: ParsedEndpoint): Record<string, string> {
  return {
    id: ep.id,
    method: ep.method,
    name: ep.name,
    path: ep.url.split("?")[0],
    description: truncate(ep.description || "", MAX_DESCRIPTION_LEN),
  };
}

function folderToIndex(node: FolderNode, pathPrefix: string[]): Record<string, unknown> {
  const path = [...pathPrefix, node.name];
  const endpointSummaries = node.endpoints.map(endpointSummary);
  const children = node.children.map((c) => folderToIndex(c, path));
  return {
    name: node.name,
    path: path.join(" > "),
    endpointCount: node.endpoints.length,
    endpoints: endpointSummaries,
    children: children.length ? children : undefined,
  };
}

/** Minimal summary: method, name, path only (no id, no description). Saves ~40% context tokens. */
function endpointSummaryMinimal(ep: ParsedEndpoint): Record<string, string> {
  return {
    method: ep.method,
    name: ep.name,
    path: ep.url.split("?")[0],
  };
}

function folderToIndexMinimal(node: FolderNode, pathPrefix: string[]): Record<string, unknown> {
  const path = [...pathPrefix, node.name];
  const children = node.children.map((c) => folderToIndexMinimal(c, path));
  return {
    name: node.name,
    path: path.join(" > "),
    endpointCount: node.endpoints.length,
    endpoints: node.endpoints.map(endpointSummaryMinimal),
    ...(children.length ? { children } : {}),
  };
}

/**
 * Full collection index: name, description, folder tree with endpoint summaries only.
 * No request/response bodies, no headers, no query params—minimal tokens.
 */
export function buildCollectionIndex(collection: ParsedCollection): Record<string, unknown> {
  return {
    name: collection.name,
    description: truncate(collection.description || "", 200),
    totalEndpoints: collection.totalRequests,
    totalFolders: collection.totalFolders,
    methods: collection.methods,
    folders: collection.folderTree.map((n) => folderToIndex(n, [])),
  };
}

/**
 * Minimal index for simple Q&A: same structure as full but endpoints have only method, name, path
 * (no id, no description). Use for simple questions to cut context size ~40–50%.
 */
export function buildMinimalCollectionIndex(collection: ParsedCollection): Record<string, unknown> {
  return {
    name: collection.name,
    totalEndpoints: collection.totalRequests,
    methods: collection.methods,
    folders: collection.folderTree.map((n) => folderToIndexMinimal(n, [])),
  };
}

/**
 * Index scoped to specific folder path keys (e.g. "Auth", "User Management > Profile").
 * Only includes those folders and their full subtrees. Reduces token usage when analyzing a subset.
 */
export function buildScopedIndex(
  collection: ParsedCollection,
  selectedPathKeys: string[]
): Record<string, unknown> {
  const pathSet = new Set(selectedPathKeys);

  function includeSubtree(node: FolderNode, pathPrefix: string[]): Record<string, unknown> | null {
    const path = [...pathPrefix, node.name];
    const pathKey = path.join(" > ");
    const explicitlySelected = pathSet.has(pathKey);
    const children = node.children.map((c) => includeSubtree(c, path)).filter(Boolean) as Record<string, unknown>[];
    const hasSelectedDescendant = children.length > 0;
    if (!explicitlySelected && !hasSelectedDescendant && node.endpoints.length === 0) return null;

    const endpointSummaries = node.endpoints.map(endpointSummary);
    return {
      name: node.name,
      path: pathKey,
      endpointCount: node.endpoints.length,
      endpoints: endpointSummaries,
      ...(children.length ? { children } : {}),
    };
  }

  function collectScopedFolders(nodes: FolderNode[], pathPrefix: string[]): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    for (const n of nodes) {
      const path = [...pathPrefix, n.name];
      const pathKey = path.join(" > ");
      if (pathSet.has(pathKey)) {
        out.push(folderToIndex(n, pathPrefix));
      } else {
        const childResults = collectScopedFolders(n.children, path);
        if (childResults.length > 0) {
          out.push({
            name: n.name,
            path: pathKey,
            endpointCount: n.endpoints.length,
            endpoints: n.endpoints.map(endpointSummary),
            children: childResults,
          });
        }
      }
    }
    return out;
  }

  function countEndpointsInTree(folders: Record<string, unknown>[]): number {
    return folders.reduce((sum, f) => {
      const direct = (f.endpointCount as number) ?? 0;
      const child = Array.isArray(f.children) ? countEndpointsInTree(f.children as Record<string, unknown>[]) : 0;
      return sum + direct + child;
    }, 0);
  }

  const folders = collectScopedFolders(collection.folderTree, []);
  const totalEndpointsInScope = countEndpointsInTree(folders);

  return {
    name: collection.name,
    description: truncate(collection.description || "", 200),
    scope: "selected folders",
    totalEndpointsInScope,
    folders,
  };
}

/** Minimal scoped index: endpoints are method/name/path only, for selected folders. */
export function buildMinimalScopedIndex(
  collection: ParsedCollection,
  selectedPathKeys: string[]
): Record<string, unknown> {
  const pathSet = new Set(selectedPathKeys);
  function collect(nodes: FolderNode[], pathPrefix: string[]): Record<string, unknown>[] {
    const out: Record<string, unknown>[] = [];
    for (const n of nodes) {
      const path = [...pathPrefix, n.name];
      const pathKey = path.join(" > ");
      if (pathSet.has(pathKey)) {
        out.push(folderToIndexMinimal(n, pathPrefix));
      } else {
        const childResults = collect(n.children, path);
        if (childResults.length > 0) {
          out.push({
            name: n.name,
            path: pathKey,
            endpointCount: n.endpoints.length,
            endpoints: n.endpoints.map(endpointSummaryMinimal),
            children: childResults,
          });
        }
      }
    }
    return out;
  }
  function countInTree(folders: Record<string, unknown>[]): number {
    return folders.reduce((sum, f) => {
      const direct = (f.endpointCount as number) ?? 0;
      const child = Array.isArray(f.children) ? countInTree(f.children as Record<string, unknown>[]) : 0;
      return sum + direct + child;
    }, 0);
  }
  const folders = collect(collection.folderTree, []);
  return {
    name: collection.name,
    scope: "selected folders",
    totalEndpointsInScope: countInTree(folders),
    folders,
  };
}

/**
 * Flatten folder tree to a list of { path, pathKey, endpointCount } for scope selector UI.
 */
export function listFoldersForScope(collection: ParsedCollection): { path: string[]; pathKey: string; endpointCount: number }[] {
  const out: { path: string[]; pathKey: string; endpointCount: number }[] = [];

  function countEndpoints(node: FolderNode): number {
    return node.endpoints.length + node.children.reduce((s, c) => s + countEndpoints(c), 0);
  }
  function walk(node: FolderNode, pathPrefix: string[]) {
    const path = [...pathPrefix, node.name];
    const pathKey = path.join(" > ");
    out.push({ path, pathKey, endpointCount: countEndpoints(node) });
    node.children.forEach((c) => walk(c, path));
  }

  collection.folderTree.forEach((n) => walk(n, []));
  return out;
}

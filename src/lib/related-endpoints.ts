/**
 * Find endpoints in other folders that connect to the selected scope (by search + auth heuristics).
 * Used so the AI can surface notes, tips, and implementation order (e.g. "call Auth first").
 */

import type { ParsedCollection } from "@/lib/postman-parser";
import type { ParsedEndpoint } from "@/types/postman";
import { createSearchIndex } from "@/lib/search";

const MAX_RELATED = 28;
const AUTH_FOLDER_REGEX = /auth|login|token|oauth|bearer|session|signin|signout/i;

export interface RelatedEndpoint {
  folderPath: string;
  method: string;
  name: string;
  path: string;
  note?: string;
}

function pathToKey(path: string[]): string {
  return path.join(" > ");
}

/** Extract searchable tokens from endpoint name and URL path (e.g. "user", "group", "api"). */
function extractKeywords(ep: ParsedEndpoint): string[] {
  const tokens = new Set<string>();
  const nameWords = ep.name.replace(/[-_/]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  nameWords.forEach((w) => tokens.add(w.toLowerCase()));
  const pathSegments = ep.url.split("?")[0].split("/").filter((s) => s.length > 2 && !/^{|^\d+$/.test(s));
  pathSegments.forEach((s) => tokens.add(s.toLowerCase().replace(/[{}:]/g, "")));
  return Array.from(tokens);
}

/** True if folder path (any segment) looks like auth-related. */
function isAuthFolder(folderPath: string[]): boolean {
  return folderPath.some((segment) => AUTH_FOLDER_REGEX.test(segment));
}

/**
 * Find endpoints outside the selected scope that are related by:
 * - Auth heuristics: folders named auth/login/token (often needed first)
 * - Fuse search: endpoints matching keywords from in-scope endpoints
 */
export function findRelatedEndpoints(
  collection: ParsedCollection,
  selectedPathKeys: string[] | null
): RelatedEndpoint[] {
  if (!selectedPathKeys?.length) return [];

  const pathSet = new Set(selectedPathKeys);
  const inScopeIds = new Set(
    collection.endpoints
      .filter((ep) => pathSet.has(pathToKey(ep.folderPath)))
      .map((ep) => ep.id)
  );

  const relatedMap = new Map<string, RelatedEndpoint>();

  // 1) Auth-related folders: add all endpoints from auth folders not in scope
  collection.endpoints.forEach((ep) => {
    if (inScopeIds.has(ep.id)) return;
    if (!isAuthFolder(ep.folderPath)) return;
    const key = ep.id;
    if (relatedMap.has(key)) return;
    relatedMap.set(key, {
      folderPath: pathToKey(ep.folderPath),
      method: ep.method,
      name: ep.name,
      path: ep.url.split("?")[0],
      note: "Often required first (auth/token)",
    });
  });

  // 2) Fuse search: keywords from in-scope endpoints → find matches outside scope
  const inScopeEndpoints = collection.endpoints.filter((ep) => inScopeIds.has(ep.id));
  const allKeywords = new Set<string>();
  inScopeEndpoints.forEach((ep) => extractKeywords(ep).forEach((k) => allKeywords.add(k)));
  if (allKeywords.size > 0) {
    const fuse = createSearchIndex(collection.endpoints);
    const searchQuery = Array.from(allKeywords).slice(0, 12).join(" ");
    const results = fuse.search(searchQuery);
    for (const r of results) {
      const ep = r.item;
      if (inScopeIds.has(ep.id)) continue;
      if (relatedMap.size >= MAX_RELATED) break;
      const key = ep.id;
      if (relatedMap.has(key)) continue;
      relatedMap.set(key, {
        folderPath: pathToKey(ep.folderPath),
        method: ep.method,
        name: ep.name,
        path: ep.url.split("?")[0],
      });
    }
  }

  return Array.from(relatedMap.values()).slice(0, MAX_RELATED);
}

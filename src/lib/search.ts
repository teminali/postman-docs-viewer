import Fuse, { type IFuseOptions } from "fuse.js";
import type { ParsedEndpoint } from "@/types/postman";

const fuseOptions: IFuseOptions<ParsedEndpoint> = {
  keys: [
    { name: "name", weight: 0.35 },
    { name: "url", weight: 0.25 },
    { name: "description", weight: 0.2 },
    { name: "method", weight: 0.1 },
    { name: "folderPath", weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
};

export function createSearchIndex(endpoints: ParsedEndpoint[]): Fuse<ParsedEndpoint> {
  return new Fuse(endpoints, fuseOptions);
}

export function searchEndpoints(
  fuse: Fuse<ParsedEndpoint>,
  query: string
): ParsedEndpoint[] {
  if (!query.trim()) return [];

  // Support method filters like "GET /users" or "POST"
  const methodMatch = query.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*/i);

  if (methodMatch) {
    const method = methodMatch[1].toUpperCase();
    const restQuery = query.slice(methodMatch[0].length).trim();

    if (!restQuery) {
      // Just filtering by method
      const results = fuse.search(method);
      return results
        .filter((r) => r.item.method === method)
        .map((r) => r.item);
    }

    // Method + additional search
    const results = fuse.search(restQuery);
    return results
      .filter((r) => r.item.method === method)
      .map((r) => r.item);
  }

  // Support path-based search like "/api/users"
  if (query.startsWith("/")) {
    const results = fuse.search(query);
    return results.map((r) => r.item);
  }

  // Support status code search
  if (/^\d{3}$/.test(query.trim())) {
    const code = parseInt(query.trim());
    const allItems = fuse.getIndex()
    // Fuse doesn't expose items directly, search broadly
    const results = fuse.search({ $or: [{ name: "" }] });
    return results
      .filter((r) =>
        r.item.responses.some((resp) => resp.code === code)
      )
      .map((r) => r.item);
  }

  const results = fuse.search(query);
  return results.map((r) => r.item);
}

export function getSearchSuggestions(endpoints: ParsedEndpoint[]): string[] {
  const suggestions = new Set<string>();

  // Add unique methods
  endpoints.forEach((ep) => suggestions.add(ep.method));

  // Add folder names
  endpoints.forEach((ep) => {
    ep.folderPath.forEach((folder) => suggestions.add(folder));
  });

  // Add endpoint names
  endpoints.forEach((ep) => suggestions.add(ep.name));

  return Array.from(suggestions).slice(0, 20);
}

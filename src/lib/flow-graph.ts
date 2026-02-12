/**
 * Flow graph: nodes and edges keyed by endpoint/folder IDs for flowcharts.
 * Connects collection data so we can generate Mermaid flowcharts (structure or LLM).
 */

import type { ParsedCollection } from "@/lib/postman-parser";
import type { FolderNode, ParsedEndpoint } from "@/types/postman";

export interface FlowNode {
  id: string;
  label: string;
  method?: string;
  folderPath: string[];
  type: "endpoint" | "folder";
}

export interface FlowEdge {
  fromId: string;
  toId: string;
  label?: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

/** Sanitize for Mermaid: node id must be alphanumeric + underscore. */
export function toMermaidId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 30);
}

/** Escape text for Mermaid node label (brackets, quotes). */
function escapeLabel(s: string): string {
  return s.replace(/\[/g, "(").replace(/\]/g, ")").replace(/"/g, "'").slice(0, 40);
}

/** Hex colors for flowchart nodes by HTTP method (fill, stroke, text). */
const METHOD_STYLES: Record<string, { fill: string; stroke: string; color: string }> = {
  GET: { fill: "#059669", stroke: "#047857", color: "#ffffff" },
  POST: { fill: "#d97706", stroke: "#b45309", color: "#ffffff" },
  PUT: { fill: "#2563eb", stroke: "#1d4ed8", color: "#ffffff" },
  PATCH: { fill: "#7c3aed", stroke: "#6d28d9", color: "#ffffff" },
  DELETE: { fill: "#dc2626", stroke: "#b91c1c", color: "#ffffff" },
  HEAD: { fill: "#4b5563", stroke: "#374151", color: "#ffffff" },
  OPTIONS: { fill: "#6b7280", stroke: "#4b5563", color: "#ffffff" },
};

function getMethodStyle(method: string): { fill: string; stroke: string; color: string } {
  return METHOD_STYLES[method.toUpperCase()] ?? { fill: "#4b5563", stroke: "#374151", color: "#ffffff" };
}

/**
 * Build a flow graph from the collection: one node per endpoint (and optionally folders).
 * No edges by default—use "structure" layout (folder hierarchy) or let LLM suggest edges.
 */
export function buildFlowGraph(
  collection: ParsedCollection,
  options?: { includeFoldersAsSubgraphs?: boolean; folderPathKeys?: string[] }
): FlowGraph {
  const nodes: FlowNode[] = [];
  const pathSet = options?.folderPathKeys ? new Set(options.folderPathKeys) : null;

  function addEndpoint(ep: ParsedEndpoint): boolean {
    if (pathSet) {
      const pathKey = ep.folderPath.join(" > ");
      if (!pathSet.has(pathKey)) return false;
    }
    nodes.push({
      id: ep.id,
      label: ep.name,
      method: ep.method,
      folderPath: ep.folderPath,
      type: "endpoint",
    });
    return true;
  }

  if (pathSet) {
    collection.endpoints.forEach(addEndpoint);
  } else {
    collection.endpoints.forEach((ep) => {
      nodes.push({
        id: ep.id,
        label: ep.name,
        method: ep.method,
        folderPath: ep.folderPath,
        type: "endpoint",
      });
    });
  }

  return { nodes, edges: [] };
}

/**
 * Generate Mermaid flowchart from structure only: subgraphs per folder, nodes per endpoint.
 * Uses endpoint IDs as Mermaid node IDs and applies method-based colors for a clearer look.
 */
export function collectionToMermaidStructure(
  collection: ParsedCollection,
  folderPathKeys?: string[]
): string {
  const lines: string[] = [
    "%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#f1f5f9', 'primaryTextColor':'#0f172a', 'primaryBorderColor':'#cbd5e1', 'lineColor':'#64748b', 'secondaryColor':'#e2e8f0', 'tertiaryColor':'#f8fafc', 'fontSize':'15px', 'fontFamily':'ui-sans-serif, system-ui, sans-serif' }}}%%",
    "flowchart TB",
  ];
  const pathSet = folderPathKeys ? new Set(folderPathKeys) : null;

  function walk(node: FolderNode, pathPrefix: string[]): void {
    const path = [...pathPrefix, node.name];
    const pathKey = path.join(" > ");
    const includeFolder = !pathSet || pathSet.has(pathKey);
    const endpoints = pathSet
      ? node.endpoints.filter((ep) => pathSet.has(ep.folderPath.join(" > ")))
      : node.endpoints;

    if (includeFolder && (endpoints.length > 0 || node.children.length > 0)) {
      const subgraphLabel = pathKey.replace(/"/g, "'");
      const subgraphId = "subgraph_" + toMermaidId(pathKey);
      lines.push(`  subgraph ${subgraphId}["${subgraphLabel}"]`);
      for (const ep of endpoints) {
        const mid = toMermaidId(ep.id);
        const label = escapeLabel(`${ep.method} ${ep.name}`);
        lines.push(`    ${mid}["${label}"]`);
      }
      for (const child of node.children) {
        walk(child, path);
      }
      lines.push("  end");
    }
  }

  function addNodeStyles(endpoints: ParsedEndpoint[], indent = "  "): void {
    for (const ep of endpoints) {
      const mid = toMermaidId(ep.id);
      const { fill, stroke, color } = getMethodStyle(ep.method);
      lines.push(`${indent}style ${mid} fill:${fill},stroke:${stroke},color:${color},stroke-width:2px`);
    }
  }

  if (collection.folderTree.length > 0) {
    for (const node of collection.folderTree) {
      walk(node, []);
    }
    // Apply method-based colors to nodes (we need endpoint list per node; collect during walk)
    const flatEndpoints: ParsedEndpoint[] = [];
    function collectEndpoints(n: FolderNode, pathPrefix: string[]): void {
      const pathKey = [...pathPrefix, n.name].join(" > ");
      if (pathSet && !pathSet.has(pathKey)) {
        n.children.forEach((c) => collectEndpoints(c, [...pathPrefix, n.name]));
        return;
      }
      flatEndpoints.push(...n.endpoints);
      n.children.forEach((c) => collectEndpoints(c, [...pathPrefix, n.name]));
    }
    collection.folderTree.forEach((n) => collectEndpoints(n, []));
    addNodeStyles(flatEndpoints);
  }

  // If no subgraphs were added (e.g. flat or no folders), add all endpoints at root
  if (lines.length <= 3 && collection.endpoints.length > 0) {
    const relevant = pathSet
      ? collection.endpoints.filter((ep) => pathSet.has(ep.folderPath.join(" > ")))
      : collection.endpoints;
    for (const ep of relevant) {
      const mid = toMermaidId(ep.id);
      const label = escapeLabel(`${ep.method} ${ep.name}`);
      lines.push(`  ${mid}["${label}"]`);
    }
    addNodeStyles(relevant);
  }

  return lines.join("\n");
}

/**
 * Convert explicit nodes + edges to Mermaid (e.g. from LLM or user).
 */
export function flowGraphToMermaid(graph: FlowGraph): string {
  const lines: string[] = ["flowchart LR"];
  const idMap = new Map<string, string>();
  graph.nodes.forEach((n) => idMap.set(n.id, toMermaidId(n.id)));
  graph.nodes.forEach((n) => {
    const mid = idMap.get(n.id)!;
    const label = escapeLabel(n.method ? `${n.method} ${n.label}` : n.label);
    lines.push(`  ${mid}["${label}"]`);
  });
  graph.edges.forEach((e) => {
    const from = idMap.get(e.fromId) ?? toMermaidId(e.fromId);
    const to = idMap.get(e.toId) ?? toMermaidId(e.toId);
    lines.push(e.label ? `  ${from} -->|${escapeLabel(e.label)}| ${to}` : `  ${from} --> ${to}`);
  });
  return lines.join("\n");
}

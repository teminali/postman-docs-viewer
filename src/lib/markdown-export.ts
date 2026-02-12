import type { ParsedEndpoint, PostmanVariable } from "@/types/postman";
import type { FolderNode } from "@/types/postman";
import type { ParsedCollection } from "@/lib/postman-parser";
import {
  humanizeEndpointName,
  generateUserDescription,
} from "@/lib/postman-parser";

export type ExportStyle = "dev" | "user";

/** Sanitize string for use in file names */
export function slug(str: string): string {
  return str
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .toLowerCase() || "export";
}

function jsonBlock(code: string, language = "json"): string {
  try {
    const formatted = JSON.stringify(JSON.parse(code), null, 2);
    return "```" + language + "\n" + formatted + "\n```";
  } catch {
    return "```\n" + code + "\n```";
  }
}

/** Single endpoint as Markdown (dev: technical, user: manual style) */
export function endpointToMarkdown(
  endpoint: ParsedEndpoint,
  style: ExportStyle = "dev"
): string {
  const lines: string[] = [];

  if (style === "user") {
    const name = humanizeEndpointName(endpoint.name);
    const desc = generateUserDescription(endpoint);
    lines.push("## " + name + "\n");
    lines.push(desc + "\n");
    lines.push("**Method:** `" + endpoint.method + "`  \n**URL:** `" + endpoint.url + "`\n");
    if (endpoint.folderPath.length > 0) {
      lines.push("**Category:** " + endpoint.folderPath.join(" > ") + "\n");
    }
    if (endpoint.description) {
      lines.push("**Details:** " + endpoint.description + "\n");
    }
    if (endpoint.auth) {
      lines.push("\n### Authentication\n");
      lines.push("Type: " + endpoint.auth.type + "\n");
    }
    if (endpoint.pathVariables.length > 0) {
      lines.push("\n### Path variables\n");
      endpoint.pathVariables.forEach((v) => {
        lines.push("- **" + v.key + "**" + (v.description ? " — " + v.description : "") + "\n");
      });
    }
    if (endpoint.queryParams.length > 0) {
      lines.push("\n### Query parameters\n");
      endpoint.queryParams.forEach((p) => {
        const valPart = p.value ? " (e.g. `" + p.value + "`)" : "";
        lines.push("- **" + p.key + "**" + (p.description ? " — " + p.description : "") + valPart + "\n");
      });
    }
    if (endpoint.body?.raw) {
      lines.push("\n### Request body example\n\n");
      lines.push(jsonBlock(endpoint.body.raw));
      lines.push("\n");
    }
    const success = endpoint.responses.find((r) => r.code && r.code >= 200 && r.code < 300);
    if (success?.body) {
      lines.push("\n### Example response\n\n");
      lines.push(jsonBlock(success.body));
      lines.push("\n");
    }
    return lines.join("\n");
  }

  // Dev style
  const tick = "\u0060";
  lines.push("## " + endpoint.name + "\n");
  lines.push(tick + endpoint.method + tick + " " + tick + endpoint.url + tick + "\n");
  if (endpoint.folderPath.length > 0) {
    lines.push("**Folder:** " + endpoint.folderPath.join(" / ") + "\n");
  }
  if (endpoint.description) {
    lines.push("\n" + endpoint.description + "\n");
  }

  if (endpoint.auth) {
    lines.push("\n### Authentication\n");
    lines.push("- **Type:** " + endpoint.auth.type + "\n");
  }

  const dash = "\u2014";
  if (endpoint.headers.length > 0) {
    lines.push("\n### Headers\n");
    lines.push("| Key | Value | Description |\n|-----|-------|-------------|\n");
    endpoint.headers.forEach((h) => {
      lines.push("| " + h.key + " | " + tick + h.value + tick + " | " + (h.description || dash) + " |\n");
    });
  }

  if (endpoint.queryParams.length > 0) {
    lines.push("\n### Query parameters\n");
    lines.push("| Parameter | Example | Description |\n|-----------|---------|-------------|\n");
    endpoint.queryParams.forEach((p) => {
      lines.push("| " + p.key + " | " + (p.value || dash) + " | " + (p.description || dash) + " |\n");
    });
  }

  if (endpoint.pathVariables.length > 0) {
    lines.push("\n### Path variables\n");
    lines.push("| Variable | Example | Description |\n|----------|---------|-------------|\n");
    endpoint.pathVariables.forEach((v) => {
      lines.push("| :" + v.key + " | " + (v.value || dash) + " | " + (v.description || dash) + " |\n");
    });
  }

  if (endpoint.body?.raw) {
    lines.push("\n### Request body\n\n");
    lines.push(jsonBlock(endpoint.body.raw));
    lines.push("\n");
  }

  if (endpoint.responses.length > 0) {
    lines.push("\n### Example responses\n\n");
    endpoint.responses.forEach((r) => {
      lines.push("**" + (r.code || "N/A") + " " + (r.status || "") + "** " + dash + " " + r.name + "\n\n");
      if (r.body) {
        lines.push(jsonBlock(r.body));
        lines.push("\n\n");
      }
    });
  }

  return lines.join("\n");
}

/** One folder and all its endpoints (and sub-folders) as Markdown */
export function folderToMarkdown(
  folder: FolderNode,
  style: ExportStyle = "dev",
  headingLevel: number = 1
): string {
  const lines: string[] = [];
  const prefix = "#".repeat(Math.min(headingLevel, 6));
  lines.push(prefix + " " + folder.name + "\n");
  if (folder.description) {
    lines.push(folder.description + "\n");
  }

  for (const ep of folder.endpoints) {
    lines.push(endpointToMarkdown(ep, style));
    lines.push("\n---\n");
  }

  for (const child of folder.children) {
    lines.push(folderToMarkdown(child, style, headingLevel + 1));
  }

  return lines.join("\n");
}

/** Variables table as Markdown */
function variablesToMarkdown(variables: PostmanVariable[]): string {
  if (variables.length === 0) return "";
  const lines: string[] = ["## Collection variables\n", "| Variable | Value | Description |\n|----------|-------|-------------|\n"];
  const dash = "\u2014";
  variables.forEach((v) => {
    lines.push("| `{{" + v.key + "}}` | " + (v.value || dash) + " | " + (v.description || dash) + " |\n");
  });
  return lines.join("\n") + "\n";
}

/** Full collection as one Markdown document */
export function collectionToMarkdown(
  collection: ParsedCollection,
  style: ExportStyle = "dev"
): string {
  const lines: string[] = [];

  lines.push("# " + collection.name + "\n");
  if (collection.description) {
    lines.push(collection.description + "\n");
  }
  lines.push("- **Endpoints:** " + collection.totalRequests);
  lines.push("- **Folders:** " + collection.totalFolders);
  lines.push("- **Methods:** " + Object.keys(collection.methods).join(", ") + "\n");

  if (collection.variables.length > 0) {
    lines.push(variablesToMarkdown(collection.variables));
    lines.push("\n");
  }

  for (const folder of collection.folderTree) {
    lines.push(folderToMarkdown(folder, style, 2));
    lines.push("\n");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Trigger browser download of a .md file */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : filename + ".md";
  a.click();
  URL.revokeObjectURL(url);
}

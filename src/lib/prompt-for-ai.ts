/**
 * Build a copy-paste prompt for any AI (ChatGPT, Claude, etc.) with full API context:
 * endpoints, example requests, example responses, and clear instructions so the AI
 * can implement tasks without fail.
 */

import type { ParsedCollection } from "@/lib/postman-parser";
import type { ParsedEndpoint, PostmanVariable } from "@/types/postman";
import { formatJson } from "@/lib/postman-parser";

const INSTRUCTION_HEADER = `# API reference for AI implementation

Use this document to implement features that call this API. Follow the exact request format for each endpoint and handle responses as shown. Substitute path variables, query parameters, and body placeholders with real values at runtime. When implementing a task:
1. Identify which endpoint(s) to call and in what order.
2. Use the exact URL pattern, method, and headers shown.
3. Send the request body in the format of the example (adjust field values as needed).
4. Parse the response according to the example response structure.

Do not invent endpoints or request/response shapes. If something is unclear, infer from the examples.

---

`;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build a short "Common characteristics" block from collection variables when there's no description. */
function commonCharacteristicsFromVariables(variables: PostmanVariable[]): string {
  if (!variables.length) return "";
  const lines: string[] = [];
  const keyLower = (v: PostmanVariable) => v.key.toLowerCase().replace(/_/g, "");
  const baseUrlVar = variables.find((v) => keyLower(v) === "baseurl");
  const tokenVar = variables.find(
    (v) =>
      keyLower(v).includes("accesstoken") ||
      keyLower(v) === "token" ||
      keyLower(v).includes("authtoken") ||
      keyLower(v).includes("apikey")
  );
  if (baseUrlVar) {
    lines.push(`- **Base URL**: \`{{${baseUrlVar.key}}}\``);
  }
  if (tokenVar) {
    lines.push(`- **Authentication**: Bearer token via \`Authorization: Bearer {{${tokenVar.key}}}\``);
  }
  const others = variables.filter((v) => v !== baseUrlVar && v !== tokenVar);
  if (others.length > 0) {
    const placeholders = others.slice(0, 5).map((v) => `{{${v.key}}}`).join(", ");
    lines.push(`- **Other placeholders** (replace with real values): ${placeholders}${others.length > 5 ? "…" : ""}`);
  }
  if (lines.length === 0) return "";
  return "Common characteristics:\n" + lines.join("\n");
}

function getEndpointsInScope(
  collection: ParsedCollection,
  folderPathKeys: string[] | null
): ParsedEndpoint[] {
  if (!folderPathKeys || folderPathKeys.length === 0) return collection.endpoints;
  const set = new Set(folderPathKeys);
  return collection.endpoints.filter((ep) => set.has(ep.folderPath.join(" > ")));
}

function formatEndpointBlock(ep: ParsedEndpoint, index: number): string {
  const lines: string[] = [];
  lines.push(`## ${index + 1}. ${ep.name}`);
  lines.push("");
  lines.push(`- **Method:** \`${ep.method}\``);
  lines.push(`- **URL:** \`${ep.url}\``);
  if (ep.description) {
    lines.push(`- **Description:** ${ep.description}`);
  }

  if (ep.headers.length > 0) {
    lines.push("- **Headers:**");
    ep.headers.forEach((h) => {
      lines.push(`  - \`${h.key}\`: ${h.value}`);
    });
  }

  if (ep.queryParams.length > 0) {
    lines.push("- **Query parameters:**");
    ep.queryParams.forEach((q) => {
      const val = q.value ? ` (example: \`${q.value}\`)` : "";
      lines.push(`  - \`${q.key}\`${val}`);
    });
  }

  if (ep.pathVariables.length > 0) {
    lines.push("- **Path variables:**");
    ep.pathVariables.forEach((v) => {
      lines.push(`  - \`${v.key}\`: replace with actual value`);
    });
  }

  const hasBody = ep.body?.raw?.trim();
  if (hasBody) {
    lines.push("- **Example request body:**");
    try {
      const pretty = formatJson(ep.body!.raw!);
      lines.push("```json");
      lines.push(pretty);
      lines.push("```");
    } catch {
      lines.push("```");
      lines.push(ep.body!.raw!);
      lines.push("```");
    }
    lines.push("");
  }

  const successResponse = ep.responses.find((r) => r.code && r.code >= 200 && r.code < 300);
  if (successResponse?.body) {
    lines.push("- **Example response:**");
    try {
      const pretty = formatJson(successResponse.body);
      lines.push("```json");
      lines.push(pretty);
      lines.push("```");
    } catch {
      lines.push("```");
      lines.push(successResponse.body);
      lines.push("```");
    }
    lines.push("");
  }

  lines.push("- **How to use:** Call this endpoint with the method and URL above. Substitute path variables and query parameters as needed. If there is a request body, send JSON matching the example structure. Expect a response matching the example response shape.");
  lines.push("");
  return lines.join("\n");
}

/**
 * Build a single prompt string that the user can copy into any AI.
 * Includes collection name, scope, and for each endpoint: method, URL, description,
 * example request (body/headers), example response, and a short "how to use" line.
 */
export function buildPromptForAI(
  collection: ParsedCollection,
  folderPathKeys: string[] | null
): string {
  const endpoints = getEndpointsInScope(collection, folderPathKeys);
  const parts: string[] = [INSTRUCTION_HEADER];
  parts.push(`# ${collection.name}`);
  let addedDescription = false;
  if (collection.description) {
    // Avoid duplicate title: strip leading # or ## line if it matches collection name
    let desc = collection.description.trim();
    const titlePatterns = [
      new RegExp(`^#\\s*${escapeRe(collection.name)}\\s*\\n?`, "i"),
      new RegExp(`^##\\s*${escapeRe(collection.name)}\\s*\\n?`, "i"),
    ];
    for (const re of titlePatterns) {
      if (re.test(desc)) {
        desc = desc.replace(re, "").trim();
        break;
      }
    }
    if (desc) {
      parts.push("");
      parts.push(desc);
      addedDescription = true;
    }
  }
  // When there's no description, add Common characteristics from collection variables
  if (!addedDescription && collection.variables.length > 0) {
    const common = commonCharacteristicsFromVariables(collection.variables);
    if (common) {
      parts.push("");
      parts.push(common);
    }
  }
  parts.push("");
  parts.push(`**Endpoints in scope:** ${endpoints.length}`);
  parts.push("");
  parts.push("---");
  parts.push("");

  endpoints.forEach((ep, i) => {
    parts.push(formatEndpointBlock(ep, i));
  });

  parts.push("---");
  parts.push("");
  parts.push("When implementing a user request, use only the endpoints and formats above. Return code, configuration, or step-by-step instructions as appropriate.");
  return parts.join("\n");
}

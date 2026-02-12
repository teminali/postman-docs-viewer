/**
 * Ask the LLM to generate a Mermaid flowchart from the API collection index.
 * Uses endpoint ids so the diagram can reference the same data keys.
 */

import { generateWithGemini } from "@/lib/gemini";

const FLOWCHART_SYSTEM = `You are an API documentation assistant. The user will provide a structured index of an API (Postman collection): folders and endpoints with fields id, method, name, path, description. Your task is to generate a single Mermaid flowchart diagram that shows a logical flow (e.g. typical usage: login -> get resource -> update). Use only the endpoint and folder names from the index; do not invent endpoints. Use Mermaid flowchart syntax only. Rules:
- Output ONLY valid Mermaid code, no explanation before or after.
- Use flowchart LR or TB. Define nodes with the endpoint id (sanitized: alphanumeric and underscore only) and a short label like "method name".
- Example format: flowchart LR\\n  A[Login] --> B[Get User]\\n  B --> C[Update Profile]
- Prefer using endpoint ids from the index as node IDs when possible (e.g. if id is "ep_1", use ep_1 as node id in Mermaid).
- Keep the diagram concise: 5-15 nodes typically. If the collection is large, pick the most representative flow (e.g. auth + one main resource).`;

/** Extract Mermaid code from model response (strip markdown code block if present). */
export function extractMermaidFromResponse(text: string): string {
  const t = text.trim();
  const codeBlock = /```(?:mermaid)?\s*([\s\S]*?)```/.exec(t);
  if (codeBlock) return codeBlock[1].trim();
  return t;
}

export async function generateFlowchartWithGemini(
  apiKey: string,
  indexJson: string,
  userPrompt?: string
): Promise<{ mermaid: string; error?: string }> {
  const prompt =
    userPrompt && userPrompt.trim()
      ? `Based on this API index, generate a Mermaid flowchart for: ${userPrompt.trim()}\n\nIndex:\n${indexJson}`
      : `Based on this API index, generate a Mermaid flowchart showing a typical API flow (e.g. authentication then main operations). Use only endpoints from the index.\n\nIndex:\n${indexJson}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: FLOWCHART_SYSTEM }] },
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let errMsg = `API error (${res.status})`;
    try {
      const j = JSON.parse(errBody);
      errMsg = j.error?.message || errMsg;
    } catch {
      if (errBody) errMsg += ": " + errBody.slice(0, 200);
    }
    return { mermaid: "", error: errMsg };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  const mermaid = extractMermaidFromResponse(raw);
  return { mermaid };
}

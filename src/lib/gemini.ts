/**
 * Google Gemini API client. Calls the API from the user's browser using their stored API key.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Cheaper model for Q&A; ~3x cost savings vs flash. Use gemini-2.5-flash for flowchart generation. */
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

/** Short system prompt; "connections" = related endpoints from other folders for notes/tips. */
const SYSTEM_INSTRUCTION = `API docs assistant. User shares an API index (selected scope) and optionally "connections": related endpoints from other folders (e.g. Auth, or keyword-related). Use only this data; don't invent endpoints.

- Use "connections" to add notes and implementation tips: e.g. "Call Authentication/Login first, then use the User Management endpoints below." Mention which connected endpoints are typically used before/after and why.
- Intent: "flow"/"sequence"/"order"/"steps"/"how" → step-by-step flow (method + name), including any connection that must run first (e.g. auth). Suggest Flowchart panel for diagram. "summary"/"overview" → brief list + note key connections. "auth" → auth endpoints + order.
- Be concise; infer from index and connections; never say data is missing.`;

export async function generateWithGemini(
  apiKey: string,
  userMessage: string,
  contextJson?: string,
  model: string = DEFAULT_MODEL
): Promise<GeminiResponse> {
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const fullUserContent = contextJson
    ? `API:\n${contextJson}\n\nQ: ${userMessage}`
    : userMessage;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ role: "user", parts: [{ text: fullUserContent }] }],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.25,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let errMsg = `Gemini API error (${res.status})`;
    try {
      const j = JSON.parse(errBody);
      errMsg = j.error?.message || errMsg;
    } catch {
      if (errBody) errMsg += ": " + errBody.slice(0, 200);
    }
    return { text: "", error: errMsg };
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  return { text };
}

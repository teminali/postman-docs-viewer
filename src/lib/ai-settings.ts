/**
 * AI provider settings stored only in the browser (localStorage).
 * Keys are never sent to our servers; only the chosen provider's API is called from the user's device.
 */

const STORAGE_KEY = "postman-docs-ai-settings";

export type AIProvider = "gemini";

export interface AISettings {
  provider: AIProvider;
  apiKeys: Partial<Record<AIProvider, string>>;
}

const DEFAULT: AISettings = {
  provider: "gemini",
  apiKeys: {},
};

export const AI_STORAGE_NOTICE =
  "Your API key is stored only in your browser (localStorage). It is never sent to our servers. Only the selected provider's API (e.g. Google) is called directly from your device.";

function getStored(): AISettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as AISettings;
    return {
      provider: parsed.provider ?? DEFAULT.provider,
      apiKeys: { ...DEFAULT.apiKeys, ...parsed.apiKeys },
    };
  } catch {
    return DEFAULT;
  }
}

function setStored(settings: AISettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function getAISettings(): AISettings {
  return getStored();
}

export function getAPIKey(provider: AIProvider): string | null {
  return getStored().apiKeys[provider] ?? null;
}

export function setAPIKey(provider: AIProvider, key: string | null): void {
  const s = getStored();
  if (key === null || key === "") {
    const { [provider]: _, ...rest } = s.apiKeys;
    setStored({ ...s, apiKeys: rest });
  } else {
    setStored({ ...s, apiKeys: { ...s.apiKeys, [provider]: key.trim() } });
  }
}

export function setProvider(provider: AIProvider): void {
  setStored({ ...getStored(), provider });
}

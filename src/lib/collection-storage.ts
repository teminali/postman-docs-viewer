const KEY_CURRENT = "postman-docs-current";
const KEY_HISTORY = "postman-docs-history";
const MAX_HISTORY = 10;

export interface HistoryEntry {
  id: string;
  name: string;
  loadedAt: number;
  collectionJson: string;
}

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // quota or disabled
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Get the currently stored collection as raw JSON, or null. */
export function getStoredCurrent(): string | null {
  return safeGet(KEY_CURRENT);
}

/** Save the current collection (raw JSON). */
export function setStoredCurrent(collectionJson: string): void {
  safeSet(KEY_CURRENT, collectionJson);
}

/** Clear the current collection from storage. */
export function clearStoredCurrent(): void {
  safeRemove(KEY_CURRENT);
}

/** Get history entries (newest first). */
export function getHistory(): HistoryEntry[] {
  const raw = safeGet(KEY_HISTORY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Add an entry to history and trim to MAX_HISTORY. Reuses same name by moving to front. */
export function addToHistory(name: string, collectionJson: string): void {
  const list = getHistory();
  const id = `${Date.now()}-${name}`;
  const entry: HistoryEntry = { id, name, loadedAt: Date.now(), collectionJson };
  // Remove any existing with same name (we'll add fresh at front)
  const filtered = list.filter((e) => e.name !== name);
  const next = [entry, ...filtered].slice(0, MAX_HISTORY);
  safeSet(KEY_HISTORY, JSON.stringify(next));
}

/** Get collection JSON for a history entry by id, or null. */
export function loadFromHistory(id: string): string | null {
  const list = getHistory();
  const entry = list.find((e) => e.id === id);
  return entry ? entry.collectionJson : null;
}

/** Remove one entry from history. */
export function removeFromHistory(id: string): void {
  const list = getHistory().filter((e) => e.id !== id);
  if (list.length) safeSet(KEY_HISTORY, JSON.stringify(list));
  else safeRemove(KEY_HISTORY);
}

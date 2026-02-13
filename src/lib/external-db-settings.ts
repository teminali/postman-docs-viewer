/**
 * External database settings stored only in the browser (localStorage).
 * Users connect their own Firebase/Firestore project to read and write
 * Postman collections. Config is never sent to our servers.
 */

import { initializeApp, deleteApp, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const STORAGE_KEY = "postman-docs-external-db";
const EXTERNAL_APP_NAME = "external-db";

export const DEFAULT_COLLECTION_NAME = "postman_docs";

export interface ExternalDbConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  appId: string;
  /** Firestore collection name to read/write docs from. Defaults to "postman_docs". */
  collectionName?: string;
}

/** Get the configured collection name (falls back to default). */
export function getExternalCollectionName(): string {
  const config = getStored();
  return config?.collectionName?.trim() || DEFAULT_COLLECTION_NAME;
}

export const EXTERNAL_DB_STORAGE_NOTICE =
  "Your database credentials are stored only in your browser (localStorage). They are never sent to our servers. Reads and writes go directly from your browser to your database.";

function getStored(): ExternalDbConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExternalDbConfig;
    if (!parsed.apiKey || !parsed.projectId || !parsed.appId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setStored(config: ExternalDbConfig | null): void {
  if (typeof window === "undefined") return;
  try {
    if (config === null) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  } catch {}
}

/** Get the saved external DB config, or null if not set. */
export function getExternalDbConfig(): ExternalDbConfig | null {
  return getStored();
}

/** Check whether an external DB has been connected. */
export function isExternalDbConnected(): boolean {
  return getStored() !== null;
}

/** Save external DB config to localStorage. */
export function setExternalDbConfig(config: ExternalDbConfig): void {
  // Destroy existing app if config changed
  destroyExternalApp();
  setStored(config);
}

/** Remove external DB config and destroy the Firebase app instance. */
export function clearExternalDbConfig(): void {
  destroyExternalApp();
  setStored(null);
}

/** Validate that the minimum required fields are present. */
export function validateExternalDbConfig(
  config: Partial<ExternalDbConfig>
): config is ExternalDbConfig {
  return !!(
    config.apiKey?.trim() &&
    config.projectId?.trim() &&
    config.appId?.trim()
  );
}

// ─── Firebase app management ──────────────────────────────────────────

let externalApp: FirebaseApp | null = null;
let externalFirestore: Firestore | null = null;

function destroyExternalApp(): void {
  if (externalApp) {
    try {
      deleteApp(externalApp);
    } catch {}
    externalApp = null;
    externalFirestore = null;
  }
}

function getOrCreateExternalApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  const config = getStored();
  if (!config) return null;

  if (externalApp) {
    try {
      // Validate the app is still alive
      getApp(EXTERNAL_APP_NAME);
      return externalApp;
    } catch {
      externalApp = null;
      externalFirestore = null;
    }
  }

  try {
    externalApp = initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain || undefined,
        projectId: config.projectId,
        storageBucket: config.storageBucket || undefined,
        appId: config.appId,
      },
      EXTERNAL_APP_NAME
    );
    return externalApp;
  } catch {
    return null;
  }
}

/**
 * Get a Firestore instance for the user's external database.
 * Returns null if no external DB is configured.
 */
export function getExternalFirestore(): Firestore | null {
  if (typeof window === "undefined") return null;
  const app = getOrCreateExternalApp();
  if (!app) return null;
  if (!externalFirestore) externalFirestore = getFirestore(app);
  return externalFirestore;
}

import { Settings, DEFAULT_SETTINGS } from "../types";

/**
 * A singleton store that holds the current extension settings in-memory.
 *
 * Content-script modules can import `getSettings()` instead of receiving
 * `settings` as a parameter, eliminating prop-drilling throughout the pipeline.
 *
 * The store is initialized once from `chrome.storage.sync` via `initSettings()`,
 * and it automatically stays in sync via `chrome.storage.onChanged`.
 *
 * All settings are namespaced under a single storage key (STORAGE_KEY) holding
 * a `Settings` object, so we don't pollute the extension's storage root and
 * we can version/migrate the shape cleanly in the future.
 */

/** Single namespaced storage key holding the whole Settings object. */
export const STORAGE_KEY = "colorHighlighter";

type Listener = (settings: Settings, changed: Partial<Settings>) => void;

let current: Settings = { ...DEFAULT_SETTINGS };
let initialized = false;
const listeners = new Set<Listener>();

/**
 * Get the current settings snapshot.
 */
export function getSettings(): Settings {
  return current;
}

/**
 * Subscribe to settings changes. Returns an unsubscribe function.
 */
export function subscribeSettings(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Persist the whole settings object under the single namespaced key. */
export function saveSettings(next: Settings): void {
  chrome.storage.sync.set({ [STORAGE_KEY]: next });
}

function mergeSettings(partial: Partial<Settings> | undefined | null): Settings {
  return {
    enabled: partial?.enabled ?? DEFAULT_SETTINGS.enabled,
    colorizationType: partial?.colorizationType ?? DEFAULT_SETTINGS.colorizationType,
    showSwatch: partial?.showSwatch ?? DEFAULT_SETTINGS.showSwatch,
    appearance: partial?.appearance ?? DEFAULT_SETTINGS.appearance,
  };
}

function diff(next: Settings, prev: Settings): Partial<Settings> {
  const applied: Partial<Settings> = {};
  if (next.enabled !== prev.enabled) applied.enabled = next.enabled;
  if (next.colorizationType !== prev.colorizationType) applied.colorizationType = next.colorizationType;
  if (next.showSwatch !== prev.showSwatch) applied.showSwatch = next.showSwatch;
  if (next.appearance !== prev.appearance) applied.appearance = next.appearance;
  return applied;
}

/**
 * Read the namespaced settings from storage, migrating from legacy flat keys
 * on first run if the namespaced key is not yet present.
 */
async function readFromStorage(): Promise<Settings> {
  return new Promise<Settings>((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const nested = result?.[STORAGE_KEY] as Partial<Settings> | undefined;
      if (nested && typeof nested === "object") {
        resolve(mergeSettings(nested));
        return;
      }
    });
  });
}

/**
 * Initialize the store from chrome.storage.sync and start listening for changes.
 * Safe to call multiple times.
 */
export async function initSettings(): Promise<Settings> {
  if (initialized) return current;

  initialized = true;
  current = await readFromStorage();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    const change = changes[STORAGE_KEY];
    if (!change) return;

    const next = mergeSettings(change.newValue as Partial<Settings> | undefined);
    const applied = diff(next, current);
    if (Object.keys(applied).length === 0) return;

    current = next;
    for (const listener of listeners) {
      listener(current, applied);
    }
  });

  return current;
}

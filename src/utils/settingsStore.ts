import { Settings, DEFAULT_SETTINGS, ColorizationType } from "../types";

/**
 * A singleton store that holds the current extension settings in-memory.
 *
 * Content-script modules can import `getSettings()` instead of receiving
 * `settings` as a parameter, eliminating prop-drilling throughout the pipeline.
 *
 * The store is initialized once from `chrome.storage.sync` via `initSettings()`,
 * and it automatically stays in sync via `chrome.storage.onChanged`.
 */

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

function applyChanges(changes: Partial<Settings>): void {
  let hasChange = false;
  const applied: Partial<Settings> = {};

  if (changes.enabled !== undefined && changes.enabled !== current.enabled) {
    current.enabled = changes.enabled;
    applied.enabled = changes.enabled;
    hasChange = true;
  }

  if (changes.colorizationType !== undefined && changes.colorizationType !== current.colorizationType) {
    current.colorizationType = changes.colorizationType;
    applied.colorizationType = changes.colorizationType;
    hasChange = true;
  }

  if (changes.showSwatch !== undefined && changes.showSwatch !== current.showSwatch) {
    current.showSwatch = changes.showSwatch;
    applied.showSwatch = changes.showSwatch;
    hasChange = true;
  }

  if (hasChange) {
    for (const l of listeners) l(current, applied);
  }
}

/**
 * Initialize the store from chrome.storage.sync and start listening for changes.
 * Safe to call multiple times.
 */
export async function initSettings(): Promise<Settings> {
  if (initialized) return current;
  initialized = true;

  current = await new Promise<Settings>((resolve) => {
    chrome.storage.sync.get(["enabled", "colorizationType", "showSwatch"], (result: Partial<Settings>) => {
      resolve({
        enabled: result.enabled ?? DEFAULT_SETTINGS.enabled,
        colorizationType: result.colorizationType ?? DEFAULT_SETTINGS.colorizationType,
        showSwatch: result.showSwatch ?? DEFAULT_SETTINGS.showSwatch,
      });
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    const patch: Partial<Settings> = {};
    if (changes.enabled) {
      patch.enabled = changes.enabled.newValue as boolean;
    }

    if (changes.colorizationType) {
      patch.colorizationType = changes.colorizationType.newValue as ColorizationType;
    }

    if (changes.showSwatch) {
      patch.showSwatch = changes.showSwatch.newValue as boolean;
    }

    if (Object.keys(patch).length > 0) {
      applyChanges(patch);
    }
  });

  return current;
}

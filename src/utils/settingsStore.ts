import browser from "webextension-polyfill";
import { Appearance, Settings, DEFAULT_SETTINGS } from "../types";

/**
 * A singleton store that holds the current extension settings in-memory,
 * plus the semantics for interpreting them (disabled-site matching, repaint
 * relevance, appearance defaulting, per-site mutators).
 *
 * Content-script modules can import `getSettings()` instead of receiving
 * `settings` as a parameter, eliminating prop-drilling throughout the pipeline.
 *
 * The store is initialized once from `browser.storage.sync` via `initSettings()`,
 * and it automatically stays in sync via `browser.storage.onChanged`.
 *
 * All settings are namespaced under a single storage key (STORAGE_KEY) holding
 * a `Settings` object, so we don't pollute the extension's storage root and
 * we can version/migrate the shape cleanly in the future.
 */

/** Single namespaced storage key holding the whole Settings object. */
export const STORAGE_KEY = "colorHighlighter";

/**
 * Settings whose changes require the content script to re-render the page.
 * `appearance` is UI-only, so it's excluded.
 */
export const REPAINT_KEYS: ReadonlySet<keyof Settings> = new Set<keyof Settings>([
  "enabled",
  "colorizationType",
  "showSwatch",
  "forceDetect",
  "disabledSites",
]);

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
  browser.storage.sync.set({ [STORAGE_KEY]: next });
}

function sanitizeDisabledSites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_SETTINGS.disabledSites];
  return raw.filter((s): s is string => typeof s === "string");
}

function mergeSettings(partial: Partial<Settings> | undefined | null): Settings {
  return {
    enabled: partial?.enabled ?? DEFAULT_SETTINGS.enabled,
    colorizationType: partial?.colorizationType ?? DEFAULT_SETTINGS.colorizationType,
    showSwatch: partial?.showSwatch ?? DEFAULT_SETTINGS.showSwatch,
    forceDetect: partial?.forceDetect ?? DEFAULT_SETTINGS.forceDetect,
    disabledSites: sanitizeDisabledSites(partial?.disabledSites),
    appearance: partial?.appearance ?? DEFAULT_SETTINGS.appearance,
  };
}

/** Order-insensitive equality for a small list of strings. */
function sameSites(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function diff(next: Settings, prev: Settings): Partial<Settings> {
  const applied: Partial<Settings> = {};
  if (next.enabled !== prev.enabled) applied.enabled = next.enabled;
  if (next.colorizationType !== prev.colorizationType) applied.colorizationType = next.colorizationType;
  if (next.showSwatch !== prev.showSwatch) applied.showSwatch = next.showSwatch;
  if (next.forceDetect !== prev.forceDetect) applied.forceDetect = next.forceDetect;
  if (!sameSites(next.disabledSites, prev.disabledSites)) applied.disabledSites = next.disabledSites;
  if (next.appearance !== prev.appearance) applied.appearance = next.appearance;
  return applied;
}

/**
 * Read the namespaced settings from storage, migrating from legacy flat keys
 * on first run if the namespaced key is not yet present.
 */
async function readFromStorage(): Promise<Settings> {
  const result = await browser.storage.sync.get([STORAGE_KEY]);
  const nested = result?.[STORAGE_KEY] as Partial<Settings> | undefined;
  if (nested && typeof nested === "object") {
    return mergeSettings(nested);
  }
  return mergeSettings(null);
}

/**
 * Initialize the store from browser.storage.sync and start listening for changes.
 * Safe to call multiple times.
 */
export async function initSettings(): Promise<Settings> {
  if (initialized) return current;

  initialized = true;
  current = await readFromStorage();

  browser.storage.onChanged.addListener((changes, area) => {
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


/**
 * Whether the given hostname is disabled by the user's `disabledSites` list.
 * Entries match themselves and their subdomains (e.g. `github.com` also
 * matches `gist.github.com`).
 */
export function isHostDisabled(host: string | null | undefined): boolean {
  const disabledSites = current.disabledSites;
  if (!disabledSites.length) return false;

  const currentHost = (host ?? "").toLowerCase();
  if (!currentHost) return false;

  for (const entry of disabledSites) {
    const website = entry.trim().toLowerCase();
    if (!website) continue;
    if (currentHost === website || currentHost.endsWith(`.${website}`)) return true;
  }
  return false;
}

/** Add a hostname to the disabled list and persist. No-op if already present. */
export function addDisabledSite(host: string): void {
  const currentHost = host.trim().toLowerCase();
  if (!currentHost || current.disabledSites.includes(currentHost)) return;

  saveSettings({
    ...current,
    disabledSites: [...current.disabledSites, currentHost]
  });
}

/** Remove a hostname from the disabled list and persist. */
export function removeDisabledSite(host: string): void {
  const currentHost = host.trim().toLowerCase();
  if (!current.disabledSites.includes(currentHost)) return;

  saveSettings({
    ...current,
    disabledSites: current.disabledSites.filter((s) => s !== currentHost)
  });
}

/** Whether a subscribeSettings `changed` payload contains any paint-affecting key. */
export function changesRequireRepaint(changed: Partial<Settings>): boolean {
  for (const key of Object.keys(changed) as Array<keyof Settings>) {
    if (REPAINT_KEYS.has(key)) return true;
  }
  return false;
}

/** Best-guess system appearance from the OS/browser preference. */
export function getSystemAppearance(): Appearance {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/** Fill in `appearance` (which isn't persisted with a default) using the system preference. */
export function withAppearance(s: Settings): Settings {
  return {
    ...s,
    appearance: s.appearance ?? getSystemAppearance(),
  };
}

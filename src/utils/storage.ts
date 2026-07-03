import { Settings, DEFAULT_SETTINGS, ColorizationType } from "../types";

/**
 * Load settings from chrome.storage.sync
 */
export async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["enabled", "colorizationType"], (result: Settings) => {
      resolve({
        enabled: result.enabled !== undefined ? result.enabled : DEFAULT_SETTINGS.enabled,
        colorizationType: result.colorizationType !== undefined ? result.colorizationType : DEFAULT_SETTINGS.colorizationType,
      });
    });
  });
}

/**
 * Listen for settings changes
 */
export function onSettingsChanged(callback: (changes: Partial<Settings>) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;

    const newSettings: Partial<Settings> = {};
    if (changes.enabled) {
      newSettings.enabled = changes.enabled.newValue as boolean;
    }
    if (changes.colorizationType) {
      newSettings.colorizationType = changes.colorizationType.newValue as ColorizationType;
    }

    if (Object.keys(newSettings).length > 0) {
      callback(newSettings);
    }
  });
}

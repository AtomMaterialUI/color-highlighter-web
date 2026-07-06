import { NAV_SELECTOR, initSettings, subscribeSettings, getSettings, colorizeEditor, removeColorization, processNode } from "./utils";
import "./styles/global.css";

export const config = {
  matches: ["http://*/*", "https://*/*"],
};

/**
 * Setup a MutationObserver to handle dynamically added content
 */
function setupMutationObserver(): void {
  const promises: Promise<void>[] = [];
  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            promises.push(processNode(node));
          }
        }
      }
    }
    await Promise.all(promises);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    characterDataOldValue: false,
  });
}

/**
 * Initialize the extension
 */
async function init(): Promise<void> {
  // Load settings into the singleton store (all downstream modules read from it)
  await initSettings();

  // Initial colorization
  colorizeEditor();

  // React to settings changes: repaint whenever settings mutate
  subscribeSettings(() => {
    removeColorization(document.body);
    if (getSettings().enabled) {
      colorizeEditor();
    }
  });

  // Setup mutation observer for dynamic changes
  setupMutationObserver();

  // Listen for file changes (SPA navigation)
  if (NAV_SELECTOR) {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(NAV_SELECTOR)) {
        setTimeout(() => colorizeEditor(), 100);
      }
    });
  }

  // Re-colorize on page load complete
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => colorizeEditor(), 200);
    });
  }

  console.log("[Color Highlighter] Extension initialized");
}

// Start the extension
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Handle SPA navigation via history API
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function (...args) {
  const result = originalPushState.apply(this, args);
  setTimeout(() => colorizeEditor(), 100);
  return result;
};

window.history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  setTimeout(() => colorizeEditor(), 100);
  return result;
};

import { NAV_SELECTOR, loadSettings, onSettingsChanged, colorizeEditor, removeColorization, processNode } from "./utils";
import { Settings, DEFAULT_SETTINGS } from "./types";

export const config = {
  matches: ["https://github.com/*", "https://gitlab.com/*", "https://bitbucket.org/*", "https://gitee.com/*"],
};

let settings: Settings = { ...DEFAULT_SETTINGS };

/**
 * Setup a MutationObserver to handle dynamically added content
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        // Process added nodes
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE ||
            node.nodeType === Node.TEXT_NODE
          ) {
            // Debounce: only process if there are additions
            processNode(node);
          }
        }
      } else if (
        mutation.type === "characterData" &&
        mutation.target.parentNode
      ) {
        // Process text changes
        processNode(mutation.target);
      }
    }
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
function init(): void {
  // Initial colorization
  colorizeEditor();

  // Setup mutation observer for dynamic changes
  setupMutationObserver();

  // Listen for file changes (SPA navigation)
  if (NAV_SELECTOR) {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(NAV_SELECTOR)) {
        setTimeout(() => {
          colorizeEditor();
        }, 100);
      }
    });
  }

  // Re-colorize on page load complete
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => colorizeEditor(settings), 200);
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
  setTimeout(() => colorizeEditor(settings), 100);
  return result;
};

window.history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  setTimeout(() => colorizeEditor(settings), 100);
  return result;
};

import {
  NAV_SELECTOR,
  initSettings,
  subscribeSettings,
  getSettings,
  isHostDisabled,
  changesRequireRepaint,
  colorizeEditor,
  removeColorization,
  processNode
} from "./utils";
import "./styles/global.css";

export const config = {
  matches: ["http://*/*", "https://*/*"],
};

/**
 * Cached "is this hostname disabled?" flag. Recomputed only when the
 * `disabledSites` setting changes — avoids per-mutation string work in the
 * MutationObserver hot path.
 */
let siteDisabled = false;

function refreshSiteDisabled(): void {
  siteDisabled = isHostDisabled(typeof location !== "undefined" ? location.hostname : null);
}

/** Paint colors if the extension is enabled and this site isn't disabled. */
function runColorization(): void {
  if (!getSettings().enabled || siteDisabled) return;
  colorizeEditor();
}

/**
 * Setup a MutationObserver to handle dynamically added content
 */
function setupMutationObserver(): void {
  const observer = new MutationObserver((mutations) => {
    if (siteDisabled) return;

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            processNode(node);
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

/**
 * Initialize the extension
 */
async function init(): Promise<void> {
  // Load settings into the singleton store (all downstream modules read from it)
  await initSettings();

  refreshSiteDisabled();

  // Initial colorization
  runColorization();

  // React to settings changes: only repaint when a paint-affecting setting changed.
  subscribeSettings((_next, changed) => {
    if ("disabledSites" in changed) refreshSiteDisabled();

    if (!changesRequireRepaint(changed)) return;

    removeColorization(document.body);
    runColorization();
  });

  // Setup mutation observer for dynamic changes
  setupMutationObserver();

  // Listen for file changes (SPA navigation)
  if (NAV_SELECTOR) {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(NAV_SELECTOR)) {
        setTimeout(runColorization, 100);
      }
    });
  }

  // Re-colorize on page load complete
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(runColorization, 200);
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
  setTimeout(runColorization, 100);
  return result;
};

window.history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  setTimeout(runColorization, 100);
  return result;
};

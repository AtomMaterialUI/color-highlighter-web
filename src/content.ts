import type { PlasmoCSConfig } from "plasmo";
import { detectColors } from "./utils/colorDetector";
import {
  CODE_CONTAINER_SELECTOR,
  SKIP_SELECTOR,
  createColorizedElement,
  isAlreadyColorized,
} from "./utils/domUtils";

export const config: PlasmoCSConfig = {
  matches: [
    "https://github.com/*",
    "https://gitlab.com/*",
    "https://gitee.com/*",
    "https://bitbucket.org/*",
    "https://dev.azure.com/*",
    "https://*.github.dev/*",
    "https://*.gitpod.io/*",
  ],
  all_frames: true,
};

/**
 * Process text nodes to colorize color codes
 */
function processTextNode(textNode: Text): void {
  const text = textNode.textContent || "";

  // Find color matches
  const colorMatches = detectColors(text);

  if (colorMatches.length === 0) {
    return;
  }

  // Build the new content with colorized spans
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  for (const match of colorMatches) {
    // Add text before this match
    if (match.startIndex > lastIndex) {
      fragment.appendChild(
        document.createTextNode(text.substring(lastIndex, match.startIndex)),
      );
    }

    // Add colorized element
    const colorizedElement = createColorizedElement(match);
    fragment.appendChild(colorizedElement);

    lastIndex = match.endIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
  }

  // Replace the text node with the fragment
  textNode.parentNode?.replaceChild(fragment, textNode);
}

/**
 * Process a node and its children to colorize color codes
 */
function processNode(
  node: Node,
  depth: number = 0,
  isInsideContainer: boolean = false,
): void {
  if (depth > 50) {
    return; // Prevent infinite recursion
  }

  // Skip if already colorized or is a special element
  if (isAlreadyColorized(node)) {
    return;
  }

  // Skip line numbers and other UI elements
  if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).closest(SKIP_SELECTOR)) {
    return;
  }
  if (node.nodeType === Node.TEXT_NODE && node.parentElement?.closest(SKIP_SELECTOR)) {
    return;
  }

  let currentIsInside = isInsideContainer;
  if (!currentIsInside) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      currentIsInside =
        (node as HTMLElement).closest(CODE_CONTAINER_SELECTOR) !== null;
    } else if (node.nodeType === Node.TEXT_NODE) {
      currentIsInside =
        node.parentElement?.closest(CODE_CONTAINER_SELECTOR) !== null;
    }
  }

  // If not inside a container, only look for containers within this element
  if (!currentIsInside) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const skipTags = [
        "SCRIPT",
        "STYLE",
        "NOSCRIPT",
        "META",
        "LINK",
        "TITLE",
        "HEAD",
        "TEXTAREA",
        "INPUT",
      ];
      if (!skipTags.includes(element.tagName.toUpperCase())) {
        const containers = element.querySelectorAll(CODE_CONTAINER_SELECTOR);
        containers.forEach((container) =>
          processNode(container, depth + 1, true),
        );
      }
    }
    return;
  }

  // Process text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    // Only process if text looks like it might contain colors
    if (text.length > 0 && /#?|rgb|hsl|[a-z0-9]{3,6}/i.test(text)) {
      processTextNode(node as Text);
    }
    return;
  }

  // Process element nodes
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;

    // Skip dangerous elements but process all others
    const skipTags = [
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "META",
      "LINK",
      "TITLE",
      "HEAD",
      "TEXTAREA",
      "INPUT",
    ];
    if (skipTags.includes(element.tagName.toUpperCase())) {
      return;
    }

    // Process children
    const children = Array.from(node.childNodes);
    for (const child of children) {
      processNode(child, depth + 1, true);
    }
  }
}

/**
 * Main colorize function
 */
function colorizeEditor(): void {
  // Find code editor containers on the page
  const codeContainers = document.querySelectorAll(CODE_CONTAINER_SELECTOR);

  if (codeContainers.length === 0) {
    // Fallback: try to find main content area or just process body
    // We are already restricted by manifest matches to target domains
    const mainArea = document.querySelector(
      ".repository-content, #js-repo-pjax-container, #repository-container-react, .content-wrapper, main, [role='main']",
    );
    processNode(mainArea || document.body, 0, false);
  } else {
    codeContainers.forEach((container) => {
      processNode(container, 0, true);
    });
  }
}

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

  // Listen for file changes (GitHub specific)
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    // Re-colorize when user clicks on file links or tabs
    if (
      target.closest(".js-navigation-open, [data-tab-panel], .file-navigation")
    ) {
      setTimeout(() => {
        colorizeEditor();
      }, 100);
    }
  });

  // Re-colorize on page load complete
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(colorizeEditor, 200);
    });
  }

  console.log("[GitHub Colorize] Extension initialized");
}

// Start the extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Re-initialize if SPA navigation occurs
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function (...args) {
  const result = originalPushState.apply(this, args);
  setTimeout(colorizeEditor, 100);
  return result;
};

window.history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args);
  setTimeout(colorizeEditor, 100);
  return result;
};

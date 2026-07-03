import { detectColors } from "./utils/colorDetector";
import { createColorizedElement, isAlreadyColorized } from "./utils/domUtils";

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
function processNode(node: Node, depth: number = 0): void {
  if (depth > 50) {
    return; // Prevent infinite recursion
  }

  // Skip if already colorized or is a special element
  if (isAlreadyColorized(node)) {
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
    ];
    if (skipTags.includes(element.tagName.toUpperCase())) {
      return;
    }

    // Process children
    const children = Array.from(node.childNodes);
    for (const child of children) {
      processNode(child, depth + 1);
    }
  }
}

/**
 * Main colorize function
 */
function colorizeEditor(): void {
  // Find code editor containers on the page
  const codeContainers = document.querySelectorAll(
    ".blob-code, .blob-wrapper, .file-content, .CodeMirror, .ace_editor, .monaco-editor, [id*='editor'], .hljs",
  );

  if (codeContainers.length === 0) {
    // Fallback: process the entire body for smaller pages or alternative editors
    processNode(document.body);
  } else {
    codeContainers.forEach((container) => {
      processNode(container);
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

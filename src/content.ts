import { detectColors, ColorMatch } from "./utils/colorDetector";
import {
  CODE_CONTAINER_SELECTOR,
  SKIP_SELECTOR,
  SKIP_TAGS,
  MAIN_AREA_SELECTOR,
  NAV_SELECTOR,
  createColorizedElement,
  isAlreadyColorized
} from "./utils";

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
  if (depth > 50) return;

  // Skip if already colorized
  if (isAlreadyColorized(node)) return;

  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      const element = node as HTMLElement;

      // Skip line numbers and UI elements
      if (element.closest(SKIP_SELECTOR)) return;

      if (SKIP_TAGS.includes(element.tagName.toUpperCase())) return;

      // If it's a code container, process it as a unit to handle multi-node matches
      if (element.closest(CODE_CONTAINER_SELECTOR)) {
        processContainer(element);
        return;
      }

      // Otherwise recurse to find containers or handle non-code areas
      const children = Array.from(element.childNodes);
      for (const child of children) {
        processNode(child, depth + 1);
      }
      break;
    case Node.TEXT_NODE:
      // We only reach here if we're not inside a code container yet
      // because CODE_CONTAINER_SELECTOR check in ELEMENT_NODE would have triggered processContainer
      // But some text nodes might be in MAIN_AREA but not in a specific code container
      const parent = node.parentElement;
      if (parent && parent.closest(MAIN_AREA_SELECTOR)) {
        processTextNode(node as Text);
      }
      break;
  }
}

/**
 * Process a container element as a unit to support color matches spanning multiple text nodes.
 */
function processContainer(container: HTMLElement): void {
  // 1. Collect all text nodes and their absolute offsets within the container
  const textNodes: { node: Text; start: number; end: number }[] = [];
  let combinedText = "";
  let currentOffset = 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip already colorized or skipped elements
      if (isAlreadyColorized(node)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (node.parentElement?.closest(SKIP_SELECTOR)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    textNodes.push({
      node: node as Text,
      start: currentOffset,
      end: currentOffset + text.length,
    });
    combinedText += text;
    currentOffset += text.length;
  }

  if (combinedText.length === 0) return;

  // 2. Detect colors in the combined text
  const matches = detectColors(combinedText);
  if (matches.length === 0) return;

  // 3. For each text node, find overlapping matches and apply them
  // We process text nodes in reverse order to not mess up indices if we were to modify them,
  // but since we replace them completely, order doesn't strictly matter for nodes,
  // but it does for matches within a node.
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const { node, start, end } = textNodes[i];
    const nodeMatches = matches.filter(
      (m) => m.startIndex < end && m.endIndex > start,
    );

    if (nodeMatches.length > 0) {
      processTextNodeWithMatches(node, start, nodeMatches);
    }
  }
}

/**
 * Process a single text node with a list of color matches that overlap it.
 */
function processTextNodeWithMatches(
  textNode: Text,
  nodeStartOffset: number,
  matches: ColorMatch[],
): void {
  const text = textNode.textContent || "";
  const nodeEndOffset = nodeStartOffset + text.length;
  const fragment = document.createDocumentFragment();
  let lastInNodeIndex = 0;

  // Sort matches by start index to process them in order
  const sortedMatches = [...matches].sort(
    (a, b) => a.startIndex - b.startIndex,
  );

  for (const match of sortedMatches) {
    const matchStartInNode = Math.max(0, match.startIndex - nodeStartOffset);
    const matchEndInNode = Math.min(
      text.length,
      match.endIndex - nodeStartOffset,
    );

    // Add text before the match part
    if (matchStartInNode > lastInNodeIndex) {
      fragment.appendChild(
        document.createTextNode(
          text.substring(lastInNodeIndex, matchStartInNode),
        ),
      );
    }

    // Add colorized match part
    const matchPartText = text.substring(matchStartInNode, matchEndInNode);
    if (matchPartText.length > 0) {
      const isFirstPart = match.startIndex >= nodeStartOffset;
      const isLastPart = match.endIndex <= nodeEndOffset;

      const colorizedElement = createColorizedElement(
        { ...match, text: matchPartText },
        isFirstPart,
        isLastPart,
      );
      fragment.appendChild(colorizedElement);
    }

    lastInNodeIndex = matchEndInNode;
  }

  // Add remaining text
  if (lastInNodeIndex < text.length) {
    fragment.appendChild(
      document.createTextNode(text.substring(lastInNodeIndex)),
    );
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
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
    const mainArea = document.querySelector(MAIN_AREA_SELECTOR);
    processNode(mainArea || document.body, 0);
  } else {
    codeContainers.forEach((container) => {
      processNode(container, 0);
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

  // Listen for file changes (SPA navigation)
  if (NAV_SELECTOR) {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      // Re-colorize when user clicks on navigation links
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

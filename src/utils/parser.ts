import { detectColors, ColorMatch } from "./colorDetector";
import {
  CODE_CONTAINER_SELECTOR,
  SKIP_SELECTOR,
  SKIP_TAGS,
  MAIN_AREA_SELECTOR,
  createColorizedElement,
  isAlreadyColorized,
  COLORIZE_CLASS,
} from "./domUtils";
import { GUTTER_ICON_CLASS, updateGutterIcon } from "./gutter";
import { getSettings } from "./settingsStore";

/**
 * Remove colorization from a container
 */
export function removeColorization(container: HTMLElement): void {
  // 1. Remove color spans
  const wrappers = container.querySelectorAll(`.${COLORIZE_CLASS}`);
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentNode;
    if (!parent) return;

    // Structure: wrapper (span.github-colorize-span) -> textSpan (span) -> textNodes
    const textSpan = wrapper.firstChild;
    if (textSpan && textSpan.nodeName === "SPAN") {
      while (textSpan.firstChild) {
        parent.insertBefore(textSpan.firstChild, wrapper);
      }
    } else {
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
      }
    }
    parent.removeChild(wrapper);
  });

  // 2. Remove gutter icons
  const gutterIcons = container.querySelectorAll(`.${GUTTER_ICON_CLASS}`);
  gutterIcons.forEach((icon) => icon.remove());
}

/**
 * Process text nodes to colorize color codes
 */
function processTextNode(textNode: Text): void {
  const settings = getSettings();
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
      fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.startIndex)));
    }

    // Add colorized element
    const colorizedElement = createColorizedElement(match, true, true, settings.colorizationType);
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
export function processNode(node: Node, depth: number = 0): void {
  if (!getSettings().enabled) return;
  if (depth > 50) return;

  // Skip if already colorized
  if (isAlreadyColorized(node)) return;

  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      const element = node as HTMLElement;

      // Skip line numbers and UI elements
      if (element.closest(SKIP_SELECTOR)) return;
      if (SKIP_TAGS.includes(element.tagName.toUpperCase())) return;

      // Special handling for textareas (gutter icon only)
      if (element.tagName === "TEXTAREA") {
        const textarea = element as HTMLTextAreaElement;
        const handler = () => {
          const matches = detectColors(textarea.value);
          updateGutterIcon(textarea, matches);
        };

        // Add listener for live updates if not already added
        if (!(textarea as HTMLTextAreaElement & { _hasColorizeListener?: boolean })._hasColorizeListener) {
          textarea.addEventListener("input", handler);
          (textarea as HTMLTextAreaElement & { _hasColorizeListener?: boolean })._hasColorizeListener = true;
        }

        handler(); // Initial check
        return;
      }

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
    }
    case Node.TEXT_NODE: {
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
}

/**
 * Process a container element as a unit to support color matches spanning multiple text nodes.
 */
export function processContainer(container: HTMLElement): void {
  // 0. Remove existing colorization to allow clean re-processing
  removeColorization(container);

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

  // 3. Update gutter icon with the last found color
  updateGutterIcon(container, matches);

  // 4. For each text node, find overlapping matches and apply them
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const { node, start, end } = textNodes[i];
    const nodeMatches = matches.filter((m) => m.startIndex < end && m.endIndex > start);

    if (nodeMatches.length > 0) {
      processTextNodeWithMatches(node, start, nodeMatches);
    }
  }
}

/**
 * Process a single text node with a list of color matches that overlap it.
 */
function processTextNodeWithMatches(textNode: Text, nodeStartOffset: number, matches: ColorMatch[]): void {
  const settings = getSettings();
  const text = textNode.textContent || "";
  const nodeEndOffset = nodeStartOffset + text.length;
  const fragment = document.createDocumentFragment();
  let lastInNodeIndex = 0;

  // Sort matches by start index to process them in order
  const sortedMatches = [...matches].sort((a, b) => a.startIndex - b.startIndex);

  for (const match of sortedMatches) {
    const matchStartInNode = Math.max(0, match.startIndex - nodeStartOffset);
    const matchEndInNode = Math.min(text.length, match.endIndex - nodeStartOffset);

    // Add text before the match part
    if (matchStartInNode > lastInNodeIndex) {
      fragment.appendChild(document.createTextNode(text.substring(lastInNodeIndex, matchStartInNode)));
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
        settings.colorizationType,
      );
      fragment.appendChild(colorizedElement);
    }

    lastInNodeIndex = matchEndInNode;
  }

  // Add remaining text
  if (lastInNodeIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.substring(lastInNodeIndex)));
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
}

/**
 * Main colorize function
 */
export function colorizeEditor(): void {
  if (!getSettings().enabled) {
    removeColorization(document.body);
    return;
  }

  // Find code editor containers on the page
  const codeContainers = document.querySelectorAll(CODE_CONTAINER_SELECTOR);

  if (codeContainers.length === 0) {
    // Fallback: try to find main content area or just process body
    const mainArea = document.querySelector(MAIN_AREA_SELECTOR);
    processNode(mainArea || document.body, 0);
  } else {
    codeContainers.forEach((container) => {
      processNode(container, 0);
    });
  }
}

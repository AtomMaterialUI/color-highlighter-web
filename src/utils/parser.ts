import { ColorMatch } from "./colorDetector";
import {
  CODE_CONTAINER_SELECTOR,
  SKIP_SELECTOR,
  SKIP_TAGS,
  createColorizedElement,
  isAlreadyColorized,
  COLORIZE_CLASS,
  COLOR_SWATCH_CLASS,
} from "./domUtils";
import { GUTTER_ICON_CLASS } from "./gutter";
import { getSettings } from "./settingsStore";
import { isSupportedSite } from "./selectors";
import { detectColorsAsync } from "~utils/workerManager";

/**
 * Remove colorization from a container
 */
export function removeColorization(container: HTMLElement): void {
  // 1. Remove color spans
  const wrappers = container.querySelectorAll(`.${COLORIZE_CLASS}`);
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentNode;
    if (!parent) return;

    // Structure: wrapper (span.github-colorize-span) -> [optional swatch span, textSpan] -> textNodes
    // The swatch (if present) is decorative and must be discarded; we only restore the original text.
    const children = Array.from(wrapper.childNodes);
    const textSpan = children.find(
      (child) => child.nodeType === Node.ELEMENT_NODE && !(child as HTMLElement).classList.contains(COLOR_SWATCH_CLASS),
    );

    if (textSpan) {
      while (textSpan.firstChild) {
        parent.insertBefore(textSpan.firstChild, wrapper);
      }
    } else {
      // Fallback: move any non-swatch children out
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).classList.contains(COLOR_SWATCH_CLASS)) continue;
        parent.insertBefore(child, wrapper);
      }
    }
    parent.removeChild(wrapper);
  });

  // 2. Remove gutter icons
  const gutterIcons = container.querySelectorAll(`.${GUTTER_ICON_CLASS}`);
  gutterIcons.forEach((icon) => icon.remove());
}

/**
 * Process a node and its children to colorize color codes
 */
export async function processNode(node: Node, depth: number = 0): Promise<void> {
  const settings = getSettings();
  if (!settings.enabled) return;

  // If not on a supported site and forceDetect is off, skip processing
  if (!isSupportedSite() && !settings.forceDetect) return;

  if (depth > 50) return;

  // Skip if already colorized
  if (isAlreadyColorized(node)) return;

  switch (node.nodeType) {
    case Node.ELEMENT_NODE: {
      const element = node as HTMLElement;

      // Skip line numbers and UI elements
      if (element.closest(SKIP_SELECTOR)) return;

      if (SKIP_TAGS.includes(element.tagName.toUpperCase())) return;

      // If it's a code container, process it as a unit to handle multi-node matches
      const container = element.closest(CODE_CONTAINER_SELECTOR);
      if (container) {
        await processContainer(container as HTMLElement);
        return;
      }

      // Otherwise recurse to find containers or handle non-code areas
      const children = Array.from(element.childNodes);
      for (const child of children) {
        await processNode(child, depth + 1);
      }
      break;
    }
    case Node.TEXT_NODE: {
      // Re-process the container if a text node is added/changed inside one
      const container = node.parentElement?.closest(CODE_CONTAINER_SELECTOR);
      if (container) {
        await processContainer(container as HTMLElement);
      }
      break;
    }
  }
}

/**
 * Process a container element as a unit to support color matches spanning multiple text nodes.
 */
export async function processContainer(container: HTMLElement): Promise<void> {
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
  const matches = await detectColorsAsync(combinedText);
  if (matches.length === 0) {
    return;
  }

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
  const settings = getSettings();
  if (!settings.enabled) {
    removeColorization(document.body);
    return;
  }

  // If not on a supported site and forceDetect is off, do nothing
  if (!isSupportedSite() && !settings.forceDetect) {
    removeColorization(document.body);
    return;
  }

  // Find code editor containers on the page
  const codeContainers = document.querySelectorAll(CODE_CONTAINER_SELECTOR);
  codeContainers.forEach((container) => {
    processContainer(container as HTMLElement);
  });
}

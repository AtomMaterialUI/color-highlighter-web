import type { ColorMatch } from "./colorDetector";
import { getContrastColor } from "./colorUtils";

import { getSelectorsForCurrentSite } from "./selectors";

/**
 * Registry of selectors for the current site
 */
const currentSelectors = getSelectorsForCurrentSite();

/**
 * Tags to skip during colorization
 */
export const SKIP_TAGS = [
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "META",
  "LINK",
  "TITLE",
  "HEAD",
  "INPUT",
];

/**
 * Selector for common code editor containers
 */
export const CODE_CONTAINER_SELECTOR = currentSelectors.codeContainers.join(", ");

/**
 * Selector for elements to skip (like line numbers)
 */
export const SKIP_SELECTOR = currentSelectors.skip.join(", ");

/**
 * Selector for main content areas
 */
export const MAIN_AREA_SELECTOR = currentSelectors.mainAreas.join(", ");

/**
 * Selector for navigation elements that trigger re-colorization
 */
export const NAV_SELECTOR = currentSelectors.navSelectors.join(", ");

/**
 * Class name for color span wrapper
 */
export const COLORIZE_CLASS = "github-colorize-span";
export const COLOR_SWATCH_CLASS = "github-colorize-swatch";

/**
 * Common code editor container selectors (Legacy export for compatibility)
 */
export const CODE_CONTAINER_SELECTORS = currentSelectors.codeContainers;

/**
 * Element selectors to skip (Legacy export for compatibility)
 */
export const SKIP_SELECTORS = currentSelectors.skip;

/**
 * Selectors for main content areas (Legacy export for compatibility)
 */
export const MAIN_AREA_SELECTORS = currentSelectors.mainAreas;

/**
 * Create a wrapper span for a color match with background color.
 * Supports partial matches for multi-node highlighting.
 */
export function createColorizedElement(
  colorMatch: ColorMatch,
  isFirstPart: boolean = true,
  isLastPart: boolean = true,
): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = COLORIZE_CLASS;
  wrapper.style.cssText = `
    display: contents;
  `;

  // Create the color text span
  const textSpan = document.createElement("span");
  textSpan.textContent = colorMatch.text;
  textSpan.title = `Color: ${colorMatch.hexColor} (${colorMatch.format})`;

  const contrastColor = getContrastColor(colorMatch.hexColor);

  textSpan.style.cssText = `
    background-color: ${colorMatch.hexColor};
    color: ${contrastColor};
    border-radius: ${isFirstPart ? "3px" : "0"} ${isLastPart ? "3px" : "0"} ${
    isLastPart ? "3px" : "0"
  } ${isFirstPart ? "3px" : "0"};
    padding: 0 ${isLastPart ? "3px" : "0"} 0 ${isFirstPart ? "3px" : "0"};
    margin: 0 ${isLastPart ? "1px" : "0"} 0 ${isFirstPart ? "1px" : "0"};
    font-weight: 500;
    cursor: pointer;
  `;

  // Copy hex to clipboard on click
  textSpan.addEventListener("click", (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(colorMatch.hexColor).catch(console.error);
  });

  wrapper.appendChild(textSpan);

  return wrapper;
}

/**
 * Check if a node is already colorized
 */
export function isAlreadyColorized(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    if (
      element.classList.contains(COLORIZE_CLASS) ||
      element.classList.contains(COLOR_SWATCH_CLASS)
    ) {
      return true;
    }
  }

  // Check if inside a colorized element
  const parentElement =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
  return !!(
    parentElement &&
    parentElement.closest(`.${COLORIZE_CLASS}, .${COLOR_SWATCH_CLASS}`)
  );
}

/**
 * Get the text content from a node safely
 */
export function getNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    // Skip script, style, and already colorized elements
    if (
      SKIP_TAGS.includes(element.tagName.toUpperCase()) ||
      element.classList.contains(COLORIZE_CLASS) ||
      element.classList.contains(COLOR_SWATCH_CLASS)
    ) {
      return "";
    }
  }

  return "";
}

/**
 * Check if we should process this element
 */
export function shouldProcessElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toUpperCase();

  // Skip these elements
  if (SKIP_TAGS.includes(tagName)) return false;

  // Skip elements that are already colorized
  if (
    element.classList.contains(COLORIZE_CLASS) ||
    element.classList.contains(COLOR_SWATCH_CLASS)
  ) {
    return false;
  }

  // Skip line numbers and other UI elements
  if (element.closest(SKIP_SELECTOR) !== null) return false;

  // Check if it's a code editor container or inside one
  return element.closest(CODE_CONTAINER_SELECTOR) !== null;
}

import type { ColorMatch } from "./colorDetector";

/**
 * Class name for color span wrapper
 */
export const COLORIZE_CLASS = "github-colorize-span";
export const COLOR_SWATCH_CLASS = "github-colorize-swatch";

/**
 * Create a color swatch element
 */
export function createColorSwatch(hex: string): HTMLElement {
  const swatch = document.createElement("span");
  swatch.className = COLOR_SWATCH_CLASS;
  swatch.title = hex;
  swatch.style.cssText = `
    display: inline-block;
    width: 1em;
    height: 1em;
    margin: 0 0.2em;
    border-radius: 2px;
    background-color: ${hex};
    border: 1px solid rgba(0, 0, 0, 0.2);
    vertical-align: middle;
    cursor: pointer;
    box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  `;

  // Copy hex to clipboard on click
  swatch.addEventListener("click", (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex).catch(console.error);
  });

  return swatch;
}

/**
 * Create a wrapper span for a color match with swatch
 */
export function createColorizedElement(colorMatch: ColorMatch): HTMLElement {
  const wrapper = document.createElement("span");
  wrapper.className = COLORIZE_CLASS;
  wrapper.style.cssText = `
    position: relative;
    display: inline;
  `;

  // Create the color text (unchanged)
  const textSpan = document.createElement("span");
  textSpan.textContent = colorMatch.text;
  textSpan.title = `Color: ${colorMatch.hexColor} (${colorMatch.format})`;
  textSpan.style.borderBottom = `2px dotted ${colorMatch.hexColor}`;
  textSpan.style.cursor = "help";

  // Create swatch
  const swatch = createColorSwatch(colorMatch.hexColor);

  wrapper.appendChild(textSpan);
  wrapper.appendChild(swatch);

  return wrapper;
}

/**
 * Check if a node is already colorized
 */
export function isAlreadyColorized(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    if (element.classList.contains(COLORIZE_CLASS)) {
      return true;
    }
    if (element.classList.contains(COLOR_SWATCH_CLASS)) {
      return true;
    }
  }
  return false;
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
      element.tagName === "SCRIPT" ||
      element.tagName === "STYLE" ||
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
  const skipTags = ["SCRIPT", "STYLE", "NOSCRIPT", "META", "LINK", "TITLE"];
  if (skipTags.includes(tagName)) {
    return false;
  }

  // Skip elements that are already colorized
  if (
    element.classList.contains(COLORIZE_CLASS) ||
    element.classList.contains(COLOR_SWATCH_CLASS)
  ) {
    return false;
  }

  // Check common code editor containers
  const classListStr = String(element.className || "");
  const idStr = String(element.id || "");

  // GitHub code editor patterns
  if (
    classListStr.includes("blob-code") ||
    classListStr.includes("blob-wrapper") ||
    classListStr.includes("file-content") ||
    classListStr.includes("CodeMirror") ||
    classListStr.includes("ace_editor") ||
    classListStr.includes("monaco-editor") ||
    classListStr.includes("editor") ||
    idStr.includes("editor")
  ) {
    return true;
  }

  // GitLab patterns
  if (classListStr.includes("hljs") || classListStr.includes("file-content")) {
    return true;
  }

  return false;
}

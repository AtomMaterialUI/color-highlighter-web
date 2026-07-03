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
    display: contents;
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

  if (parentElement && parentElement.closest(`.${COLORIZE_CLASS}, .${COLOR_SWATCH_CLASS}`)) {
    return true;
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
 * Selector for common code editor containers
 */
export const CODE_CONTAINER_SELECTOR =
  ".blob-code, .blob-code-inner, .blob-wrapper, .file-content, .CodeMirror, .ace_editor, .monaco-editor, [id*='editor'], .hljs, .react-file-line-contents, .react-line-contents, .react-code-text, [data-testid='code-cell'], .highlight, .syntax-highlighted";

/**
 * Selector for elements to skip (like line numbers)
 */
export const SKIP_SELECTOR =
  ".blob-num, .js-line-number, .react-line-number, .line-numbers, .diff-line-num, [data-line-number], .line-number, .ln, .td-line-number, .js-file-line-number, .diff-line-num-prev, .diff-line-num-next, .blob-num-expandable";

/**
 * Check if we should process this element
 */
export function shouldProcessElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toUpperCase();

  // Skip these elements
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

  // Skip line numbers and other UI elements
  if (element.closest(SKIP_SELECTOR) !== null) {
    return false;
  }

  // Check if it's a code editor container or inside one
  return element.closest(CODE_CONTAINER_SELECTOR) !== null;
}

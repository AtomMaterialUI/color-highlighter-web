import { ColorMatch } from "./colorDetector";
import { getSelectorsForCurrentSite } from "./selectors";

export const GUTTER_ICON_CLASS = "github-colorize-gutter-icon";

/**
 * Find the gutter element (line number) for a given code container
 */
export function findGutterElement(container: HTMLElement): HTMLElement | null {
  const selectors = getSelectorsForCurrentSite();

  // Special handling for textareas (often in GitHub comments)
  if (container.tagName === "TEXTAREA") {
    if (selectors.commentBox?.length && selectors.commentHeader?.length) {
      const commentBox = container.closest(selectors.commentBox.join(", "));
      if (commentBox) {
        const header = commentBox.querySelector(
          selectors.commentHeader.join(", "),
        );

        if (header) {
          return header as HTMLElement;
        }
      }
    }

    return container.parentElement;
  }

  // 1. Try to find gutter via row-based lookup
  if (selectors.gutterRow?.length && selectors.gutters?.length) {
    const row = container.closest(selectors.gutterRow.join(", "));
    if (row) {
      const gutter = row.querySelector(selectors.gutters.join(", "));
      if (gutter && gutter !== container) {
        return gutter as HTMLElement;
      }
    }
  }

  // 2. Generic fallback: check siblings for anything that looks like a gutter
  const parent = container.parentElement;
  if (parent) {
    const sibling = Array.from(parent.children).find(
      (c) =>
        c !== container &&
        (c.classList.contains("line-number") ||
          /ln|line-num|gutter/i.test(c.className)),
    );
    if (sibling) {
      return sibling as HTMLElement;
    }
  }

  return null;
}

/**
 * Create a gutter icon element
 */
export function createGutterIcon(
  hexColor: string,
  isTextarea: boolean = false,
): HTMLElement {
  const icon = document.createElement("span");
  icon.className = GUTTER_ICON_CLASS;
  if (isTextarea) {
    icon.classList.add("is-textarea");
  }
  icon.title = `Click to copy: ${hexColor}`;

  // Base styles (some moved to CSS)
  icon.style.backgroundColor = hexColor;

  // Click to copy
  icon.addEventListener("click", (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hexColor).catch(console.error);

    // Visual feedback
    const originalTitle = icon.title;
    icon.title = "Copied!";
    setTimeout(() => {
      icon.title = originalTitle;
    }, 1000);
  });

  return icon;
}

/**
 * Update the gutter icon for a container based on detected colors
 */
export function updateGutterIcon(
  container: HTMLElement,
  matches: ColorMatch[],
): void {
  const gutter = findGutterElement(container);
  if (!gutter) return;

  if (matches.length === 0) {
    // Remove icon if no colors anymore (e.g. user deleted text)
    const existing = gutter.querySelector(`.${GUTTER_ICON_CLASS}`);
    if (existing) existing.remove();
    return;
  }

  const selectors = getSelectorsForCurrentSite();

  // Get the last color
  const lastMatch = matches[matches.length - 1];

  // Check if icon already exists
  let icon = gutter.querySelector(`.${GUTTER_ICON_CLASS}`) as HTMLElement;

  if (icon) {
    icon.style.backgroundColor = lastMatch.hexColor;
    icon.title = `Click to copy: ${lastMatch.hexColor}`;
  } else {
    icon = createGutterIcon(
      lastMatch.hexColor,
      container.tagName === "TEXTAREA",
    );

    // For textarea parents that are not headers, ensure they are relative
    if (
      container.tagName === "TEXTAREA" &&
      getComputedStyle(gutter).position === "static"
    ) {
      // Check if it's NOT a header
      const isHeader = selectors.commentHeader?.some(
        (h) => gutter.matches(h) || gutter.closest(h) === gutter,
      );

      if (!isHeader) {
        gutter.style.position = "relative";
      }
    }

    gutter.appendChild(icon);
  }
}

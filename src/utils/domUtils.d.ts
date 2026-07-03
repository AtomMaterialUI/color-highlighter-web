import type { ColorMatch } from "./colorDetector";
/**
 * Class name for color span wrapper
 */
export declare const COLORIZE_CLASS = "github-colorize-span";
export declare const COLOR_SWATCH_CLASS = "github-colorize-swatch";
/**
 * Create a color swatch element
 */
export declare function createColorSwatch(hex: string): HTMLElement;
/**
 * Create a wrapper span for a color match with swatch
 */
export declare function createColorizedElement(colorMatch: ColorMatch): HTMLElement;
/**
 * Check if a node is already colorized
 */
export declare function isAlreadyColorized(node: Node): boolean;
/**
 * Get the text content from a node safely
 */
export declare function getNodeText(node: Node): string;
/**
 * Check if we should process this element
 */
export declare function shouldProcessElement(element: HTMLElement): boolean;
//# sourceMappingURL=domUtils.d.ts.map
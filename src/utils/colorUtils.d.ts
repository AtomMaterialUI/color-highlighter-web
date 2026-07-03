/**
 * Represents a color in different formats
 */
export interface Color {
    hex: string;
    rgb: string;
    hsl: string;
    name?: string;
}
/**
 * Convert a hex color to RGB
 */
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
} | null;
/**
 * Convert RGB to Hex
 */
export declare function rgbToHex(r: number, g: number, b: number): string;
/**
 * Get the luminance of a color (for determining contrast)
 */
export declare function getLuminance(hex: string): number;
/**
 * Determine if text should be light or dark based on background color
 */
export declare function shouldUseLightText(hex: string): boolean;
/**
 * Get a contrasting color (black or white) for text
 */
export declare function getContrastColor(hex: string): string;
/**
 * Validate if a string is a valid color
 */
export declare function isValidColor(colorString: string): boolean;
/**
 * Parse and normalize a color string to hex
 */
export declare function normalizeColor(colorString: string): string | null;
/**
 * Get color information
 */
export declare function getColorInfo(hex: string): Color;
//# sourceMappingURL=colorUtils.d.ts.map
/**
 * Represents a detected color with its value and format
 */
export interface ColorMatch {
    text: string;
    hexColor: string;
    startIndex: number;
    endIndex: number;
    format: "hex" | "rgb" | "rgba" | "hsl" | "hsla" | "named";
}
/**
 * Detect all color codes/names in a given text
 */
export declare function detectColors(text: string): ColorMatch[];
/**
 * Check if a given text position is part of a color match
 */
export declare function isColorMatch(text: string, position: number): ColorMatch | null;
//# sourceMappingURL=colorDetector.d.ts.map
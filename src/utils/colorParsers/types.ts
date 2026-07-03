import chroma from "chroma-js";
import PREDEFINED_COLORS from "../../resources/colors.json";

export const NAMED_COLORS = PREDEFINED_COLORS as Record<string, string>;

export interface ColorMatch {
  text: string;
  hexColor: string;
  startIndex: number;
  endIndex: number;
  format: string;
}

export interface IColorParser {
  id: string;
  getMatches(text: string): ColorMatch[];
}

/**
 * Try to parse a color string and return its hex representation
 */
export function tryParseColor(colorString: string): string | null {
  const namedHex = getNamedColor(colorString);
  if (namedHex) {
    return namedHex;
  }

  try {
    const color = chroma(colorString);
    return color.hex();
  } catch {
    return null;
  }
}

/**
 * Safely check if a color name exists in our predefined list
 */
export function getNamedColor(name: string): string | undefined {
  const normalized = name.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(NAMED_COLORS, normalized)) {
    return NAMED_COLORS[normalized];
  }
  return undefined;
}

import chroma from "chroma-js";
import PREDEFINED_COLORS from "../resources/colors.json";

/**
 * List of CSS named colors that we recognize
 */
const NAMED_COLORS = PREDEFINED_COLORS as Record<string, string>;

/**
 * Regex patterns for color detection
 */
const COLOR_PATTERNS = {
  // Hex colors: #fff, #ffffff, #ffff, #ffffffff
  // We allow optional # prefix to support bare hex as requested by the user.
  // We restrict lengths to 3, 4, 6, 8 as these are valid CSS hex colors.
  hex: /#?\b([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/gi,

  // RGB/RGBA: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
  rgb: /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi,

  // HSL/HSLA: hsl(0, 100%, 50%), hsla(0, 100%, 50%, 0.5)
  hsl: /hsla?\s*\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/gi,

  // Named colors (will be matched separately)
  named: /\b([a-z]+)\b/gi,
};

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
 * Try to parse a color string and return its hex representation
 */
function tryParseColor(colorString: string): string | null {
  const normalized = colorString.toLowerCase();
  if (NAMED_COLORS[normalized]) {
    return NAMED_COLORS[normalized];
  }

  try {
    // Try using chroma-js to parse
    const color = chroma(colorString);
    return color.hex();
  } catch {
    // Continue to next check
  }
  return null;
}

/**
 * Detect all color codes/names in a given text
 */
export function detectColors(text: string): ColorMatch[] {
  const matches: ColorMatch[] = [];
  const seenMatches = new Set<string>(); // Avoid duplicates

  // Check hex colors
  let match: RegExpExecArray | null;
  COLOR_PATTERNS.hex.lastIndex = 0;
  while ((match = COLOR_PATTERNS.hex.exec(text)) !== null) {
    const fullMatch = match[0];
    const isBare = !fullMatch.startsWith("#");
    const hexValue = isBare ? fullMatch : fullMatch.substring(1);

    // If it's a bare 3 or 4 digit hex, it MUST contain at least one letter
    // to avoid matching line numbers like 123
    if (isBare && hexValue.length <= 4 && /^\d+$/.test(hexValue)) {
      continue;
    }

    const hex = tryParseColor(fullMatch);
    if (
      hex &&
      !seenMatches.has(`${match.index}-${COLOR_PATTERNS.hex.lastIndex}`)
    ) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.hex.lastIndex,
        format: "hex",
      });
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.hex.lastIndex}`);
    }
  }

  // Check RGB/RGBA
  COLOR_PATTERNS.rgb.lastIndex = 0;
  while ((match = COLOR_PATTERNS.rgb.exec(text)) !== null) {
    const fullMatch = match[0];
    const hex = tryParseColor(fullMatch);
    if (
      hex &&
      !seenMatches.has(`${match.index}-${COLOR_PATTERNS.rgb.lastIndex}`)
    ) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.rgb.lastIndex,
        format: match[0].toLowerCase().startsWith("rgba") ? "rgba" : "rgb",
      });
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.rgb.lastIndex}`);
    }
  }

  // Check HSL/HSLA
  COLOR_PATTERNS.hsl.lastIndex = 0;
  while ((match = COLOR_PATTERNS.hsl.exec(text)) !== null) {
    const fullMatch = match[0];
    const hex = tryParseColor(fullMatch);
    if (
      hex &&
      !seenMatches.has(`${match.index}-${COLOR_PATTERNS.hsl.lastIndex}`)
    ) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.hsl.lastIndex,
        format: match[0].toLowerCase().startsWith("hsla") ? "hsla" : "hsl",
      });
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.hsl.lastIndex}`);
    }
  }

  // Check named colors (be careful to only match complete words in reasonable contexts)
  // We'll be conservative here - only match known color names
  const words = text.matchAll(/\b([a-z_]+)\b/gi);
  for (const wordMatch of words) {
    const word = wordMatch[0].toLowerCase();
    if (
      word in NAMED_COLORS &&
      !seenMatches.has(
        `${wordMatch.index}-${wordMatch.index + wordMatch[0].length}`,
      )
    ) {
      const hex = NAMED_COLORS[word];
      if (hex) {
        matches.push({
          text: wordMatch[0],
          hexColor: hex,
          startIndex: wordMatch.index,
          endIndex: wordMatch.index + wordMatch[0].length,
          format: "named",
        });
        seenMatches.add(
          `${wordMatch.index}-${wordMatch.index + wordMatch[0].length}`,
        );
      }
    }
  }

  // Sort by position
  return matches.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Check if a given text position is part of a color match
 */
export function isColorMatch(
  text: string,
  position: number,
): ColorMatch | null {
  const colors = detectColors(text);
  return (
    colors.find((c) => position >= c.startIndex && position <= c.endIndex) ||
    null
  );
}

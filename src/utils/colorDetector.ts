import { ColorMatch, COLOR_PARSERS } from "./colorParsers";

export { ColorMatch };

/**
 * Detect all color codes/names in a given text
 */
export function detectColors(text: string): ColorMatch[] {
  const allMatches: ColorMatch[] = [];

  for (const parser of COLOR_PARSERS) {
    try {
      const matches = parser.getMatches(text);
      allMatches.push(...matches);
    } catch (error) {
      console.error(`Error in parser ${parser.id}:`, error);
    }
  }

  // Sort by start index, and then by length (longer first) for same start index
  const sortedMatches = allMatches.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return b.endIndex - b.startIndex - (a.endIndex - a.startIndex);
  });

  const matches: ColorMatch[] = [];
  let lastEnd = 0;

  for (const match of sortedMatches) {
    // Only add if it doesn't overlap with the previous match
    if (match.startIndex >= lastEnd) {
      matches.push(match);
      lastEnd = match.endIndex;
    }
  }

  return matches;
}

/**
 * Check if a given text position is part of a color match
 */
export function isColorMatch(text: string, position: number): ColorMatch | null {
  const colors = detectColors(text);
  return colors.find((c) => position >= c.startIndex && position < c.endIndex) || null;
}

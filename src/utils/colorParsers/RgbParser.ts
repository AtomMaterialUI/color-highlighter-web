import { IColorParser, ColorMatch } from "./types";
import { normalizeAlpha, tryParseColor } from "./utils";

export class RgbParser implements IColorParser {
  id = "rgb";
  private pattern = /a?rgba?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*(?:[,\s]\s*([\d.]+)\s*)?\)/gi;

  getFormat(fullMatch: string): string {
    switch (true) {
      case fullMatch.toLowerCase().startsWith("rgba"):
        return "rgba";
      case fullMatch.toLowerCase().startsWith("argb"):
        return "argb";
      case fullMatch.toLowerCase().startsWith("rgb"):
        return "rgb";
      default:
        return "unknown";
    }
  }

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const format = this.getFormat(fullMatch);

      let colorString = fullMatch;
      if (format === "argb" && match[4] !== undefined) {
        colorString = this.parseArgb(match);
      }

      const hex = tryParseColor(colorString);
      if (hex) {
        matches.push({
          text: fullMatch,
          hexColor: hex,
          startIndex: match.index,
          endIndex: this.pattern.lastIndex,
          format: format,
        });
      }
    }
    return matches;
  }

  private parseArgb(match: RegExpExecArray) {
    // argb(a, r, g, b) -> rgba(r, g, b, a/255)
    const [, a, r, g, b] = match;
    const alpha = normalizeAlpha(a);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

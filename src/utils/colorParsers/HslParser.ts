import { IColorParser, ColorMatch, tryParseColor } from "./types";

export class HslParser implements IColorParser {
  id = "hsl";
  private pattern =
    /hsla?\s*\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/gi;

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const hex = tryParseColor(fullMatch);
      if (hex) {
        matches.push({
          text: fullMatch,
          hexColor: hex,
          startIndex: match.index,
          endIndex: this.pattern.lastIndex,
          format: fullMatch.toLowerCase().startsWith("hsla") ? "hsla" : "hsl",
        });
      }
    }
    return matches;
  }
}

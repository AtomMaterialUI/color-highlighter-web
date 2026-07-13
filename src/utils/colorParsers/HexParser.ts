import { tryParseColor } from "~utils/colorParsers/utils";
import { IColorParser, ColorMatch } from "./types";

export class HexParser implements IColorParser {
  id = "hex";
  private pattern = /#?\b([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/gi;

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const isBare = !fullMatch.startsWith("#");
      const hexValue = isBare ? fullMatch : fullMatch.substring(1);

      // If it's a bare hex, it must be 6 or 8 characters long
      // 3 or 4 character hex codes MUST have a # prefix
      if (isBare && (hexValue.length === 3 || hexValue.length === 4)) {
        continue;
      }

      const hex = tryParseColor(fullMatch);
      if (hex) {
        matches.push({
          text: fullMatch,
          hexColor: hex,
          startIndex: match.index,
          endIndex: this.pattern.lastIndex,
          format: "hex",
        });
      }
    }
    return matches;
  }
}

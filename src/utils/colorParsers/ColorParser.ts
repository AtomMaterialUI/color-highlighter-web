import { IColorParser, ColorMatch, tryParseColor } from "./types";
import { normalizeAlpha, parseSingleArg } from "./utils";

/**
 * Matches patterns like Color(r, g, b), new Color(r, g, b, a), Color(hex)
 */
export class ColorParser implements IColorParser {
  id = "color-constructor";
  private pattern = /\b(?:new\s+)?Color\s*\(([^)]+)\)/gi;

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const args = match[1].split(",").map((s) => s.trim());

      let colorString = "";

      switch (args.length) {
        case 4: {
          // Java/Kotlin/RGBA: new Color(r, g, b, a)
          const [r, g, b, a] = args;
          const alpha = normalizeAlpha(a);
          colorString = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          break;
        }
        case 3: // RGB: Color(r, g, b)
          colorString = `rgb(${args[0]}, ${args[1]}, ${args[2]})`;
          break;
        case 1: // Hex/Int/Named: Color(0xFF0000), Color(16711680), Color(RED)
          colorString = parseSingleArg(args[0]);
          break;
      }

      if (colorString) {
        const hex = tryParseColor(colorString);
        if (hex) {
          matches.push({
            text: fullMatch,
            hexColor: hex,
            startIndex: match.index,
            endIndex: this.pattern.lastIndex,
            format: "constructor",
          });
        }
      }
    }
    return matches;
  }
}

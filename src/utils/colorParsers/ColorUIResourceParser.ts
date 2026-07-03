import { IColorParser, ColorMatch, tryParseColor } from "./types";
import { normalizeAlpha, parseSingleArg } from "./utils";

/**
 * Matches patterns like ColorUIResource(r, g, b), new ColorUIResource(color)
 */
export class ColorUIResourceParser implements IColorParser {
  id = "color-ui-resource";
  private pattern = /\b(?:new\s+)?ColorUIResource\s*\(([^)]+)\)/gi;

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const args = match[1].split(",").map((s) => s.trim());

      let colorString = "";

      if (args.length === 4) {
        // RGBA
        const [r, g, b, a] = args;
        const alpha = normalizeAlpha(a);
        colorString = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (args.length === 3) {
        // RGB
        colorString = `rgb(${args[0]}, ${args[1]}, ${args[2]})`;
      } else if (args.length === 1) {
        // Single arg: hex, int, or Color object reference
        colorString = parseSingleArg(args[0]);
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

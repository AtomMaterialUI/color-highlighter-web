import { IColorParser, ColorMatch, tryParseColor } from "./types";
import { normalizeAlpha } from "./utils";

/**
 * Matches patterns like Color.FromArgb(a, r, g, b), Color.FromRgb(r, g, b), Color.FromHsl(h, s, l)
 */
export class FromMethodParser implements IColorParser {
  id = "from-method";
  private pattern = /\bColor\.(FromArgb|FromRgb|FromHsl)\s*\(([^)]+)\)/gi;

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    let match: RegExpExecArray | null;
    this.pattern.lastIndex = 0;

    while ((match = this.pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const methodName = match[1].toLowerCase();
      const args = match[2].split(",").map((s) => s.trim());

      let colorString = "";

      if (methodName === "fromargb" && args.length === 4) {
        // Color.FromArgb(a, r, g, b) -> rgba(r, g, b, a/255)
        const [a, r, g, b] = args;
        const alpha = normalizeAlpha(a);
        colorString = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      } else if (methodName === "fromrgb" && args.length === 3) {
        colorString = `rgb(${args[0]}, ${args[1]}, ${args[2]})`;
      } else if (methodName === "fromhsl" && args.length === 3) {
        colorString = `hsl(${args[0]}, ${args[1]}%, ${args[2]}%)`;
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

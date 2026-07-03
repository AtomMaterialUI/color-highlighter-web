import { IColorParser, ColorMatch, getNamedColor } from "./types";

export class NamedParser implements IColorParser {
  id = "named";

  getMatches(text: string): ColorMatch[] {
    const matches: ColorMatch[] = [];
    const words = text.matchAll(/\b([a-z_]+)\b/gi);
    
    for (const wordMatch of words) {
      const word = wordMatch[0];
      const hex = getNamedColor(word);
      if (hex) {
        matches.push({
          text: word,
          hexColor: hex,
          startIndex: wordMatch.index!,
          endIndex: wordMatch.index! + word.length,
          format: "named",
        });
      }
    }
    return matches;
  }
}

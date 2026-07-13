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

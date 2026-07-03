import { IColorParser } from "./types";
import { HexParser } from "./HexParser";
import { RgbParser } from "./RgbParser";
import { HslParser } from "./HslParser";
import { NamedParser } from "./NamedParser";
import { ColorParser } from "./ColorParser";
import { ColorUIResourceParser } from "./ColorUIResourceParser";
import { FromMethodParser } from "./FromMethodParser";

export * from "./types";
export * from "./HexParser";
export * from "./RgbParser";
export * from "./HslParser";
export * from "./NamedParser";
export * from "./ColorParser";
export * from "./ColorUIResourceParser";
export * from "./FromMethodParser";

/**
 * Registry of all available color parsers
 */
export const COLOR_PARSERS: IColorParser[] = [
  new HexParser(),
  new RgbParser(),
  new HslParser(),
  new ColorParser(),
  new ColorUIResourceParser(),
  new FromMethodParser(),
  new NamedParser(),
];

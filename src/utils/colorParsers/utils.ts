import chroma from "chroma-js";

/**
 * Normalizes alpha value from string.
 * Handles both 0-1 (normalized) and 0-255 (Java style) values.
 */
export function normalizeAlpha(a: string): string {
  const val = parseFloat(a);
  if (isNaN(val)) return "1";
  // If it's an integer > 1, assume it's 0-255 (Java style)
  if (val > 1 && !a.includes(".")) {
    return (val / 255).toFixed(2);
  }
  return val.toString();
}

/**
 * Parses a single argument constructor/method (e.g. hex, integer, or named color)
 */
export function parseSingleArg(arg: string): string {
  // Strip "Color." prefix if present (e.g. ColorUIResource(Color.RED))
  const cleanArg = arg.replace(/^Color\./i, "");

  // Handle 0x prefix (Hex literal)
  if (cleanArg.startsWith("0x")) {
    return "#" + cleanArg.substring(2);
  }

  // Handle decimal numbers (e.g. 16711680)
  if (/^\d+$/.test(cleanArg)) {
    try {
      const color = chroma(parseInt(cleanArg));
      return color.hex();
    } catch {
      return cleanArg;
    }
  }

  return cleanArg;
}

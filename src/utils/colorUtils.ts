import chroma from "chroma-js"

/**
 * Represents a color in different formats
 */
export interface Color {
  hex: string
  rgb: string
  hsl: string
  name?: string
}

/**
 * Convert a hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

/**
 * Convert RGB to Hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Get the luminance of a color (for determining contrast)
 */
export function getLuminance(hex: string): number {
  const color = chroma(hex)
  return color.luminance()
}

/**
 * Determine if text should be light or dark based on background color
 */
export function shouldUseLightText(hex: string): boolean {
  return getLuminance(hex) < 0.5
}

/**
 * Get a contrasting color (black or white) for text
 */
export function getContrastColor(hex: string): string {
  return shouldUseLightText(hex) ? "#ffffff" : "#000000"
}

/**
 * Validate if a string is a valid color
 */
export function isValidColor(colorString: string): boolean {
  try {
    chroma(colorString)
    return true
  } catch {
    return false
  }
}

/**
 * Parse and normalize a color string to hex
 */
export function normalizeColor(colorString: string): string | null {
  try {
    const color = chroma(colorString)
    return color.hex()
  } catch {
    return null
  }
}

/**
 * Get color information
 */
export function getColorInfo(hex: string): Color {
  const color = chroma(hex)
  const rgb = color.rgb()
  const hsl = color.hsl()

  return {
    hex: hex,
    rgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    hsl: `hsl(${Math.round(hsl[0])}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%)`
  }
}

import chroma from "chroma-js"

/**
 * List of CSS named colors that we recognize
 */
const NAMED_COLORS = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque",
  "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue",
  "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson",
  "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgrey",
  "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange",
  "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue",
  "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink",
  "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite",
  "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "grey", "green", "greenyellow", "honeydew", "hotpink", "indianred",
  "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen",
  "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgrey", "lightgreen", "lightpink",
  "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray",
  "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen",
  "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid",
  "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen",
  "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream",
  "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive",
  "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen",
  "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink",
  "plum", "powderblue", "purple", "rebeccapurple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell",
  "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
  "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
  "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen",
  "transparent"
])

/**
 * Regex patterns for color detection
 */
const COLOR_PATTERNS = {
  // Hex colors: #fff, #ffffff, #ffff, #ffffffff
  // Match hex codes followed by non-hex characters or end of string
  hex: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g,

  // Bare hex codes (6 or 8 digits) in attributes or specific contexts
  // Must not be preceded by a word character and followed by non-hex
  bareHex: /(?:code="|value="|:#|=)([0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g,

  // RGB/RGBA: rgb(255, 255, 255), rgba(255, 255, 255, 0.5)
  rgb: /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi,

  // HSL/HSLA: hsl(0, 100%, 50%), hsla(0, 100%, 50%, 0.5)
  hsl: /hsla?\s*\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/gi,

  // Named colors (will be matched separately)
  named: /\b([a-z]+)\b/gi
}

/**
 * Represents a detected color with its value and format
 */
export interface ColorMatch {
  text: string
  hexColor: string
  startIndex: number
  endIndex: number
  format: "hex" | "rgb" | "rgba" | "hsl" | "hsla" | "named"
}

/**
 * Try to parse a color string and return its hex representation
 */
function tryParseColor(colorString: string): string | null {
  try {
    // Try using chroma-js to parse
    const color = chroma(colorString)
    return color.hex()
  } catch {
    // Continue to next check
  }
  return null
}

/**
 * Detect all color codes/names in a given text
 */
export function detectColors(text: string): ColorMatch[] {
  const matches: ColorMatch[] = []
  const seenMatches = new Set<string>() // Avoid duplicates

  // Check hex colors
  let match: RegExpExecArray | null
  COLOR_PATTERNS.hex.lastIndex = 0
  while ((match = COLOR_PATTERNS.hex.exec(text)) !== null) {
    const fullMatch = match[0]
    const hex = tryParseColor(fullMatch)
    if (hex && !seenMatches.has(`${match.index}-${COLOR_PATTERNS.hex.lastIndex}`)) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.hex.lastIndex,
        format: "hex"
      })
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.hex.lastIndex}`)
    }
  }

  // Check bare hex codes (6 or 8 digit hex without # prefix)
  // This catches patterns like code="e74c3c" or value="ffffff"
  const bareHexPattern = /(?:^|[^0-9a-fA-F])([0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-fA-F])/g
  let bareMatch: RegExpExecArray | null
  bareHexPattern.lastIndex = 0
  while ((bareMatch = bareHexPattern.exec(text)) !== null) {
    const hexValue = bareMatch[1]
    const hex = tryParseColor(`#${hexValue}`)
    const startPos = bareMatch.index + bareMatch[0].indexOf(hexValue)
    const endPos = startPos + hexValue.length
    
    if (hex && !seenMatches.has(`${startPos}-${endPos}`)) {
      matches.push({
        text: hexValue,
        hexColor: hex,
        startIndex: startPos,
        endIndex: endPos,
        format: "hex"
      })
      seenMatches.add(`${startPos}-${endPos}`)
    }
  }

  // Check RGB/RGBA
  COLOR_PATTERNS.rgb.lastIndex = 0
  while ((match = COLOR_PATTERNS.rgb.exec(text)) !== null) {
    const fullMatch = match[0]
    const hex = tryParseColor(fullMatch)
    if (hex && !seenMatches.has(`${match.index}-${COLOR_PATTERNS.rgb.lastIndex}`)) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.rgb.lastIndex,
        format: match[0].toLowerCase().startsWith("rgba") ? "rgba" : "rgb"
      })
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.rgb.lastIndex}`)
    }
  }

  // Check HSL/HSLA
  COLOR_PATTERNS.hsl.lastIndex = 0
  while ((match = COLOR_PATTERNS.hsl.exec(text)) !== null) {
    const fullMatch = match[0]
    const hex = tryParseColor(fullMatch)
    if (hex && !seenMatches.has(`${match.index}-${COLOR_PATTERNS.hsl.lastIndex}`)) {
      matches.push({
        text: fullMatch,
        hexColor: hex,
        startIndex: match.index,
        endIndex: COLOR_PATTERNS.hsl.lastIndex,
        format: match[0].toLowerCase().startsWith("hsla") ? "hsla" : "hsl"
      })
      seenMatches.add(`${match.index}-${COLOR_PATTERNS.hsl.lastIndex}`)
    }
  }

  // Check named colors (be careful to only match complete words in reasonable contexts)
  // We'll be conservative here - only match known color names
  const words = text.matchAll(/\b([a-z]+)\b/gi)
  for (const wordMatch of words) {
    const word = wordMatch[0].toLowerCase()
    if (NAMED_COLORS.has(word) && !seenMatches.has(`${wordMatch.index}-${wordMatch.index + wordMatch[0].length}`)) {
      const hex = tryParseColor(word)
      if (hex) {
        matches.push({
          text: wordMatch[0],
          hexColor: hex,
          startIndex: wordMatch.index,
          endIndex: wordMatch.index + wordMatch[0].length,
          format: "named"
        })
        seenMatches.add(`${wordMatch.index}-${wordMatch.index + wordMatch[0].length}`)
      }
    }
  }

  // Sort by position
  return matches.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * Check if a given text position is part of a color match
 */
export function isColorMatch(text: string, position: number): ColorMatch | null {
  const colors = detectColors(text)
  return colors.find(c => position >= c.startIndex && position <= c.endIndex) || null
}

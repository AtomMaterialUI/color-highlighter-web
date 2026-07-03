# GitHub Colorize - Project Summary

## Overview

GitHub Colorize is a Chrome Extension built with the Plasmo Framework that automatically detects and visualizes color codes in online code editors. The extension displays colored squares next to detected colors (hex, RGB, HSL, and named colors) and provides an intuitive interface for developers working with colors across GitHub, GitLab, and other platforms.

## Project Structure

```
github-colorize/
├── src/
│   ├── content.ts                 # Main content script injected into web pages
│   ├── utils/
│   │   ├── colorDetector.ts       # Color detection and regex patterns
│   │   ├── colorUtils.ts          # Color conversion utilities
│   │   ├── domUtils.ts            # DOM manipulation and styling
│   │   └── index.ts               # Barrel exports
│   └── styles/
│       └── global.css             # Extension styling
├── build/                          # Production build output
├── assets/                         # Icon assets
├── scripts/                        # Build and utility scripts
├── plasmo.config.ts                # Plasmo framework configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Project dependencies
├── README.md                       # Main documentation
├── SETUP_GUIDE.md                  # Installation instructions
├── build.sh                        # Build script
└── .prettierignore                 # Prettier configuration
```

## Key Components

### 1. Content Script (`src/content.ts`)
- Main entry point that runs on matching websites
- Processes DOM nodes to find and colorize color codes
- Sets up MutationObserver to handle dynamically added content
- Handles SPA navigation (pushState/replaceState)
- Debounces colorization for performance

### 2. Color Detection (`src/utils/colorDetector.ts`)
- **Detects multiple color formats:**
  - Hex: `#fff`, `#ffffff`, `#ffff`, `#ffffffff`
  - RGB/RGBA: `rgb(255, 255, 255)`, `rgba(255, 255, 255, 0.5)`
  - HSL/HSLA: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`
  - Named: 148 CSS color names (red, blue, transparent, etc.)
- Uses regex patterns for efficient matching
- Validates colors with chroma-js
- Prevents duplicate matches

### 3. DOM Utilities (`src/utils/domUtils.ts`)
- **Creates visual elements:**
  - Colored text with dotted underline
  - Small rounded color swatches
  - Hover effects and interactivity
- **Checks for:**
  - Already-colorized elements (avoids reprocessing)
  - Code editor containers
  - Safe nodes to process (skips scripts, styles, etc.)
- Click handler for copying hex codes to clipboard

### 4. Color Utilities (`src/utils/colorUtils.ts`)
- Hex ↔ RGB/HSL conversion
- Luminance calculation for contrast
- Color validation and normalization
- Comprehensive color information retrieval

### 5. Styling (`src/styles/global.css`)
- Inline styles for color swatches
- Hover effects and transitions
- Dark mode support
- Responsive sizing

## Technologies & Dependencies

### Runtime Dependencies
- **chroma-js** (v2.6.0): Color parsing and validation
- **polished** (v4.3.1): Color utility functions (prepared for future use)

### Development Dependencies
- **TypeScript** (v5.9.3): Type-safe development
- **Plasmo** (v0.90.5): Browser extension framework (used for config)
- **ESLint** (v8.57.1): Code quality
- **Prettier** (v3.9.4): Code formatting

## Build System

### Production Build
- **Method**: TypeScript compilation + manual bundling
- **Output**: `build/` directory containing:
  - `manifest.json`: Extension configuration
  - `content.js`: Main script with all utilities bundled
  - `styles/global.css`: Styling
  - `utils/*.js`: Compiled utility modules
  - TypeScript declaration files (.d.ts) for development

### Build Process
```bash
pnpm build  # Runs build.sh
  ├─ TypeScript compilation (src/ → build/)
  ├─ Manifest generation
  └─ Style copying
```

## Supported Platforms

The extension runs on these popular code editors and platforms:

| Platform | URL Pattern | Support |
|----------|-----------|---------|
| GitHub | `github.com/*` | ✅ Full |
| GitHub Codespaces | `*.github.dev/*` | ✅ Full |
| GitPod | `*.gitpod.io/*` | ✅ Full |
| GitLab | `gitlab.com/*` | ✅ Full |
| Gitee | `gitee.com/*` | ✅ Full |
| Bitbucket | `bitbucket.org/*` | ✅ Full |
| Azure DevOps | `dev.azure.com/*` | ✅ Full |

## Performance Optimization

1. **Selective Processing**: Only processes likely code editor elements
2. **MutationObserver**: Efficient DOM change detection
3. **Depth Limiting**: Prevents infinite recursion
4. **Skip Lists**: Avoids reprocessing decorated elements
5. **Text-only Matching**: Skips script and style tags

## Color Detection Logic

The extension uses a multi-stage approach:

1. **Regex Matching**: Fast pattern-based detection
2. **Validation**: chroma-js validates and normalizes colors
3. **Deduplication**: Prevents matching the same position twice
4. **Sorting**: Organizes matches by position for proper replacement

Example flow:
```
Raw text → Regex patterns → Color validation → Deduplication → Sorted results
   ↓            ↓                  ↓                ↓              ↓
"#ff00ff"   matches pattern   chroma validates   no duplicates   [ColorMatch]
"rgb(0,0,0)"   and extracts    and returns hex    checked         objects
"red"          captures         color value       for overlap     returned
```

## Extension Architecture

### Content Script Lifecycle

```
Page Load
   ↓
ContentScript Initializes
   ↓
Initial DOM Colorization
   ↓
MutationObserver Setup
   ↓
Listen for:
  ├─ DOM changes → Recolorize affected nodes
  ├─ Navigation (pushState) → Recolorize entire page
  └─ File clicks (GitHub) → Recolorize new content
```

### Color Processing Pipeline

```
Text Node Discovered
   ↓
detectColors(text) analyzes for patterns
   ↓
Match Found → Validate Color → Create Styled Element
   ↓
Replace Original Text with Fragment
   ├─ Original text before match
   ├─ Colorized span with swatch
   └─ Original text after match
```

## Key Design Decisions

1. **No Framework UI**: Uses vanilla JavaScript for maximum compatibility and minimal overhead
2. **Modular Architecture**: Separated concerns (detection, DOM, utils) for maintainability
3. **Minimal Dependencies**: Only chroma-js for color parsing (polished for future enhancement)
4. **Relative Imports**: Avoids module resolution issues in browser environment
5. **CSS Classes**: Enables styling and prevents reprocessing
6. **MutationObserver**: Watches for dynamic changes instead of polling
7. **TypeScript**: Type safety during development

## Testing Recommendations

1. **Manual Testing on Each Platform**:
   - Navigate to each supported platform
   - Create/edit files with various color formats
   - Verify colors are correctly detected and displayed

2. **Edge Cases**:
   - Very long files (>10,000 lines)
   - Nested color mentions
   - Mixed color formats
   - Light vs dark themes

3. **Performance**:
   - Large file handling
   - Rapid content changes (live updates)
   - Memory usage with extended browsing

## Future Enhancement Possibilities

- [ ] Settings page for customization
- [ ] Configurable color formats (e.g., show all format variations)
- [ ] Color picker popup
- [ ] Custom swatch styles and sizes
- [ ] Color palette integration
- [ ] Keyboard shortcuts
- [ ] Different detection patterns per language
- [ ] Export detected colors as palette
- [ ] Browser history-based color suggestions

## Development Workflow

```bash
# Setup
pnpm install

# Development (with hot reload)
pnpm dev

# Building
pnpm build

# Testing
# Manually load build/ in chrome://extensions

# Distribution
pnpm package  # Creates github-colorize.zip
```

## File Sizes (Production Build)

- `manifest.json`: ~1 KB
- `content.js`: ~5-6 KB (with dependencies bundled)
- `styles/global.css`: ~1 KB
- **Total**: ~7-8 KB (very efficient!)

## Privacy & Security

- ✅ No data collection
- ✅ No external API calls
- ✅ No tracking or analytics
- ✅ Runs entirely locally
- ✅ No account required
- ✅ Open source for verification

## Known Limitations

1. Large files (>10,000 lines) may show slight lag during initial colorization
2. Some complex nested structures might not be perfectly detected
3. Custom color functions (e.g., `getColor()`) are not detected
4. Only works on text-based editors (not visual builders)

## Maintenance Notes

- chroma-js is the only critical dependency for color parsing
- TypeScript configuration uses ES2022 for modern browser support
- Build process is intentionally simple (no webpack/parcel) for transparency
- Regular dependency updates recommended for security

---

**Project Created**: July 3, 2026
**Version**: 0.1.0
**Build System**: Native TypeScript + Custom Build Script
**Framework**: Plasmo-compatible (can be migrated to full Plasmo later)

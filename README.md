# GitHub Colorize

A Chrome Extension that colorizes color codes, RGB values, HSL values, and color names when editing files in online code editors.

## Features

- **Color Detection**: Automatically detects and colorizes:
  - Hex codes (#fff, #ffffff, #ffff, #ffffffff)
  - RGB/RGBA colors (rgb(255, 255, 255), rgba(255, 255, 255, 0.5))
  - HSL/HSLA colors (hsl(0, 100%, 50%), hsla(0, 100%, 50%, 0.5))
  - Named CSS colors (red, blue, transparent, etc.)

- **Visual Indicators**: Each detected color displays:
  - A colored square swatch next to the color code
  - A dotted underline in the detected color for easy identification

- **Interactive**: Click on color swatches to copy the hex code to your clipboard

- **Supported Platforms**:
  - GitHub (github.com)
  - GitHub Codespaces
  - GitPod
  - GitLab (gitlab.com)
  - Gitee (gitee.com)
  - Bitbucket (bitbucket.org)
  - Azure DevOps (dev.azure.com)

## Installation

### From Source (Development)

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm build
   ```
4. Load in Chrome:
   - Open `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `build` directory from this project
   - The extension should now appear in your Extensions menu

### Development with Hot Reload

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Run in development mode:
   ```bash
   pnpm dev
   ```
3. Load the extension from the `.plasmo` directory instead of `build`

## Project Structure

```
src/
├── content.ts              # Main content script for colorization
├── utils/
│   ├── colorDetector.ts   # Color detection logic and regex patterns
│   ├── colorUtils.ts      # Color conversion and utility functions
│   ├── domUtils.ts        # DOM manipulation utilities
│   └── index.ts           # Exports
└── styles/
    └── global.css         # Extension styling
```

## How It Works

1. **Content Script**: Runs on code editor pages and processes text nodes
2. **Color Detection**: Uses regex patterns to find color codes and validates them with chroma-js
3. **DOM Manipulation**: Replaces detected color text with styled elements including visual swatches
4. **Mutation Observer**: Watches for dynamically added content and colorizes it in real-time
5. **SPA Support**: Handles single-page application navigation on GitHub

## Build Commands

- **Development**: `pnpm dev` - Builds and watches for changes
- **Production**: `pnpm build` - Creates optimized build in `build/` directory
- **Package**: `pnpm package` - Creates a ZIP file for distribution

## Configuration

The extension is configured to run on:
- All code editor pages on supported platforms
- Text editing contexts across various web-based code editors

You can modify `plasmo.config.ts` to add or remove host permissions for additional platforms.

## Performance Considerations

- **Lazy Processing**: Only processes elements that are likely code editors
- **Debounced Updates**: Uses MutationObserver to efficiently handle DOM changes
- **Depth Limiting**: Prevents deep recursion to protect performance
- **Skip Lists**: Avoids reprocessing already-colorized content

## Privacy

This extension:
- Works entirely locally in your browser
- Does not collect or send any data
- Does not have access to your actual code content beyond visual processing
- Does not require internet connection after installation

## Troubleshooting

### Colors not showing up
1. Ensure the extension is enabled in `chrome://extensions`
2. Try refreshing the page
3. Check that you're on a supported platform
4. Open the browser console (F12) to check for any errors

### Performance issues
1. Disable the extension if processing becomes slow
2. The extension is optimized for files up to ~10,000 lines
3. Try disabling on pages with very large code blocks

## Technologies Used

- **Plasmo Framework**: Build system for browser extensions (development)
- **TypeScript**: Type-safe development
- **chroma-js**: Advanced color manipulation and parsing
- **polished**: Utilities for working with colors

## Future Enhancements

- [ ] Color picker popup on click
- [ ] Configurable color formats
- [ ] Theme selector for swatch appearance
- [ ] Integration with color palettes
- [ ] Support for custom color formats
- [ ] Settings page for customization
- [ ] Different swatch styles and sizes
- [ ] Keyboard shortcuts for quick copy

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT

## Support

If you encounter any issues or have suggestions, please open an issue on GitHub or visit the GitHub Colorize repository.

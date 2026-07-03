# GitHub Colorize - Setup Guide

## Quick Start

### Step 1: Build the Extension

```bash
cd /Users/eliorboukhobza/WebstormProjects/github-colorize
pnpm install
pnpm build
```

### Step 2: Load in Chrome

1. **Open Chrome Extensions Page**
   - Type `chrome://extensions` in the address bar, or
   - Go to Menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Unpacked**
   - Click the "Load unpacked" button
   - Navigate to the `build` folder in this project
   - Select it and click "Select Folder"

4. **Verify Installation**
   - You should see "GitHub Colorize" listed in your extensions
   - A colorful icon should appear in your extensions menu

### Step 3: Test the Extension

1. **Go to GitHub**
   - Visit https://github.com
   - Navigate to any file with color codes (CSS, JSON, etc.)

2. **Look for Color Indicators**
   - Hex codes like `#ff5733` should show a colored square
   - RGB colors like `rgb(255, 87, 51)` should be colorized
   - Named colors like `red` or `blue` should be highlighted

3. **Interact with Colors**
   - Hover over a color swatch to see the hex value
   - Click on a color swatch to copy the hex code to clipboard

## Development Mode

To make changes and reload automatically:

```bash
pnpm dev
```

Then load the extension from the `.plasmo` directory instead of `build`.

## Supported Platforms

The extension works on:
- ✅ GitHub (github.com, github.dev)
- ✅ GitLab (gitlab.com)
- ✅ Gitee (gitee.com)
- ✅ Bitbucket (bitbucket.org)
- ✅ Azure DevOps (dev.azure.com)
- ✅ GitPod (gitpod.io)

## Troubleshooting

### Extension doesn't appear
- Make sure you selected the `build` folder, not the project root
- Try refreshing the page (Ctrl+R or Cmd+R)
- Check that Developer mode is enabled

### Colors not showing up
- Refresh the page
- Check the browser console for errors (F12)
- Try disabling and re-enabling the extension
- Ensure you're on a supported platform

### Performance issues
- Disable the extension on pages with very large code files
- The extension works best on files under 10,000 lines

## Uninstalling

1. Go to `chrome://extensions`
2. Find "GitHub Colorize"
3. Click the "Remove" button

## Need Help?

Check the main [README.md](./README.md) for more information or visit the repository for issues and support.

#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Compiling TypeScript..."
npx tsc

echo "📦 Creating build directory..."
mkdir -p build

echo "📄 Copying manifest..."
cat > build/manifest.json << 'MANIFEST'
{
  "manifest_version": 3,
  "name": "GitHub Colorize",
  "version": "0.1.0",
  "description": "Colorize hex codes, RGB, HSL, and color names in online code editors",
  "author": "Your Name",
  "permissions": ["scripting"],
  "host_permissions": [
    "https://github.com/*",
    "https://gitlab.com/*",
    "https://gitee.com/*",
    "https://bitbucket.org/*",
    "https://dev.azure.com/*",
    "https://*.github.dev/*",
    "https://*.gitpod.io/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "https://github.com/*",
        "https://gitlab.com/*",
        "https://gitee.com/*",
        "https://bitbucket.org/*",
        "https://dev.azure.com/*",
        "https://*.github.dev/*",
        "https://*.gitpod.io/*"
      ],
      "js": ["content.js"],
      "css": ["styles/global.css"]
    }
  ]
}
MANIFEST

echo "📋 Copying styles..."
mkdir -p build/styles
cp src/styles/global.css build/styles/

echo "✅ Build complete!"
ls -la build/

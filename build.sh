#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Building with Plasmo..."
npx plasmo build --target=chrome-mv3

echo "📦 Preparing final build directory..."
# We want to put the final bundled files in the build/ directory 
# to match the existing package.json expectations
TEMP_BUILD="build/chrome-mv3-prod"

if [ -d "$TEMP_BUILD" ]; then
    # Move files from Plasmo's prod build to the root of build/
    # First, move them to a temp location to avoid self-overwrite
    mkdir -p build_tmp
    cp -r "$TEMP_BUILD"/* build_tmp/
    
    # Clean up build directory but keep the folder structure
    rm -rf build/*
    
    # Move everything back to build/
    cp -r build_tmp/* build/
    rm -rf build_tmp
else
    echo "❌ Plasmo build failed to produce chrome-mv3-prod directory"
    exit 1
fi

echo "✅ Build complete!"
ls -la build/

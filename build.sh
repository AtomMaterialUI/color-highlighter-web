#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔨 Compiling TypeScript..."
npx tsc

echo "📦 Creating build directory..."
mkdir -p build

echo "📄 Copying manifest..."
cp manifest.json build/manifest.json

echo "📋 Copying styles..."
mkdir -p build/styles
cp src/styles/global.css build/styles/

echo "✅ Build complete!"
ls -la build/

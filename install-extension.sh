#!/bin/bash

# ScriptPilot Chrome Extension Setup Script
echo "🚀 ScriptPilot Extension Setup"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "apps/extension/dist/manifest.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Current directory: $(pwd)"
    echo "Expected structure: PROJECT_ROOT/apps/extension/dist/"
    exit 1
fi

# Get the absolute path to the dist directory
DIST_PATH="$(pwd)/apps/extension/dist"
echo "📁 Extension built at: $DIST_PATH"

# Check if Chrome is available
if command -v google-chrome >/dev/null 2>&1; then
    CHROME_CMD="google-chrome"
elif command -v chromium >/dev/null 2>&1; then
    CHROME_CMD="chromium"
elif command -v chrome >/dev/null 2>&1; then
    CHROME_CMD="chrome"
else
    echo "⚠️  Chrome/Chromium not found in PATH"
fi

echo ""
echo "🔧 Installation Steps:"
echo "1. Open Chrome and go to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this folder: $DIST_PATH"
echo ""

if [ ! -z "$CHROME_CMD" ]; then
    echo "🌐 Would you like to open Chrome Extensions page? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Opening Chrome Extensions page..."
        $CHROME_CMD --new-tab chrome://extensions/ 2>/dev/null &
    fi
fi

echo ""
echo "📝 Next Steps After Installation:"
echo "✅ Look for 'ScriptPilot' in your extensions list"
echo "✅ Click the ScriptPilot icon in your toolbar"
echo "✅ Test with the included test-script.user.js"
echo "✅ Visit https://example.com to see the test script work"
echo ""
echo "📖 For detailed instructions, see: INSTALLATION.md"
echo "🎯 Happy scripting with ScriptPilot! 🎉"

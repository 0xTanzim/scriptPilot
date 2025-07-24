# 🚀 ScriptPilot Chrome Extension Installation Guide

## Quick Installation Steps

### 1. Open Chrome Extensions Page

- Open Google Chrome
- Navigate to: `chrome://extensions/`
- Or: Click the three dots menu → More tools → Extensions

### 2. Enable Developer Mode

- Toggle the "Developer mode" switch in the top-right corner
- This allows loading unpacked extensions

### 3. Load the Extension

- Click the "Load unpacked" button
- Navigate to this folder: `/mnt/storage/project/extentions/scriptRuner/apps/extension/dist`
- Select the `dist` folder and click "Select Folder"

### 4. Verify Installation

After loading, you should see:

- ✅ **ScriptPilot** extension in your extensions list
- ✅ ScriptPilot icon in your Chrome toolbar
- ✅ Version: 0.1.0
- ✅ Description: "Advanced userscript manager with TypeScript support..."

## 🧪 Testing the Extension

### Test 1: Open Popup

- Click the ScriptPilot icon in your toolbar
- You should see the React-based popup interface

### Test 2: Check Developer Tools

- Go to any website (e.g., https://example.com)
- Open Developer Tools (F12)
- Look for a "ScriptPilot" tab in the DevTools
- This shows the custom DevTools panel

### Test 3: Check Background Script

- Go back to `chrome://extensions/`
- Find ScriptPilot extension
- Click "service worker" link to see background script logs
- Should show initialization messages

### Test 4: Content Script Injection

- Open any website
- Open Browser Console (F12 → Console)
- Look for "[ScriptPilot]" log messages
- This confirms content script is running

## 🎯 What Each Component Does

- **Background Service Worker**: Manages scripts, storage, and communication
- **Content Scripts**: Inject GM API and run userscripts on web pages
- **Popup Interface**: Main UI for managing your scripts
- **DevTools Panel**: Advanced debugging and development tools
- **Storage System**: Saves your scripts using Chrome Storage + IndexedDB
- **Plugin System**: Extensible architecture for additional features

## 🐛 Troubleshooting

### Extension Won't Load

- Make sure you selected the `dist` folder, not the parent directory
- Check that manifest.json exists in the selected folder
- Refresh the extensions page and try again

### No Popup Shows

- Right-click the extension icon → "Inspect popup"
- Check browser console for React/JavaScript errors
- Verify all assets loaded correctly

### Content Scripts Not Working

- Check the website URL matches the manifest permissions
- Open DevTools and look for console errors
- Verify the extension has necessary permissions

## 🔧 Development Mode

For development and testing:

1. Keep Developer mode enabled
2. Use "Reload" button after code changes
3. Check service worker logs for background script debugging
4. Use DevTools panel for userscript development

Ready to create and manage userscripts! 🎉

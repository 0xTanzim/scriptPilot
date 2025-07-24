/**
 * Injected script that runs in the page context
 * This provides the GM API and executes userscripts
 */

export {}; // Make this file a module so global augmentation is allowed

declare global {
  interface Window {
    SCRIPTPILOT_INJECTED?: boolean;
  }
}

// This script runs in the page context and provides the GM API
(() => {
  // Only inject once
  if (window.SCRIPTPILOT_INJECTED) {
    return;
  }
  window.SCRIPTPILOT_INJECTED = true;

  console.log('[ScriptPilot] Injected script loaded');

  // GM API implementation will be injected here by the content script
  // This file serves as a placeholder for web-accessible resources
})();

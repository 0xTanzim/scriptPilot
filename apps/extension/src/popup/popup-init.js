/**
 * Popup initialization script
 * Handles mode detection and styling
 */

// Detect mode and apply appropriate styles
function detectMode() {
  const isFullscreen =
    window.innerWidth > 500 || window.location.hash.includes('editor');
  document.body.className = isFullscreen ? 'fullscreen-mode' : 'popup-mode';
}

// Apply mode detection on load and resize
window.addEventListener('load', detectMode);
window.addEventListener('resize', detectMode);
window.addEventListener('hashchange', detectMode);

// Apply initial detection
detectMode();

/**
 * GM API Injection Script
 * This script runs in the page context to provide GM APIs to userscripts
 */
(function () {
  'use strict';

  // Prevent double injection
  if (window.GM && window.GM._scriptpilot) {
    return;
  }

  // GM API implementation for page context
  const GM_API = {
    setValue: async (key, value) => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'setValue', args: [key, value], requestId },
          })
        );
      });
    },

    getValue: async (key, defaultValue) => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: {
              method: 'getValue',
              args: [key, defaultValue],
              requestId,
            },
          })
        );
      });
    },

    deleteValue: async key => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'deleteValue', args: [key], requestId },
          })
        );
      });
    },

    listValues: async () => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'listValues', args: [], requestId },
          })
        );
      });
    },

    xmlHttpRequest: options => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'xmlHttpRequest', args: [options], requestId },
          })
        );
      });
    },

    addStyle: css => {
      const style = document.createElement('style');
      style.textContent = css;
      style.setAttribute('data-scriptpilot', 'true');
      (document.head || document.documentElement).appendChild(style);
      return style;
    },

    openInTab: (url, options) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      window.dispatchEvent(
        new CustomEvent('scriptpilot:gm-call', {
          detail: { method: 'openInTab', args: [url, options], requestId },
        })
      );
    },

    notification: (message, title) => {
      const requestId = Math.random().toString(36).substr(2, 9);
      window.dispatchEvent(
        new CustomEvent('scriptpilot:gm-call', {
          detail: { method: 'notification', args: [message, title], requestId },
        })
      );
    },

    setClipboard: async text => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'setClipboard', args: [text], requestId },
          })
        );
      });
    },

    getResourceText: async name => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'getResourceText', args: [name], requestId },
          })
        );
      });
    },

    getResourceURL: async name => {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substr(2, 9);
        const handler = event => {
          if (event.detail.requestId === requestId) {
            if (event.detail.error) {
              reject(new Error(event.detail.error));
            } else {
              resolve(event.detail.result);
            }
            window.removeEventListener('scriptpilot:gm-response', handler);
          }
        };

        window.addEventListener('scriptpilot:gm-response', handler);
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-call', {
            detail: { method: 'getResourceURL', args: [name], requestId },
          })
        );
      });
    },

    registerMenuCommand: (caption, func) => {
      const id = Math.random().toString(36).substr(2, 9);
      window.dispatchEvent(
        new CustomEvent('scriptpilot:gm-call', {
          detail: {
            method: 'registerMenuCommand',
            args: [caption, func],
            requestId: id,
          },
        })
      );
      return id;
    },

    unregisterMenuCommand: id => {
      window.dispatchEvent(
        new CustomEvent('scriptpilot:gm-call', {
          detail: { method: 'unregisterMenuCommand', args: [id] },
        })
      );
    },

    log: console.log.bind(console, '[UserScript]'),

    info: {
      script: {
        name: 'Unknown',
        version: '1.0.0',
      },
      version: '0.1.0',
      scriptHandler: 'ScriptPilot',
    },

    // Mark as ScriptPilot injection
    _scriptpilot: true,
  };

  // Legacy GM functions
  window.GM_setValue = GM_API.setValue;
  window.GM_getValue = GM_API.getValue;
  window.GM_deleteValue = GM_API.deleteValue;
  window.GM_listValues = GM_API.listValues;
  window.GM_xmlhttpRequest = GM_API.xmlHttpRequest;
  window.GM_addStyle = GM_API.addStyle;
  window.GM_openInTab = GM_API.openInTab;
  window.GM_notification = GM_API.notification;
  window.GM_setClipboard = GM_API.setClipboard;
  window.GM_getResourceText = GM_API.getResourceText;
  window.GM_getResourceURL = GM_API.getResourceURL;
  window.GM_registerMenuCommand = GM_API.registerMenuCommand;
  window.GM_unregisterMenuCommand = GM_API.unregisterMenuCommand;
  window.GM_log = GM_API.log;
  window.GM_info = GM_API.info;

  // Modern GM object
  window.GM = GM_API;

  console.log('[ScriptPilot] GM API injected successfully');

  // Listen for script execution requests
  window.addEventListener('scriptpilot:execute-script', event => {
    try {
      const { id, code, name } = event.detail;
      console.log(`[ScriptPilot] Executing script: ${name || id}`);

      // Create isolated execution context
      const script = document.createElement('script');
      script.textContent = `(function() { 'use strict'; ${code} })();`;
      (document.head || document.documentElement).appendChild(script);
      script.remove();

      console.log(`[ScriptPilot] Script executed successfully: ${name || id}`);
    } catch (error) {
      console.error('[ScriptPilot] Script execution error:', error);
    }
  });
})();

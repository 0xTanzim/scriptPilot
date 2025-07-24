/**
 * ScriptPilot Content Script
 * Handles script injection and communication with background service
 */
import type { ExtensionMessage, GMAPIContext } from '@scriptpilot/types';
import browser from 'webextension-polyfill';

class ContentScript {
  private injectedScripts: Set<string> = new Set();
  private gmApiContext: GMAPIContext;

  constructor() {
    this.gmApiContext = this.createGMAPIContext();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log(
        '[ScriptPilot] Content script initialized on:',
        window.location.href
      );

      // Inject GM API into page context
      this.injectGMAPI();

      // Listen for messages from background
      browser.runtime.onMessage.addListener(
        (
          message: unknown,
          sender: browser.Runtime.MessageSender,
          sendResponse: (response?: any) => void
        ) => {
          this.handleMessage(message as ExtensionMessage)
            .then(sendResponse)
            .catch(error => {
              console.error('[ScriptPilot] Message handling error:', error);
              sendResponse({ error: error.message });
            });
          return true; // Indicate async response
        }
      );

      // Request scripts for current page
      await this.requestScripts();

      // Monitor for dynamic script installations
      this.setupScriptDetection();
    } catch (error) {
      console.error(
        '[ScriptPilot] Content script initialization failed:',
        error
      );
    }
  }

  private createGMAPIContext(): GMAPIContext {
    return {
      setValue: async (key: string, value: any): Promise<void> => {
        return this.sendMessage({
          type: 'GM_SET_VALUE',
          data: { key, value },
        });
      },

      getValue: async (key: string, defaultValue?: any): Promise<any> => {
        return this.sendMessage({
          type: 'GM_GET_VALUE',
          data: { key, defaultValue },
        });
      },

      deleteValue: async (key: string): Promise<void> => {
        return this.sendMessage({
          type: 'GM_DELETE_VALUE',
          data: { key },
        });
      },

      listValues: async (): Promise<string[]> => {
        return this.sendMessage({
          type: 'GM_LIST_VALUES',
          data: {},
        });
      },

      xmlHttpRequest: async (options: any): Promise<any> => {
        return this.sendMessage({
          type: 'GM_XML_HTTP_REQUEST',
          data: options,
        });
      },

      openInTab: async (url: string, options?: any): Promise<void> => {
        return this.sendMessage({
          type: 'GM_OPEN_IN_TAB',
          data: { url, options },
        });
      },

      notification: async (message: string, title?: string): Promise<void> => {
        return this.sendMessage({
          type: 'GM_NOTIFICATION',
          data: { message, title },
        });
      },

      setClipboard: async (text: string): Promise<void> => {
        return this.sendMessage({
          type: 'GM_SET_CLIPBOARD',
          data: { text },
        });
      },

      addStyle: (css: string): HTMLStyleElement => {
        const style = document.createElement('style');
        style.textContent = css;
        style.setAttribute('data-scriptpilot', 'true');
        (document.head || document.documentElement).appendChild(style);
        return style;
      },

      getResourceText: async (name: string): Promise<string> => {
        return this.sendMessage({
          type: 'GM_GET_RESOURCE_TEXT',
          data: { name },
        });
      },

      getResourceURL: async (name: string): Promise<string> => {
        return this.sendMessage({
          type: 'GM_GET_RESOURCE_URL',
          data: { name },
        });
      },

      registerMenuCommand: (caption: string, func: () => void): string => {
        const id = Math.random().toString(36).substr(2, 9);
        this.sendMessage({
          type: 'GM_REGISTER_MENU_COMMAND',
          data: { id, caption },
        });
        return id;
      },

      unregisterMenuCommand: (id: string): void => {
        this.sendMessage({
          type: 'GM_UNREGISTER_MENU_COMMAND',
          data: { id },
        });
      },

      log: (message: any): void => {
        console.log('[UserScript]', message);
      },

      info: {
        version: '0.1.0',
        scriptHandler: 'ScriptPilot' as const,
        platform: {
          os: 'unknown',
          arch: 'unknown',
          browserName: 'chrome',
          browserVersion: 'unknown',
        },
        script: {
          name: 'Unknown',
          namespace: '',
          version: '1.0.0',
          description: '',
          excludes: [],
          includes: [],
          matches: [],
          runAt: 'document-end',
          unwrap: false,
        },
      },
    };
  }

  private injectGMAPI(): void {
    try {
      // Create script element to inject GM API into page context
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          'use strict';

          // GM API implementation for page context
          const GM_API = {
            setValue: async (key, value) => {
              return window.dispatchEvent(new CustomEvent('scriptpilot:gm-call', {
                detail: { method: 'setValue', args: [key, value] }
              }));
            },

            getValue: async (key, defaultValue) => {
              return new Promise((resolve) => {
                const requestId = Math.random().toString(36).substr(2, 9);
                const handler = (event) => {
                  if (event.detail.requestId === requestId) {
                    resolve(event.detail.result);
                    window.removeEventListener('scriptpilot:gm-response', handler);
                  }
                };

                window.addEventListener('scriptpilot:gm-response', handler);
                window.dispatchEvent(new CustomEvent('scriptpilot:gm-call', {
                  detail: { method: 'getValue', args: [key, defaultValue], requestId }
                }));
              });
            },

            xmlHttpRequest: (options) => {
              return new Promise((resolve, reject) => {
                const requestId = Math.random().toString(36).substr(2, 9);
                const handler = (event) => {
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
                window.dispatchEvent(new CustomEvent('scriptpilot:gm-call', {
                  detail: { method: 'xmlHttpRequest', args: [options], requestId }
                }));
              });
            },

            addStyle: (css) => {
              const style = document.createElement('style');
              style.textContent = css;
              style.setAttribute('data-scriptpilot', 'true');
              (document.head || document.documentElement).appendChild(style);
              return style;
            },

            openInTab: (url, options) => {
              window.dispatchEvent(new CustomEvent('scriptpilot:gm-call', {
                detail: { method: 'openInTab', args: [url, options] }
              }));
            },

            notification: (message, title) => {
              window.dispatchEvent(new CustomEvent('scriptpilot:gm-call', {
                detail: { method: 'notification', args: [message, title] }
              }));
            },

            log: console.log.bind(console, '[UserScript]'),

            info: {
              script: {
                name: 'Unknown',
                version: '1.0.0'
              },
              version: '0.1.0'
            }
          };

          // Legacy GM functions
          window.GM_setValue = GM_API.setValue;
          window.GM_getValue = GM_API.getValue;
          window.GM_xmlhttpRequest = GM_API.xmlHttpRequest;
          window.GM_addStyle = GM_API.addStyle;
          window.GM_openInTab = GM_API.openInTab;
          window.GM_notification = GM_API.notification;
          window.GM_log = GM_API.log;
          window.GM_info = GM_API.info;

          // Modern GM object
          window.GM = GM_API;

          console.log('[ScriptPilot] GM API injected');
        })();
      `;

      (document.head || document.documentElement).appendChild(script);
      script.remove();

      // Listen for GM API calls from page context
      window.addEventListener('scriptpilot:gm-call', ((event: CustomEvent) => {
        this.handleGMAPICall(event);
      }) as EventListener);
    } catch (error) {
      console.error('[ScriptPilot] Failed to inject GM API:', error);
    }
  }

  private async handleGMAPICall(event: CustomEvent): Promise<void> {
    try {
      const { method, args, requestId } = event.detail;

      let result: any;
      let error: string | null = null;

      try {
        switch (method) {
          case 'setValue':
            result = await this.gmApiContext.setValue(args[0], args[1]);
            break;
          case 'getValue':
            result = await this.gmApiContext.getValue(args[0], args[1]);
            break;
          case 'xmlHttpRequest':
            result = await this.gmApiContext.xmlHttpRequest(args[0]);
            break;
          case 'openInTab':
            result = await this.gmApiContext.openInTab(args[0], args[1]);
            break;
          case 'notification':
            result = await this.gmApiContext.notification(args[0], args[1]);
            break;
          default:
            error = `Unknown GM API method: ${method}`;
        }
      } catch (err) {
        error = (err as Error).message;
      }

      if (requestId) {
        window.dispatchEvent(
          new CustomEvent('scriptpilot:gm-response', {
            detail: { requestId, result, error },
          })
        );
      }
    } catch (error) {
      console.error('[ScriptPilot] GM API call handler error:', error);
    }
  }

  private async handleMessage(message: ExtensionMessage): Promise<any> {
    try {
      switch (message.type) {
        case 'EXECUTE_SCRIPT':
          return await this.executeScript(message.data);

        case 'GET_PAGE_INFO':
          return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
          };

        case 'INJECT_CSS':
          return this.injectCSS((message.data as { css: string }).css);

        default:
          console.warn(
            '[ScriptPilot] Unknown content script message:',
            message.type
          );
          return null;
      }
    } catch (error) {
      console.error(
        '[ScriptPilot] Content script message handler error:',
        error
      );
      throw error;
    }
  }

  private async sendMessage(message: ExtensionMessage): Promise<any> {
    try {
      return await browser.runtime.sendMessage(message);
    } catch (error) {
      console.error('[ScriptPilot] Failed to send message:', error);
      throw error;
    }
  }

  private async requestScripts(): Promise<void> {
    try {
      const scripts = await this.sendMessage({
        type: 'GET_SCRIPT_STATUS',
        data: { url: window.location.href },
      });

      console.log(
        `[ScriptPilot] Found ${scripts.length} matching scripts for current page`
      );
    } catch (error) {
      console.error('[ScriptPilot] Failed to request scripts:', error);
    }
  }

  private async executeScript(scriptData: any): Promise<void> {
    try {
      if (this.injectedScripts.has(scriptData.id)) {
        console.log(`[ScriptPilot] Script ${scriptData.id} already injected`);
        return;
      }

      // Create isolated execution context
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          'use strict';
          try {
            ${scriptData.code}
          } catch (error) {
            console.error('[ScriptPilot] Script execution error:', error);
          }
        })();
      `;

      (document.head || document.documentElement).appendChild(script);
      script.remove();

      this.injectedScripts.add(scriptData.id);
      console.log(
        `[ScriptPilot] Executed script: ${scriptData.name || scriptData.id}`
      );
    } catch (error) {
      console.error('[ScriptPilot] Script execution failed:', error);
      throw error;
    }
  }

  private injectCSS(css: string): void {
    try {
      const style = document.createElement('style');
      style.textContent = css;
      style.setAttribute('data-scriptpilot-css', 'true');
      (document.head || document.documentElement).appendChild(style);
    } catch (error) {
      console.error('[ScriptPilot] CSS injection failed:', error);
      throw error;
    }
  }

  private setupScriptDetection(): void {
    // Monitor for .user.js files being accessed
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const links = element.querySelectorAll('a[href$=".user.js"]');

            links.forEach(link => {
              this.enhanceUserScriptLink(link as HTMLAnchorElement);
            });
          }
        });
      });
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    // Enhance existing links
    document.querySelectorAll('a[href$=".user.js"]').forEach(link => {
      this.enhanceUserScriptLink(link as HTMLAnchorElement);
    });
  }

  private enhanceUserScriptLink(link: HTMLAnchorElement): void {
    try {
      if (link.dataset.scriptpilotEnhanced) {
        return;
      }

      link.dataset.scriptpilotEnhanced = 'true';

      // Add install button
      const installBtn = document.createElement('button');
      installBtn.textContent = 'Install with ScriptPilot';
      installBtn.style.cssText = `
        margin-left: 8px;
        padding: 4px 8px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      `;

      installBtn.onclick = async e => {
        e.preventDefault();
        e.stopPropagation();

        try {
          installBtn.textContent = 'Installing...';
          installBtn.disabled = true;

          await this.sendMessage({
            type: 'INSTALL_FROM_URL',
            data: { url: link.href },
          });

          installBtn.textContent = 'Installed!';
          installBtn.style.background = '#28a745';
        } catch (error) {
          console.error('[ScriptPilot] Installation failed:', error);
          installBtn.textContent = 'Failed';
          installBtn.style.background = '#dc3545';
        }
      };

      link.parentNode?.insertBefore(installBtn, link.nextSibling);
    } catch (error) {
      console.error('[ScriptPilot] Failed to enhance userscript link:', error);
    }
  }
}

// Initialize content script
const contentScript = new ContentScript();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ContentScript };
}

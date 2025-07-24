// GM API provider for creating type-safe userscript APIs
import type {
  ExecutionContext,
  GMAPI,
  GMInfo,
  GMNotification,
  GMStorage,
  GMXhrOptions,
  GMXhrResponse,
} from '@scriptpilot/types';

import browser from 'webextension-polyfill';

/**
 * Provides GM API implementation with Chrome Storage and WebExtension APIs
 */
export class GMAPIProvider {
  /**
   * Create a GM API instance for script execution context
   */
  async createAPI(context: ExecutionContext): Promise<GMAPI> {
    return {
      // Storage APIs
      GM_setValue: this.createSetValue(),
      GM_getValue: this.createGetValue(),
      GM_deleteValue: this.createDeleteValue(),
      GM_listValues: this.createListValues(),

      // HTTP Request API
      GM_xmlhttpRequest: this.createXMLHttpRequest(),

      // UI APIs
      GM_notification: this.createNotification(),
      GM_registerMenuCommand: this.createRegisterMenuCommand(),
      GM_unregisterMenuCommand: this.createUnregisterMenuCommand(),

      // Resource APIs
      GM_getResourceText: this.createGetResourceText(),
      GM_getResourceURL: this.createGetResourceURL(),

      // Tab & Window APIs
      GM_openInTab: this.createOpenInTab(),
      GM_closeTab: this.createCloseTab(),
      GM_focusTab: this.createFocusTab(),

      // Clipboard API
      GM_setClipboard: this.createSetClipboard(),

      // Information API
      GM_info: this.createGMInfo(context),

      // Logging API
      GM_log: this.createLog(),

      // Download API
      GM_download: this.createDownload(),
    };
  }

  /**
   * Create GM_setValue implementation using Chrome Storage
   */
  private createSetValue(): GMStorage['setValue'] {
    return async (key: string, value: unknown): Promise<void> => {
      try {
        await browser.storage.local.set({ [`gm_${key}`]: value });
      } catch (error) {
        throw new Error(
          `GM_setValue failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
  }

  /**
   * Create GM_getValue implementation
   */
  private createGetValue(): GMStorage['getValue'] {
    return async (key: string, defaultValue?: unknown): Promise<unknown> => {
      try {
        const result = await browser.storage.local.get([`gm_${key}`]);
        return result[`gm_${key}`] ?? defaultValue;
      } catch (error) {
        throw new Error(
          `GM_getValue failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
  }

  /**
   * Create GM_deleteValue implementation
   */
  private createDeleteValue(): GMStorage['deleteValue'] {
    return async (key: string): Promise<void> => {
      try {
        await browser.storage.local.remove([`gm_${key}`]);
      } catch (error) {
        throw new Error(
          `GM_deleteValue failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
  }

  /**
   * Create GM_listValues implementation
   */
  private createListValues(): GMStorage['listValues'] {
    return async (): Promise<string[]> => {
      try {
        const result = await browser.storage.local.get(null);
        return Object.keys(result)
          .filter(key => key.startsWith('gm_'))
          .map(key => key.substring(3)); // Remove 'gm_' prefix
      } catch (error) {
        throw new Error(
          `GM_listValues failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };
  }

  /**
   * Create GM_xmlhttpRequest implementation
   */
  private createXMLHttpRequest(): GMAPI['GM_xmlhttpRequest'] {
    return (options: GMXhrOptions): GMXhrResponse => {
      const xhr = new XMLHttpRequest();

      // Configure request
      xhr.open(options.method, options.url, true);

      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      if (options.timeout) {
        xhr.timeout = options.timeout;
      }

      if (options.withCredentials) {
        xhr.withCredentials = options.withCredentials;
      }

      if (options.responseType) {
        xhr.responseType = options.responseType as XMLHttpRequestResponseType;
      }

      // Set up event handlers
      if (options.onprogress) xhr.onprogress = options.onprogress;
      if (options.onreadystatechange) {
        xhr.onreadystatechange = () => {
          options.onreadystatechange?.(this.createXhrResponse(xhr));
        };
      }
      if (options.onload) {
        xhr.onload = () => {
          options.onload?.(this.createXhrResponse(xhr));
        };
      }
      if (options.onerror) {
        xhr.onerror = () => {
          options.onerror?.(this.createXhrResponse(xhr));
        };
      }
      if (options.ontimeout) {
        xhr.ontimeout = () => {
          options.ontimeout?.(this.createXhrResponse(xhr));
        };
      }
      if (options.onabort) {
        xhr.onabort = () => {
          options.onabort?.(this.createXhrResponse(xhr));
        };
      }

      // Send request
      xhr.send(options.data);

      return this.createXhrResponse(xhr);
    };
  }

  /**
   * Create XHR response object
   */
  private createXhrResponse(xhr: XMLHttpRequest): GMXhrResponse {
    return {
      responseText: xhr.responseText,
      response: xhr.response,
      status: xhr.status,
      statusText: xhr.statusText,
      responseHeaders: xhr.getAllResponseHeaders(),
      readyState: xhr.readyState,
      finalUrl: xhr.responseURL,
    };
  }

  /**
   * Create GM_notification implementation
   */
  private createNotification(): GMAPI['GM_notification'] {
    return (options: GMNotification): void => {
      if (browser.notifications) {
        browser.notifications
          .create({
            type: 'basic',
            iconUrl:
              options.image || browser.runtime.getURL('icons/icon48.png'),
            title: options.title,
            message: options.text,
          })
          .then(notificationId => {
            if (options.onclick) {
              browser.notifications.onClicked.addListener(id => {
                if (id === notificationId) {
                  options.onclick?.();
                }
              });
            }

            if (options.timeout) {
              setTimeout(() => {
                browser.notifications.clear(notificationId);
                options.ondone?.();
              }, options.timeout);
            }
          })
          .catch(error => {
            console.error('GM_notification failed:', error);
          });
      } else {
        // Fallback to alert for environments without notifications API
        alert(`${options.title}: ${options.text}`);
        options.onclick?.();
        options.ondone?.();
      }
    };
  }

  /**
   * Create menu command registration (placeholder)
   */
  private createRegisterMenuCommand(): GMAPI['GM_registerMenuCommand'] {
    return (
      caption: string,
      onclick: () => void,
      accessKey?: string
    ): string => {
      // This would integrate with the extension's context menu system
      const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`GM_registerMenuCommand: ${caption} (${commandId})`);
      return commandId;
    };
  }

  /**
   * Create menu command unregistration (placeholder)
   */
  private createUnregisterMenuCommand(): GMAPI['GM_unregisterMenuCommand'] {
    return (commandId: string): void => {
      console.log(`GM_unregisterMenuCommand: ${commandId}`);
    };
  }

  /**
   * Create resource text getter (placeholder)
   */
  private createGetResourceText(): GMAPI['GM_getResourceText'] {
    return (name: string): string => {
      // This would fetch from declared @resource directives
      console.warn(`GM_getResourceText not implemented: ${name}`);
      return '';
    };
  }

  /**
   * Create resource URL getter (placeholder)
   */
  private createGetResourceURL(): GMAPI['GM_getResourceURL'] {
    return (name: string): string => {
      // This would return blob URL for declared @resource directives
      console.warn(`GM_getResourceURL not implemented: ${name}`);
      return '';
    };
  }

  /**
   * Create tab opening implementation
   */
  private createOpenInTab(): GMAPI['GM_openInTab'] {
    return (url: string, active?: boolean) => {
      if (browser.tabs) {
        browser.tabs.create({ url, active }).catch(error => {
          console.error('GM_openInTab failed:', error);
        });
      } else {
        window.open(url, '_blank');
      }

      // Return placeholder tab object
      return {
        id: -1,
        url,
        title: '',
        active: active ?? true,
        loading: true,
      };
    };
  }

  /**
   * Create tab closing implementation (placeholder)
   */
  private createCloseTab(): GMAPI['GM_closeTab'] {
    return tab => {
      if (browser.tabs && tab.id && tab.id > 0) {
        browser.tabs.remove(tab.id).catch(error => {
          console.error('GM_closeTab failed:', error);
        });
      }
    };
  }

  /**
   * Create tab focusing implementation (placeholder)
   */
  private createFocusTab(): GMAPI['GM_focusTab'] {
    return tab => {
      if (browser.tabs && tab.id && tab.id > 0) {
        browser.tabs.update(tab.id, { active: true }).catch(error => {
          console.error('GM_focusTab failed:', error);
        });
      }
    };
  }

  /**
   * Create clipboard setter implementation
   */
  private createSetClipboard(): GMAPI['GM_setClipboard'] {
    return (text: string, type?: 'text' | 'html'): void => {
      if (navigator.clipboard) {
        if (type === 'html') {
          // For HTML content, we'd need to use the newer Clipboard API
          navigator.clipboard
            .write([
              new ClipboardItem({
                'text/html': new Blob([text], { type: 'text/html' }),
              }),
            ])
            .catch(error => {
              console.error('GM_setClipboard (HTML) failed:', error);
            });
        } else {
          navigator.clipboard.writeText(text).catch(error => {
            console.error('GM_setClipboard failed:', error);
          });
        }
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    };
  }

  /**
   * Create GM_info object
   */
  private createGMInfo(context: ExecutionContext): GMInfo {
    return {
      version: '0.1.0',
      scriptHandler: 'ScriptPilot',
      platform: {
        os: navigator.platform,
        arch: '',
        browserName: this.getBrowserName(),
        browserVersion: this.getBrowserVersion(),
      },
      script: {
        name: 'Current Script',
        namespace: '',
        version: '1.0.0',
        description: '',
        excludes: [],
        includes: [],
        matches: [],
        runAt: 'document-end',
        unwrap: false,
      },
    };
  }

  /**
   * Create logging implementation
   */
  private createLog(): GMAPI['GM_log'] {
    return (
      message: string,
      level?: 'log' | 'info' | 'warn' | 'error'
    ): void => {
      const logLevel = level || 'log';
      console[logLevel](`[GM_log] ${message}`);
    };
  }

  /**
   * Create download implementation (placeholder)
   */
  private createDownload(): GMAPI['GM_download'] {
    return async (url: string, filename?: string): Promise<void> => {
      if (browser.downloads) {
        try {
          await browser.downloads.download({
            url,
            filename,
          });
        } catch (error) {
          console.error('GM_download failed:', error);
          throw error;
        }
      } else {
        // Fallback to creating download link
        const a = document.createElement('a');
        a.href = url;
        if (filename) a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
  }

  /**
   * Detect browser name
   */
  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Get browser version
   */
  private getBrowserVersion(): string {
    const userAgent = navigator.userAgent;
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/(\d+)/);
    return match ? match[2] : 'Unknown';
  }
}

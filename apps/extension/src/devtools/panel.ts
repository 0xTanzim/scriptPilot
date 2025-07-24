/**
 * ScriptPilot DevTools Panel
 * UI for script debugging and management within Chrome DevTools
 */
import type { ExtensionMessage, Script } from '@scriptpilot/types';
import browser from 'webextension-polyfill';

class DevToolsPanel {
  private tabId: number | null = null;
  private scripts: Script[] = [];
  private contentElement: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[ScriptPilot] DevTools panel initializing...');

      // Wait for DOM
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      this.contentElement = document.querySelector('.content');

      // Listen for initialization message
      window.addEventListener('message', this.handleMessage.bind(this));

      // Request current tab info
      await this.requestTabInfo();

      console.log('[ScriptPilot] DevTools panel ready');
    } catch (error) {
      console.error(
        '[ScriptPilot] DevTools panel initialization failed:',
        error
      );
      this.showError(error as Error);
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data?.type === 'INIT_PANEL') {
      this.tabId = event.data.data.tabId;
      this.loadScripts();
    }
  }

  private async requestTabInfo(): Promise<void> {
    try {
      // Get tab ID from devtools context
      this.tabId = (browser as any).devtools?.inspectedWindow?.tabId;
      if (this.tabId) {
        await this.loadScripts();
      }
    } catch (error) {
      console.error('[ScriptPilot] Failed to get tab info:', error);
    }
  }

  private async loadScripts(): Promise<void> {
    try {
      if (!this.tabId) return;

      // Get current page URL
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (!currentTab?.url) return;

      // Load all scripts
      const allScripts = await this.sendMessage({ type: 'GET_SCRIPTS' });

      // Get scripts for current page
      const pageScripts = await this.sendMessage({
        type: 'GET_SCRIPT_STATUS',
        data: { url: currentTab.url },
      });

      this.scripts = allScripts || [];
      this.renderScripts(pageScripts || []);
    } catch (error) {
      console.error('[ScriptPilot] Failed to load scripts:', error);
      this.showError(error as Error);
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

  private renderScripts(pageScripts: any[]): void {
    if (!this.contentElement) return;

    if (pageScripts.length === 0) {
      this.contentElement.innerHTML = `
        <div style="text-align: center; color: #666; margin-top: 40px;">
          <h3>No scripts running on this page</h3>
          <p>Scripts that match this page's URL will appear here when they execute.</p>
        </div>
      `;
      return;
    }

    const scriptsHtml = pageScripts
      .map(
        script => `
      <div style="
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        background: #ffffff;
      ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h4 style="margin: 0; color: #343a40;">${script.name || script.id}</h4>
          <span style="
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            background: ${script.enabled ? '#d4edda' : '#f8d7da'};
            color: ${script.enabled ? '#155724' : '#721c24'};
          ">
            ${script.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div style="color: #6c757d; font-size: 14px; margin-bottom: 12px;">
          Version: ${script.version || '1.0.0'}
        </div>

        <div style="display: flex; gap: 8px;">
          <button onclick="toggleScript('${script.id}', ${!script.enabled})" style="
            padding: 6px 12px;
            border: 1px solid #007cba;
            background: ${script.enabled ? 'transparent' : '#007cba'};
            color: ${script.enabled ? '#007cba' : 'white'};
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            ${script.enabled ? 'Disable' : 'Enable'}
          </button>

          <button onclick="debugScript('${script.id}')" style="
            padding: 6px 12px;
            border: 1px solid #28a745;
            background: transparent;
            color: #28a745;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            Debug
          </button>

          <button onclick="viewScript('${script.id}')" style="
            padding: 6px 12px;
            border: 1px solid #6c757d;
            background: transparent;
            color: #6c757d;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">
            View Source
          </button>
        </div>
      </div>
    `
      )
      .join('');

    this.contentElement.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; color: #343a40;">Active Scripts (${pageScripts.length})</h3>
        <p style="margin: 0; color: #6c757d; font-size: 14px;">Scripts currently running on this page</p>
      </div>
      ${scriptsHtml}
    `;

    // Add global functions for button handlers
    (window as any).toggleScript = this.toggleScript.bind(this);
    (window as any).debugScript = this.debugScript.bind(this);
    (window as any).viewScript = this.viewScript.bind(this);
  }

  private async toggleScript(
    scriptId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await this.sendMessage({
        type: 'TOGGLE_SCRIPT',
        data: { id: scriptId, enabled },
      });

      // Reload scripts
      await this.loadScripts();
    } catch (error) {
      console.error('[ScriptPilot] Failed to toggle script:', error);
    }
  }

  private debugScript(scriptId: string): void {
    try {
      // Inject debugging code
      const script = this.scripts.find(s => s.id === scriptId);
      if (!script) return;

      // Add debugger statement and console logging
      const debugCode = `
        console.group('[ScriptPilot Debug] ${script.metadata?.name || scriptId}');
        console.log('Script ID:', '${scriptId}');
        console.log('Script Code:', \`${script.code}\`);
        debugger;
        console.groupEnd();
      `;

      // Execute in inspected window
      (browser as any).devtools?.inspectedWindow?.eval(debugCode);
    } catch (error) {
      console.error('[ScriptPilot] Failed to debug script:', error);
    }
  }

  private viewScript(scriptId: string): void {
    try {
      const script = this.scripts.find(s => s.id === scriptId);
      if (!script) return;

      // Create a popup with script source
      const popup = window.open('', '_blank', 'width=800,height=600');
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Script Source - ${script.metadata?.name || scriptId}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { background: #f8f9fa; padding: 20px; border-radius: 4px; overflow: auto; }
            </style>
          </head>
          <body>
            <h2>${script.metadata?.name || scriptId}</h2>
            <p><strong>Version:</strong> ${script.metadata?.version || '1.0.0'}</p>
            <p><strong>Description:</strong> ${script.metadata?.description || 'No description'}</p>
            <h3>Source Code:</h3>
            <pre>${script.code}</pre>
          </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('[ScriptPilot] Failed to view script:', error);
    }
  }

  private showError(error: Error): void {
    if (this.contentElement) {
      this.contentElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <h3>Error</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()" style="
            padding: 8px 16px;
            background: #007cba;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Initialize panel
const devToolsPanel = new DevToolsPanel();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DevToolsPanel };
}

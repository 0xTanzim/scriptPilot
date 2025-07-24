/**
 * ScriptPilot Popup Entry Point
 * Renders the main UI using React components from @scriptpilot/ui
 */
import type { ExtensionMessage, Script } from '@scriptpilot/types';
import { App } from '@scriptpilot/ui';
import React from 'react';
import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

class PopupController {
  private root: ReturnType<typeof createRoot> | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[ScriptPilot] Popup initializing...');

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Create React root
      const rootElement = document.getElementById('root');
      if (!rootElement) {
        throw new Error('Root element not found');
      }

      this.root = createRoot(rootElement);

      // Render the app
      await this.renderApp();

      console.log('[ScriptPilot] Popup initialized');
    } catch (error) {
      console.error('[ScriptPilot] Popup initialization failed:', error);
      this.showError(error as Error);
    }
  }

  private async renderApp(): Promise<void> {
    try {
      // Get current tab info
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      // Load scripts
      const scripts = await this.sendMessage({ type: 'GET_SCRIPTS' });

      // Get current page script status
      const scriptStatus = currentTab?.url
        ? await this.sendMessage({
            type: 'GET_SCRIPT_STATUS',
            data: { url: currentTab.url },
          })
        : [];

      // Create app props
      const appProps = {
        scripts: scripts || [],
        currentUrl: currentTab?.url || '',
        currentTitle: currentTab?.title || '',
        scriptStatus: scriptStatus || [],
        onScriptSave: this.handleScriptSave.bind(this),
        onScriptDelete: this.handleScriptDelete.bind(this),
        onScriptToggle: this.handleScriptToggle.bind(this),
        onScriptInstall: this.handleScriptInstall.bind(this),
        onOpenSettings: this.handleOpenSettings.bind(this),
        onOpenEditor: this.handleOpenEditor.bind(this),
      };

      // Render React app
      this.root?.render(React.createElement(App, appProps));
    } catch (error) {
      console.error('[ScriptPilot] Failed to render app:', error);
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

  private async handleScriptSave(script: Script): Promise<void> {
    try {
      await this.sendMessage({
        type: 'SAVE_SCRIPT',
        data: script,
      });

      // Refresh the app
      await this.renderApp();
    } catch (error) {
      console.error('[ScriptPilot] Failed to save script:', error);
      throw error;
    }
  }

  private async handleScriptDelete(scriptId: string): Promise<void> {
    try {
      await this.sendMessage({
        type: 'DELETE_SCRIPT',
        data: { id: scriptId },
      });

      // Refresh the app
      await this.renderApp();
    } catch (error) {
      console.error('[ScriptPilot] Failed to delete script:', error);
      throw error;
    }
  }

  private async handleScriptToggle(
    scriptId: string,
    enabled: boolean
  ): Promise<void> {
    try {
      await this.sendMessage({
        type: 'TOGGLE_SCRIPT',
        data: { id: scriptId, enabled },
      });

      // Refresh the app
      await this.renderApp();
    } catch (error) {
      console.error('[ScriptPilot] Failed to toggle script:', error);
      throw error;
    }
  }

  private async handleScriptInstall(url: string): Promise<void> {
    try {
      await this.sendMessage({
        type: 'INSTALL_FROM_URL',
        data: { url },
      });

      // Refresh the app
      await this.renderApp();
    } catch (error) {
      console.error('[ScriptPilot] Failed to install script:', error);
      throw error;
    }
  }

  private handleOpenSettings(): void {
    try {
      // Open options page
      browser.runtime.openOptionsPage();
      window.close();
    } catch (error) {
      console.error('[ScriptPilot] Failed to open settings:', error);
    }
  }

  private handleOpenEditor(scriptId?: string): void {
    try {
      // Open editor in new tab
      const url = browser.runtime.getURL(
        'src/popup/popup.html#editor' + (scriptId ? `/${scriptId}` : '')
      );
      browser.tabs.create({ url });
      window.close();
    } catch (error) {
      console.error('[ScriptPilot] Failed to open editor:', error);
    }
  }

  private showError(error: Error): void {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
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

// Initialize popup when loaded
const popupController = new PopupController();

// Handle hash-based routing for settings/editor
window.addEventListener('hashchange', () => {
  // Re-render app based on new hash
  // This could be expanded for more sophisticated routing
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PopupController };
}

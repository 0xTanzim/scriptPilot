/**
 * ScriptPilot Background Service Worker
 * Manages script execution, storage, and cross-page communication
 */
import { ScriptService } from '@scriptpilot/core';
import { PluginManager } from '@scriptpilot/plugins';
import { StorageService } from '@scriptpilot/storage';
import type {
  ExtensionMessage,
  Script,
  ScriptStatusInfo,
} from '@scriptpilot/types';
import browser from 'webextension-polyfill';

class BackgroundService {
  private scriptService: ScriptService;
  private storageService: StorageService;
  private pluginManager: PluginManager;
  private scriptCache: Map<string, Script> = new Map();

  constructor() {
    this.scriptService = new ScriptService();
    this.storageService = new StorageService();
    this.pluginManager = new PluginManager();

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[ScriptPilot] Background service worker starting...');

      // Load cached scripts
      await this.loadScripts();

      // Initialize plugin system
      await this.pluginManager.initialize();

      // Set up event listeners
      this.setupEventListeners();

      // Create context menu
      this.setupContextMenu();

      console.log('[ScriptPilot] Background service worker ready');
    } catch (error) {
      console.error(
        '[ScriptPilot] Failed to initialize background service:',
        error
      );
    }
  }

  private async loadScripts(): Promise<void> {
    try {
      const scripts = await this.storageService.getAllScripts();
      this.scriptCache.clear();

      for (const script of scripts) {
        this.scriptCache.set(script.id, script);
      }

      console.log(`[ScriptPilot] Loaded ${scripts.length} scripts`);
    } catch (error) {
      console.error('[ScriptPilot] Failed to load scripts:', error);
    }
  }

  private setupEventListeners(): void {
    // Handle extension messages
    browser.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Handle tab updates for script matching
    browser.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));

    // Handle navigation for script injection
    browser.webNavigation.onCommitted.addListener(
      this.handleNavigation.bind(this)
    );

    // Handle extension install/update
    browser.runtime.onInstalled.addListener(this.handleInstall.bind(this));
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: browser.Runtime.MessageSender
  ): Promise<any> {
    try {
      switch (message.type) {
        case 'GET_SCRIPTS':
          return Array.from(this.scriptCache.values());

        case 'SAVE_SCRIPT':
          return await this.saveScript(message.data);

        case 'DELETE_SCRIPT':
          return await this.deleteScript(message.data.id);

        case 'TOGGLE_SCRIPT':
          return await this.toggleScript(message.data.id, message.data.enabled);

        case 'EXECUTE_SCRIPT':
          return await this.executeScript(message.data, sender.tab?.id);

        case 'GET_SCRIPT_STATUS':
          return await this.getScriptStatus(message.data.url);

        case 'INSTALL_FROM_URL':
          return await this.installScriptFromUrl(message.data.url);

        default:
          console.warn('[ScriptPilot] Unknown message type:', message.type);
          return null;
      }
    } catch (error) {
      console.error('[ScriptPilot] Message handler error:', error);
      throw error;
    }
  }

  private async handleTabUpdate(
    tabId: number,
    changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
    tab: browser.Tabs.Tab
  ): Promise<void> {
    if (changeInfo.status === 'loading' && tab.url) {
      await this.injectMatchingScripts(tabId, tab.url);
    }
  }

  private async handleNavigation(
    details: browser.WebNavigation.OnCommittedDetailsType
  ): Promise<void> {
    if (details.frameId === 0) {
      // Main frame only
      await this.injectMatchingScripts(details.tabId, details.url);
    }
  }

  private async handleInstall(
    details: browser.Runtime.OnInstalledDetailsType
  ): Promise<void> {
    if (details.reason === 'install') {
      console.log('[ScriptPilot] Extension installed');
      // Show welcome page or onboarding
      await browser.tabs.create({
        url: browser.runtime.getURL('src/popup/popup.html#welcome'),
      });
    } else if (details.reason === 'update') {
      console.log('[ScriptPilot] Extension updated');
      await this.loadScripts(); // Reload scripts after update
    }
  }

  private setupContextMenu(): void {
    browser.contextMenus.create({
      id: 'scriptpilot-install',
      title: 'Install as userscript',
      contexts: ['link'],
      targetUrlPatterns: ['*://*.user.js', '*://*.user.js?*'],
    });

    browser.contextMenus.onClicked.addListener(async (info, tab) => {
      if (info.menuItemId === 'scriptpilot-install' && info.linkUrl) {
        try {
          await this.installScriptFromUrl(info.linkUrl);
          browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'ScriptPilot',
            message: 'Script installed successfully!',
          });
        } catch (error) {
          console.error('[ScriptPilot] Failed to install script:', error);
          browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'ScriptPilot',
            message: 'Failed to install script: ' + (error as Error).message,
          });
        }
      }
    });
  }

  private async injectMatchingScripts(
    tabId: number,
    url: string
  ): Promise<void> {
    try {
      const matchingScripts = Array.from(this.scriptCache.values()).filter(
        script =>
          script.enabled &&
          script.metadata?.match?.some(pattern => this.urlMatches(url, pattern))
      );

      for (const script of matchingScripts) {
        await this.injectScript(tabId, script);
      }
    } catch (error) {
      console.error('[ScriptPilot] Failed to inject scripts:', error);
    }
  }

  private async injectScript(tabId: number, script: Script): Promise<void> {
    try {
      const runAt = script.metadata?.runAt || 'document_end';

      await browser.scripting.executeScript({
        target: { tabId },
        func: this.createScriptExecutor(script),
        world: 'ISOLATED' as any,
        injectImmediately: runAt === 'document-start',
      });

      console.log(
        `[ScriptPilot] Injected script: ${script.metadata?.name || script.id}`
      );
    } catch (error) {
      console.error(
        `[ScriptPilot] Failed to inject script ${script.id}:`,
        error
      );
    }
  }

  private createScriptExecutor(script: Script) {
    return function () {
      try {
        // Create isolated execution context
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `
          (function() {
            ${script.code}
          })();
        `;

        (document.head || document.documentElement).appendChild(scriptElement);
        scriptElement.remove();
      } catch (error) {
        console.error('[ScriptPilot] Script execution error:', error);
      }
    };
  }

  private urlMatches(url: string, pattern: string): boolean {
    try {
      // Convert userscript pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '\\?')
        .replace(/\./g, '\\.');

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(url);
    } catch (error) {
      console.error('[ScriptPilot] Pattern matching error:', error);
      return false;
    }
  }

  private async saveScript(script: Script): Promise<Script> {
    try {
      const savedScript = await this.storageService.saveScript(script);
      this.scriptCache.set(savedScript.id, savedScript);
      return savedScript;
    } catch (error) {
      console.error('[ScriptPilot] Failed to save script:', error);
      throw error;
    }
  }

  private async deleteScript(scriptId: string): Promise<void> {
    try {
      await this.storageService.deleteScript(scriptId);
      this.scriptCache.delete(scriptId);
    } catch (error) {
      console.error('[ScriptPilot] Failed to delete script:', error);
      throw error;
    }
  }

  private async toggleScript(
    scriptId: string,
    enabled: boolean
  ): Promise<Script | null> {
    try {
      const script = this.scriptCache.get(scriptId);
      if (!script) {
        throw new Error(`Script ${scriptId} not found`);
      }

      const updatedScript = { ...script, enabled };
      const savedScript = await this.storageService.saveScript(updatedScript);
      this.scriptCache.set(scriptId, savedScript);

      return savedScript;
    } catch (error) {
      console.error('[ScriptPilot] Failed to toggle script:', error);
      throw error;
    }
  }

  private async executeScript(scriptData: any, tabId?: number): Promise<void> {
    if (!tabId) {
      throw new Error('Tab ID required for script execution');
    }

    try {
      await this.scriptService.executeScript(scriptData, { tabId });
    } catch (error) {
      console.error('[ScriptPilot] Script execution failed:', error);
      throw error;
    }
  }

  private async getScriptStatus(url: string): Promise<ScriptStatusInfo[]> {
    try {
      const matchingScripts = Array.from(this.scriptCache.values()).filter(
        script =>
          script.metadata?.match?.some(pattern => this.urlMatches(url, pattern))
      );

      return matchingScripts.map(script => ({
        id: script.id,
        name: script.metadata?.name || script.id,
        enabled: script.enabled,
        version: script.metadata?.version || '1.0.0',
      }));
    } catch (error) {
      console.error('[ScriptPilot] Failed to get script status:', error);
      return [];
    }
  }

  private async installScriptFromUrl(url: string): Promise<Script> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch script: ${response.statusText}`);
      }

      const code = await response.text();
      const script = await this.scriptService.parseScriptFromCode(code, url);

      return await this.saveScript(script);
    } catch (error) {
      console.error('[ScriptPilot] Failed to install script from URL:', error);
      throw error;
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Keep service worker alive
browser.runtime.onStartup.addListener(() => {
  console.log('[ScriptPilot] Extension startup');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BackgroundService };
}

/**
 * ScriptPilot DevTools Integration
 * Creates a DevTools panel for script debugging and management
 */
import browser from 'webextension-polyfill';

class DevToolsService {
  private panel: any = null;
  private tabId: number | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log('[ScriptPilot] DevTools initializing...');

      // Get current tab ID
      this.tabId = browser.devtools.inspectedWindow.tabId;

      // Create DevTools panel
      this.panel = await browser.devtools.panels.create(
        'ScriptPilot',
        '/icons/icon-32.png',
        '/src/devtools/panel.html'
      );

      // Set up panel event listeners
      this.setupPanelListeners();

      console.log('[ScriptPilot] DevTools panel created');
    } catch (error) {
      console.error('[ScriptPilot] DevTools initialization failed:', error);
    }
  }

  private setupPanelListeners(): void {
    if (!this.panel) return;

    // Panel shown event
    this.panel.onShown.addListener((panelWindow: any) => {
      console.log('[ScriptPilot] DevTools panel shown');
      // Initialize panel UI
      this.initializePanelUI(panelWindow);
    });

    // Panel hidden event
    this.panel.onHidden.addListener(() => {
      console.log('[ScriptPilot] DevTools panel hidden');
    });
  }

  private initializePanelUI(panelWindow: any): void {
    try {
      // Send tab info to panel
      const tabInfo = {
        tabId: this.tabId,
        url: browser.devtools.inspectedWindow.eval('window.location.href'),
        title: browser.devtools.inspectedWindow.eval('document.title'),
      };

      // Post message to panel
      panelWindow.postMessage(
        {
          type: 'INIT_PANEL',
          data: tabInfo,
        },
        '*'
      );
    } catch (error) {
      console.error('[ScriptPilot] Failed to initialize panel UI:', error);
    }
  }
}

// Initialize DevTools
const devToolsService = new DevToolsService();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DevToolsService };
}

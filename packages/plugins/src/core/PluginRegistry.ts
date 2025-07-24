import type { ScriptService } from '@scriptpilot/core';
import type {
  Plugin,
  PluginConfig,
  PluginContext,
  PluginInfo,
  PluginManifest,
  PluginStatus,
} from '@scriptpilot/types';
import { PluginContextImpl } from './PluginContext';

/**
 * Plugin registry for managing plugin lifecycle
 */
export class PluginRegistry {
  private plugins: Map<string, PluginInfo>;
  private contexts: Map<string, PluginContext>;
  private scriptService: ScriptService;
  private storageService: any;

  constructor(scriptService: ScriptService, storageService?: any) {
    this.plugins = new Map();
    this.contexts = new Map();
    this.scriptService = scriptService;
    this.storageService = storageService;
  }

  /**
   * Register a plugin
   */
  async register(plugin: Plugin, manifest: PluginManifest): Promise<void> {
    const pluginName = plugin.name;

    // Check if plugin is already registered
    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }

    // Validate plugin
    this.validatePlugin(plugin, manifest);

    // Create plugin configuration
    const config: PluginConfig = {
      settings: {},
      enabled: true,
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    // Create plugin info
    const pluginInfo: PluginInfo = {
      manifest,
      status: 'installed',
      config,
      path: '', // TODO: Set actual plugin path
      error: undefined,
    };

    // Create plugin context
    const context = new PluginContextImpl(
      this.scriptService,
      this.storageService,
      config,
      pluginName,
      false // TODO: Get debug setting from config
    );

    try {
      // Register the plugin
      await plugin.register(context);

      // Store plugin info and context
      this.plugins.set(pluginName, pluginInfo);
      this.contexts.set(pluginName, context);

      // Update status
      pluginInfo.status = 'enabled';

      console.log(`Plugin ${pluginName} registered successfully`);
    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error =
        error instanceof Error ? error.message : 'Unknown error';

      // Still store the plugin info for debugging
      this.plugins.set(pluginName, pluginInfo);

      throw new Error(
        `Failed to register plugin ${pluginName}: ${pluginInfo.error}`
      );
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginName: string): Promise<void> {
    const pluginInfo = this.plugins.get(pluginName);
    const context = this.contexts.get(pluginName);

    if (!pluginInfo || !context) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    try {
      // Find the original plugin instance (we need to store it)
      // For now, we'll just dispose the context
      if (context instanceof PluginContextImpl) {
        context.dispose();
      }

      // Remove from maps
      this.plugins.delete(pluginName);
      this.contexts.delete(pluginName);

      console.log(`Plugin ${pluginName} unregistered successfully`);
    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to unregister plugin ${pluginName}: ${pluginInfo.error}`
      );
    }
  }

  /**
   * Enable a plugin
   */
  async enable(pluginName: string): Promise<void> {
    const pluginInfo = this.plugins.get(pluginName);
    const context = this.contexts.get(pluginName);

    if (!pluginInfo || !context) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (pluginInfo.status === 'enabled') {
      return; // Already enabled
    }

    try {
      if (context instanceof PluginContextImpl) {
        context.enable();
      }
      pluginInfo.status = 'enabled';
      pluginInfo.error = undefined;

      console.log(`Plugin ${pluginName} enabled`);
    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to enable plugin ${pluginName}: ${pluginInfo.error}`
      );
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginName: string): Promise<void> {
    const pluginInfo = this.plugins.get(pluginName);
    const context = this.contexts.get(pluginName);

    if (!pluginInfo || !context) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    if (pluginInfo.status === 'disabled') {
      return; // Already disabled
    }

    try {
      if (context instanceof PluginContextImpl) {
        context.disable();
      }
      pluginInfo.status = 'disabled';
      pluginInfo.error = undefined;

      console.log(`Plugin ${pluginName} disabled`);
    } catch (error) {
      pluginInfo.status = 'error';
      pluginInfo.error =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to disable plugin ${pluginName}: ${pluginInfo.error}`
      );
    }
  }

  /**
   * Get plugin info
   */
  getPlugin(pluginName: string): PluginInfo | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins
   */
  getEnabledPlugins(): PluginInfo[] {
    return this.getAllPlugins().filter(plugin => plugin.status === 'enabled');
  }

  /**
   * Get plugin context
   */
  getContext(pluginName: string): PluginContext | undefined {
    return this.contexts.get(pluginName);
  }

  /**
   * Check if plugin is registered
   */
  isRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    return plugin?.status === 'enabled';
  }

  /**
   * Get plugin status
   */
  getStatus(pluginName: string): PluginStatus | undefined {
    const plugin = this.plugins.get(pluginName);
    return plugin?.status;
  }

  /**
   * Update plugin configuration
   */
  async updateConfig(
    pluginName: string,
    updates: Partial<PluginConfig>
  ): Promise<void> {
    const pluginInfo = this.plugins.get(pluginName);
    const context = this.contexts.get(pluginName);

    if (!pluginInfo || !context) {
      throw new Error(`Plugin ${pluginName} is not registered`);
    }

    // Update config
    pluginInfo.config = { ...pluginInfo.config, ...updates };
    if (context instanceof PluginContextImpl) {
      context.updateConfig(pluginInfo.config);
    }

    // Save to storage if available
    if (this.storageService) {
      await this.storageService.setData(
        `plugin:${pluginName}:config`,
        pluginInfo.config
      );
    }
  }

  /**
   * Get plugin statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    error: number;
  } {
    const plugins = this.getAllPlugins();

    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.status === 'enabled').length,
      disabled: plugins.filter(p => p.status === 'disabled').length,
      error: plugins.filter(p => p.status === 'error').length,
    };
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin, manifest: PluginManifest): void {
    if (!plugin.name || !plugin.version) {
      throw new Error('Plugin must have name and version');
    }

    if (!plugin.register || typeof plugin.register !== 'function') {
      throw new Error('Plugin must have a register function');
    }

    if (!manifest.name || !manifest.version) {
      throw new Error('Plugin manifest must have name and version');
    }

    // Check for reserved plugin names
    const reservedNames = ['core', 'system', 'internal'];
    if (reservedNames.includes(plugin.name.toLowerCase())) {
      throw new Error(`Plugin name "${plugin.name}" is reserved`);
    }
  }

  /**
   * Dispose all plugins and cleanup
   */
  async dispose(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());

    for (const pluginName of pluginNames) {
      try {
        await this.unregister(pluginName);
      } catch (error) {
        console.error(`Error disposing plugin ${pluginName}:`, error);
      }
    }

    this.plugins.clear();
    this.contexts.clear();
  }
}

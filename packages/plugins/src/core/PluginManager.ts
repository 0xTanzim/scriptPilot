import type { 
  Plugin, 
  PluginManifest, 
  PluginContext,
  PluginStatus,
  PluginPermissions,
  PluginEventEmitter,
  PluginInfo
} from '@scriptpilot/types';
import { PluginRegistry } from './PluginRegistry';
import { PluginLoader } from './PluginLoader';
import { PluginContextImpl } from './PluginContext';
import { PluginEventEmitterImpl } from './PluginEventEmitter';

/**
 * Configuration for plugin manager
 */
export interface PluginManagerConfig {
  /** Whether to auto-load plugins on startup */
  autoLoad?: boolean;
  /** Maximum number of plugins allowed */
  maxPlugins?: number;
  /** Whether to allow dev plugins (unsafe) */
  allowDevPlugins?: boolean;
  /** Plugin directories to scan */
  pluginDirs?: string[];
  /** Whether to enable plugin sandboxing */
  enableSandbox?: boolean;
}

/**
 * Statistics about loaded plugins
 */
export interface PluginStats {
  total: number;
  enabled: number;
  disabled: number;
  failed: number;
  memory: number;
}

/**
 * Main plugin management class
 */
export class PluginManager {
  private registry: PluginRegistry;
  private loader: PluginLoader;
  private eventEmitter: PluginEventEmitter;
  private config: PluginManagerConfig;
  private pluginStats: Map<string, { memoryUsage: number; startTime: number }> = new Map();

  constructor(config: PluginManagerConfig = {}) {
    this.config = {
      autoLoad: true,
      maxPlugins: 50,
      allowDevPlugins: false,
      pluginDirs: [],
      enableSandbox: true,
      ...config
    };

    // Note: We'll need to inject these dependencies later
    this.registry = new PluginRegistry({} as any); // Will be properly initialized
    this.loader = new PluginLoader();
    this.eventEmitter = new PluginEventEmitterImpl();

    this.setupEventHandlers();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Plugin Manager...');
      
      // Load configuration from storage
      await this.loadConfiguration();
      
      // Auto-load plugins if enabled
      if (this.config.autoLoad) {
        await this.autoLoadPlugins();
      }
      
      this.eventEmitter.emit('manager:initialized', { timestamp: Date.now() });
      console.log('Plugin Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Plugin Manager:', error);
      throw error;
    }
  }

  /**
   * Install plugin from URL
   */
  async installFromUrl(url: string): Promise<string> {
    try {
      console.log(`Installing plugin from URL: ${url}`);
      
      // Check limits
      const allPlugins = this.registry.getAllPlugins();
      if (allPlugins.length >= this.config.maxPlugins!) {
        throw new Error(`Maximum plugin limit reached (${this.config.maxPlugins})`);
      }
      
      // Load plugin
      const { plugin, manifest } = await this.loader.loadFromUrl(url);
      
      // Register plugin
      await this.registerPlugin(plugin, manifest);
      const pluginId = plugin.name; // Use plugin name as ID
      
      this.eventEmitter.emit('plugin:installed', { 
        pluginId, 
        source: 'url', 
        url,
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${plugin.name} installed successfully`);
      return pluginId;
    } catch (error) {
      console.error(`Failed to install plugin from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Install plugin from code string
   */
  async installFromCode(code: string, source = 'manual'): Promise<string> {
    try {
      console.log('Installing plugin from code');
      
      if (!this.config.allowDevPlugins && source === 'manual') {
        throw new Error('Development plugins are not allowed');
      }
      
      // Check limits
      const allPlugins = this.registry.getAllPlugins();
      if (allPlugins.length >= this.config.maxPlugins!) {
        throw new Error(`Maximum plugin limit reached (${this.config.maxPlugins})`);
      }
      
      // Load plugin
      const { plugin, manifest } = await this.loader.loadFromCode(code, source);
      
      // Register plugin
      await this.registerPlugin(plugin, manifest);
      const pluginId = plugin.name;
      
      this.eventEmitter.emit('plugin:installed', { 
        pluginId, 
        source: 'code', 
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${plugin.name} installed successfully`);
      return pluginId;
    } catch (error) {
      console.error('Failed to install plugin from code:', error);
      throw error;
    }
  }

  /**
   * Install plugin from file
   */
  async installFromFile(file: File): Promise<string> {
    try {
      console.log(`Installing plugin from file: ${file.name}`);
      
      if (!this.config.allowDevPlugins) {
        throw new Error('Development plugins are not allowed');
      }
      
      // Load plugin
      const { plugin, manifest } = await this.loader.loadFromFile(file);
      
      // Register plugin
      await this.registerPlugin(plugin, manifest);
      const pluginId = plugin.name;
      
      this.eventEmitter.emit('plugin:installed', { 
        pluginId, 
        source: 'file', 
        filename: file.name,
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${plugin.name} installed successfully`);
      return pluginId;
    } catch (error) {
      console.error(`Failed to install plugin from file:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstall(pluginId: string): Promise<void> {
    try {
      const plugin = this.registry.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      console.log(`Uninstalling plugin: ${pluginId}`);
      
      // Disable first if enabled
      if (this.registry.getStatus(pluginId) === 'enabled') {
        await this.disable(pluginId);
      }
      
      // Cleanup context
      this.cleanupPluginContext(pluginId);
      
      // Unregister from registry
      await this.registry.unregister(pluginId);
      
      this.eventEmitter.emit('plugin:uninstalled', { 
        pluginId, 
        pluginName: pluginId,
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${pluginId} uninstalled successfully`);
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    try {
      const plugin = this.registry.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      console.log(`Enabling plugin: ${pluginId}`);
      
      // Create context for plugin (already created during registration)
      // Track stats
      this.pluginStats.set(pluginId, {
        memoryUsage: 0,
        startTime: Date.now()
      });
      
      // Enable in registry
      await this.registry.enable(pluginId);
      
      this.eventEmitter.emit('plugin:enabled', { 
        pluginId, 
        pluginName: pluginId,
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${pluginId} enabled successfully`);
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      
      // Cleanup on failure
      this.cleanupPluginContext(pluginId);
      
      throw error;
    }
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    try {
      const plugin = this.registry.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      
      console.log(`Disabling plugin: ${pluginId}`);
      
      // Disable in registry
      await this.registry.disable(pluginId);
      
      // Cleanup context
      this.cleanupPluginContext(pluginId);
      
      this.eventEmitter.emit('plugin:disabled', { 
        pluginId, 
        pluginName: pluginId,
        timestamp: Date.now() 
      });
      
      console.log(`Plugin ${pluginId} disabled successfully`);
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin statistics
   */
  getStats(): PluginStats {
    const allPlugins = this.registry.getAllPlugins();
    const enabled = allPlugins.filter(({ status }) => status === 'enabled').length;
    const disabled = allPlugins.filter(({ status }) => status === 'disabled').length;
    const failed = allPlugins.filter(({ status }) => status === 'error').length;
    
    let totalMemory = 0;
    for (const stats of this.pluginStats.values()) {
      totalMemory += stats.memoryUsage;
    }
    
    return {
      total: allPlugins.length,
      enabled,
      disabled,
      failed,
      memory: totalMemory
    };
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId: string): { plugin: PluginInfo; status: PluginStatus } | null {
    const pluginData = this.registry.getPlugin(pluginId);
    if (!pluginData) return null;
    
    return {
      plugin: pluginData,
      status: pluginData.status
    };
  }

  /**
   * List all plugins
   */
  listPlugins(): Array<{ id: string; plugin: PluginInfo; status: PluginStatus }> {
    return this.registry.getAllPlugins().map(data => ({
      id: data.manifest.name, // Use manifest name as ID
      plugin: data,
      status: data.status
    }));
  }

  /**
   * Search plugins
   */
  searchPlugins(query: string): Array<{ id: string; plugin: PluginInfo; status: PluginStatus }> {
    const allPlugins = this.listPlugins();
    const lowercaseQuery = query.toLowerCase();
    
    return allPlugins.filter(({ plugin }) => 
      plugin.manifest.name.toLowerCase().includes(lowercaseQuery) ||
      (plugin.manifest.description && plugin.manifest.description.toLowerCase().includes(lowercaseQuery)) ||
      (plugin.manifest.author && plugin.manifest.author.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    const context = this.registry.getContext(pluginId);
    if (!context) {
      throw new Error(`Plugin ${pluginId} is not enabled`);
    }
    
    // Update configuration in registry
    await this.registry.updateConfig(pluginId, { settings: config });
    
    this.eventEmitter.emit('plugin:config-updated', { 
      pluginId, 
      config,
      timestamp: Date.now() 
    });
  }

  /**
   * Get event emitter for plugin events
   */
  getEventEmitter(): PluginEventEmitter {
    return this.eventEmitter;
  }

  /**
   * Cleanup and destroy
   */
  async destroy(): Promise<void> {
    console.log('Destroying Plugin Manager...');
    
    // Disable all plugins
    const enabledPlugins = this.registry.getAllPlugins()
      .filter(({ status }) => status === 'enabled')
      .map(plugin => plugin.manifest.name);
    
    for (const pluginId of enabledPlugins) {
      try {
        await this.disable(pluginId);
      } catch (error) {
        console.error(`Failed to disable plugin ${pluginId} during cleanup:`, error);
      }
    }
    
    // Clear all data
    this.pluginStats.clear();
    
    this.eventEmitter.emit('manager:destroyed', { timestamp: Date.now() });
    console.log('Plugin Manager destroyed');
  }

  /**
   * Register a plugin with the registry
   */
  private async registerPlugin(plugin: Plugin, manifest: PluginManifest): Promise<void> {
    // Check for conflicts
    const existingPlugin = this.registry.getPlugin(plugin.name);
    if (existingPlugin) {
      throw new Error(`Plugin with name '${plugin.name}' already exists`);
    }
    
    // Register with registry
    await this.registry.register(plugin, manifest);
  }

  /**
   * Cleanup plugin context
   */
  private cleanupPluginContext(pluginId: string): void {
    const context = this.registry.getContext(pluginId);
    if (context && 'destroy' in context && typeof context.destroy === 'function') {
      try {
        (context as any).destroy();
      } catch (error) {
        console.error(`Error cleaning up context for plugin ${pluginId}:`, error);
      }
    }
    
    this.pluginStats.delete(pluginId);
  }

  /**
   * Load configuration from storage
   */
  private async loadConfiguration(): Promise<void> {
    try {
      // Load from chrome storage or other persistence layer
      // For now, use defaults
      console.log('Plugin configuration loaded');
    } catch (error) {
      console.warn('Failed to load plugin configuration, using defaults:', error);
    }
  }

  /**
   * Auto-load plugins on startup
   */
  private async autoLoadPlugins(): Promise<void> {
    console.log('Auto-loading plugins...');
    
    // For now, we don't have any built-in plugins
    // This would scan plugin directories and load found plugins
    
    console.log('Auto-load complete');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.eventEmitter.on('plugin:error', (event) => {
      console.error('Plugin error:', event);
    });
    
    this.eventEmitter.on('plugin:warning', (event) => {
      console.warn('Plugin warning:', event);
    });
  }
}

import type { 
  PluginContext, 
  PluginConfig, 
  PluginEventEmitter, 
  PluginLogger 
} from '@scriptpilot/types';
import type { ScriptService } from '@scriptpilot/core';
import { PluginEventEmitterImpl } from './PluginEventEmitter';
import { PluginLoggerImpl } from './PluginLogger';

/**
 * Plugin context implementation
 */
export class PluginContextImpl implements PluginContext {
  scriptService: ScriptService;
  storageService: any; // TODO: Type when storage is available
  eventEmitter: PluginEventEmitter;
  config: PluginConfig;
  logger: PluginLogger;

  constructor(
    scriptService: ScriptService,
    storageService: any,
    config: PluginConfig,
    pluginName: string,
    debugEnabled = false
  ) {
    this.scriptService = scriptService;
    this.storageService = storageService;
    this.config = config;
    this.eventEmitter = new PluginEventEmitterImpl();
    this.logger = new PluginLoggerImpl(pluginName, debugEnabled);
  }

  /**
   * Update plugin configuration
   */
  updateConfig(updates: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...updates };
    this.eventEmitter.emit('config:updated', this.config);
  }

  /**
   * Get plugin setting
   */
  getSetting<T = unknown>(key: string, defaultValue?: T): T | undefined {
    return (this.config.settings[key] as T) ?? defaultValue;
  }

  /**
   * Set plugin setting
   */
  setSetting(key: string, value: unknown): void {
    this.config.settings[key] = value;
    this.config.updatedAt = new Date();
    this.eventEmitter.emit('setting:changed', { key, value });
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable plugin
   */
  enable(): void {
    this.config.enabled = true;
    this.config.updatedAt = new Date();
    this.eventEmitter.emit('plugin:enabled');
  }

  /**
   * Disable plugin
   */
  disable(): void {
    this.config.enabled = false;
    this.config.updatedAt = new Date();
    this.eventEmitter.emit('plugin:disabled');
  }

  /**
   * Get plugin uptime
   */
  getUptime(): number {
    return Date.now() - this.config.installedAt.getTime();
  }

  /**
   * Create a scoped storage key
   */
  createStorageKey(key: string): string {
    return `plugin:${this.config.settings.name || 'unknown'}:${key}`;
  }

  /**
   * Store plugin data
   */
  async setData<T = unknown>(key: string, value: T): Promise<void> {
    if (this.storageService) {
      const scopedKey = this.createStorageKey(key);
      await this.storageService.set(scopedKey, value);
    }
  }

  /**
   * Retrieve plugin data
   */
  async getData<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined> {
    if (this.storageService) {
      const scopedKey = this.createStorageKey(key);
      return await this.storageService.get(scopedKey) ?? defaultValue;
    }
    return defaultValue;
  }

  /**
   * Remove plugin data
   */
  async removeData(key: string): Promise<void> {
    if (this.storageService) {
      const scopedKey = this.createStorageKey(key);
      await this.storageService.remove(scopedKey);
    }
  }

  /**
   * Clear all plugin data
   */
  async clearData(): Promise<void> {
    if (this.storageService) {
      // This would need implementation in storage service
      this.logger.warn('clearData not implemented yet');
    }
  }

  /**
   * Dispose of the context (cleanup)
   */
  dispose(): void {
    if ('removeAllListeners' in this.eventEmitter) {
      (this.eventEmitter as any).removeAllListeners();
    }
    this.logger.debug('Plugin context disposed');
  }
}

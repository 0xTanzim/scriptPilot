// Plugin system interfaces for ScriptPilot extensibility
import type { ScriptService } from './services';

export interface Plugin {
  /** Unique plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin registration function */
  register: (context: PluginContext) => Promise<void> | void;
  /** Plugin cleanup function */
  unregister?: (context: PluginContext) => Promise<void> | void;
  /** Plugin activation function */
  activate?: (context: PluginContext) => Promise<void> | void;
  /** Plugin deactivation function */
  deactivate?: (context: PluginContext) => Promise<void> | void;
}

export interface PluginContext {
  /** Script service for interacting with scripts */
  scriptService: ScriptService;
  /** Storage service for plugin data */
  storageService: any; // Will be properly typed when storage service is created
  /** Event emitter for plugin communication */
  eventEmitter: PluginEventEmitter;
  /** Plugin configuration */
  config: PluginConfig;
  /** Logger instance */
  logger: PluginLogger;
}

export interface PluginConfig {
  /** Plugin settings */
  settings: Record<string, unknown>;
  /** Plugin enabled state */
  enabled: boolean;
  /** Plugin installation timestamp */
  installedAt: Date;
  /** Plugin update timestamp */
  updatedAt: Date;
}

export interface PluginEventEmitter {
  /** Subscribe to events */
  on(event: string, listener: (...args: unknown[]) => void): void;
  /** Unsubscribe from events */
  off(event: string, listener: (...args: unknown[]) => void): void;
  /** Emit events */
  emit(event: string, ...args: unknown[]): void;
  /** Subscribe once */
  once(event: string, listener: (...args: unknown[]) => void): void;
}

export interface PluginLogger {
  /** Log info message */
  info(message: string, ...args: unknown[]): void;
  /** Log warning message */
  warn(message: string, ...args: unknown[]): void;
  /** Log error message */
  error(message: string, ...args: unknown[]): void;
  /** Log debug message */
  debug(message: string, ...args: unknown[]): void;
}

export interface PluginManifest {
  /** Plugin metadata */
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  license?: string;
  /** Plugin entry point */
  main: string;
  /** Plugin dependencies */
  dependencies?: Record<string, string>;
  /** Plugin permissions */
  permissions?: PluginPermissions;
  /** Plugin configuration schema */
  configSchema?: PluginConfigSchema;
}

export interface PluginPermissions {
  /** Access to script execution */
  scriptExecution?: boolean;
  /** Access to storage */
  storage?: boolean;
  /** Access to network requests */
  network?: boolean;
  /** Access to browser tabs */
  tabs?: boolean;
  /** Access to notifications */
  notifications?: boolean;
  /** Access to clipboard */
  clipboard?: boolean;
}

export interface PluginConfigSchema {
  /** Schema type */
  type: 'object';
  /** Schema properties */
  properties: Record<string, PluginConfigProperty>;
  /** Required properties */
  required?: string[];
}

export interface PluginConfigProperty {
  /** Property type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  /** Property title */
  title?: string;
  /** Property description */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Allowed values (for enums) */
  enum?: unknown[];
  /** Minimum value (for numbers) */
  minimum?: number;
  /** Maximum value (for numbers) */
  maximum?: number;
  /** Pattern (for strings) */
  pattern?: string;
}

export type PluginStatus =
  | 'installed'
  | 'enabled'
  | 'disabled'
  | 'error'
  | 'updating';

export interface PluginInfo {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Plugin status */
  status: PluginStatus;
  /** Plugin configuration */
  config: PluginConfig;
  /** Plugin installation path */
  path: string;
  /** Plugin error (if any) */
  error?: string;
}

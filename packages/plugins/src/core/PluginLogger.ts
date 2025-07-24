import type { PluginLogger } from '@scriptpilot/types';

/**
 * Logger implementation for plugins
 */
export class PluginLoggerImpl implements PluginLogger {
  private pluginName: string;
  private debugEnabled: boolean;

  constructor(pluginName: string, debugEnabled = false) {
    this.pluginName = pluginName;
    this.debugEnabled = debugEnabled;
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    console.info(`[Plugin:${this.pluginName}] ${message}`, ...args);
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[Plugin:${this.pluginName}] ${message}`, ...args);
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    console.error(`[Plugin:${this.pluginName}] ${message}`, ...args);
  }

  /**
   * Log debug message (only if debug is enabled)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.debugEnabled) {
      console.debug(`[Plugin:${this.pluginName}:DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Enable/disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  /**
   * Check if debug logging is enabled
   */
  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): PluginLogger {
    return new PluginLoggerImpl(
      `${this.pluginName}:${prefix}`,
      this.debugEnabled
    );
  }

  /**
   * Log with custom level
   */
  log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    ...args: unknown[]
  ): void {
    switch (level) {
      case 'info':
        this.info(message, ...args);
        break;
      case 'warn':
        this.warn(message, ...args);
        break;
      case 'error':
        this.error(message, ...args);
        break;
      case 'debug':
        this.debug(message, ...args);
        break;
    }
  }

  /**
   * Create a performance timer
   */
  time(label: string): void {
    console.time(`[Plugin:${this.pluginName}] ${label}`);
  }

  /**
   * End performance timer
   */
  timeEnd(label: string): void {
    console.timeEnd(`[Plugin:${this.pluginName}] ${label}`);
  }

  /**
   * Log performance mark
   */
  timeLog(label: string, ...args: unknown[]): void {
    console.timeLog(`[Plugin:${this.pluginName}] ${label}`, ...args);
  }
}

/**
 * ScriptPilot Core Plugin
 * @name ScriptPilotCore
 * @version 1.0.0
 * @description Core functionality and utilities for ScriptPilot
 * @author ScriptPilot Team
 * @license MIT
 * @permission storage:true
 * @permission scripting:true
 */

import type { Plugin, PluginContext } from '@scriptpilot/types';

/**
 * Core plugin helper functions
 */
const CorePluginHelpers = {
  /**
   * Register core utilities
   */
  registerUtils(context: PluginContext): void {
    const logger = context.logger;
    
    // Add utility functions to global ScriptPilot namespace
    const utils = {
      /**
       * Get current ScriptPilot version
       */
      getVersion(): string {
        return '1.0.0';
      },

      /**
       * Check if a script is enabled
       */
      async isScriptEnabled(scriptId: string): Promise<boolean> {
        try {
          const storage = context.storageService;
          const scriptData = await storage.get(`script_${scriptId}`);
          return scriptData?.enabled === true;
        } catch {
          return false;
        }
      },

      /**
       * Get script metadata
       */
      async getScriptMetadata(scriptId: string): Promise<any> {
        try {
          const storage = context.storageService;
          return await storage.get(`script_metadata_${scriptId}`);
        } catch {
          return null;
        }
      },

      /**
       * Format script execution statistics
       */
      formatStats(stats: { execCount: number; lastExec: number; avgTime: number }): string {
        const lastExecDate = new Date(stats.lastExec).toLocaleDateString();
        return `Executed ${stats.execCount} times, last: ${lastExecDate}, avg: ${stats.avgTime}ms`;
      },

      /**
       * Validate script syntax
       */
      validateScript(code: string): { valid: boolean; errors: string[] } {
        try {
          // Basic syntax validation
          new Function(code);
          return { valid: true, errors: [] };
        } catch (error) {
          return { 
            valid: false, 
            errors: [error instanceof Error ? error.message : 'Unknown syntax error'] 
          };
        }
      },

      /**
       * Generate unique ID
       */
      generateId(): string {
        return 'sp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
      },

      /**
       * Safe JSON parse with fallback
       */
      safeJsonParse(str: string, fallback: any = null): any {
        try {
          return JSON.parse(str);
        } catch {
          return fallback;
        }
      },

      /**
       * Debounce function calls
       */
      debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
        let timeout: NodeJS.Timeout;
        return ((...args: any[]) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        }) as T;
      },

      /**
       * Throttle function calls
       */
      throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
        let inThrottle: boolean;
        return ((...args: any[]) => {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        }) as T;
      }
    };

    // Make utils available through context
    (context as any).utils = utils;
    logger.info('Core utilities registered');
  },

  /**
   * Register core events
   */
  registerEvents(context: PluginContext): void {
    const logger = context.logger;
    const eventEmitter = context.eventEmitter;

    // Register event handlers for core functionality
    eventEmitter.on('script:executed', (data: any) => {
      logger.debug('Script executed:', data);
      
      // Track execution statistics
      CorePluginHelpers.trackScriptExecution(context, data);
    });

    eventEmitter.on('script:error', (data: any) => {
      logger.error('Script execution error:', data);
      
      // Track error statistics
      CorePluginHelpers.trackScriptError(context, data);
    });

    eventEmitter.on('plugin:installed', (data: any) => {
      logger.info('Plugin installed:', data);
    });

    eventEmitter.on('plugin:uninstalled', (data: any) => {
      logger.info('Plugin uninstalled:', data);
    });

    logger.info('Core event handlers registered');
  },

  /**
   * Register core commands
   */
  registerCommands(context: PluginContext): void {
    const logger = context.logger;

    // Core commands that can be triggered by other plugins or UI
    const commands = {
      'core:reload': async () => {
        logger.info('Reloading ScriptPilot...');
        // Reload logic would go here
        return { success: true, message: 'ScriptPilot reloaded' };
      },

      'core:clear-cache': async () => {
        logger.info('Clearing cache...');
        const storage = context.storageService;
        
        // Clear temporary cache data
        const keys = await storage.keys();
        const cacheKeys = keys.filter((key: string) => key.startsWith('cache_'));
        
        for (const key of cacheKeys) {
          await storage.remove(key);
        }
        
        return { success: true, message: `Cleared ${cacheKeys.length} cache entries` };
      },

      'core:export-settings': async () => {
        logger.info('Exporting settings...');
        const storage = context.storageService;
        
        // Export all settings
        const keys = await storage.keys();
        const settingsKeys = keys.filter((key: string) => key.startsWith('setting_'));
        const settings: Record<string, any> = {};
        
        for (const key of settingsKeys) {
          settings[key] = await storage.get(key);
        }
        
        return { 
          success: true, 
          data: settings,
          message: `Exported ${Object.keys(settings).length} settings` 
        };
      },

      'core:import-settings': async (settingsData: Record<string, any>) => {
        logger.info('Importing settings...');
        const storage = context.storageService;
        
        let imported = 0;
        for (const [key, value] of Object.entries(settingsData)) {
          if (key.startsWith('setting_')) {
            await storage.set(key, value);
            imported++;
          }
        }
        
        return { 
          success: true, 
          message: `Imported ${imported} settings` 
        };
      }
    };

    // Register commands with context
    (context as any).commands = commands;
    logger.info('Core commands registered');
  },

  /**
   * Track script execution statistics
   */
  async trackScriptExecution(context: PluginContext, data: any): Promise<void> {
    try {
      const storage = context.storageService;
      const scriptId = data.scriptId;
      
      if (!scriptId) return;
      
      const statsKey = `stats_${scriptId}`;
      const stats = await storage.get(statsKey) || {
        execCount: 0,
        lastExec: 0,
        totalTime: 0,
        avgTime: 0
      };
      
      stats.execCount++;
      stats.lastExec = Date.now();
      stats.totalTime += data.executionTime || 0;
      stats.avgTime = stats.totalTime / stats.execCount;
      
      await storage.set(statsKey, stats);
    } catch (error) {
      context.logger.error('Failed to track script execution:', error);
    }
  },

  /**
   * Track script error statistics
   */
  async trackScriptError(context: PluginContext, data: any): Promise<void> {
    try {
      const storage = context.storageService;
      const scriptId = data.scriptId;
      
      if (!scriptId) return;
      
      const errorsKey = `errors_${scriptId}`;
      const errors = await storage.get(errorsKey) || [];
      
      errors.push({
        timestamp: Date.now(),
        error: data.error,
        url: data.url
      });
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      await storage.set(errorsKey, errors);
    } catch (error) {
      context.logger.error('Failed to track script error:', error);
    }
  }
};

/**
 * Core plugin that provides essential ScriptPilot functionality
 */
export const ScriptPilotCorePlugin: Plugin = {
  name: 'ScriptPilotCore',
  version: '1.0.0',

  /**
   * Register the core plugin
   */
  async register(context: PluginContext): Promise<void> {
    const logger = context.logger;
    logger.info('Registering ScriptPilot Core Plugin');

    // Register core utilities
    CorePluginHelpers.registerUtils(context);
    
    // Register core events
    CorePluginHelpers.registerEvents(context);
    
    // Register core commands
    CorePluginHelpers.registerCommands(context);

    logger.info('ScriptPilot Core Plugin registered successfully');
  },

  /**
   * Unregister the core plugin
   */
  async unregister(context: PluginContext): Promise<void> {
    const logger = context.logger;
    logger.info('Unregistering ScriptPilot Core Plugin');

    // Cleanup would go here
    
    logger.info('ScriptPilot Core Plugin unregistered');
  }
};

export default ScriptPilotCorePlugin;

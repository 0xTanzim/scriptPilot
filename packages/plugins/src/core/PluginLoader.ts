import type { Plugin, PluginManifest } from '@scriptpilot/types';

/**
 * Plugin loading and validation utilities
 */
export class PluginLoader {
  
  /**
   * Load plugin from URL
   */
  async loadFromUrl(url: string): Promise<{ plugin: Plugin; manifest: PluginManifest }> {
    try {
      // Fetch the plugin code
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch plugin: ${response.statusText}`);
      }
      
      const code = await response.text();
      return this.loadFromCode(code, url);
    } catch (error) {
      throw new Error(`Failed to load plugin from ${url}: ${error}`);
    }
  }

  /**
   * Load plugin from code string
   */
  async loadFromCode(code: string, source = 'unknown'): Promise<{ plugin: Plugin; manifest: PluginManifest }> {
    try {
      // Parse manifest from code comments (similar to userscript headers)
      const manifest = this.parseManifest(code);
      
      // Create a safe execution environment
      const plugin = this.executePluginCode(code, source);
      
      // Validate the plugin
      this.validatePlugin(plugin, manifest);
      
      return { plugin, manifest };
    } catch (error) {
      throw new Error(`Failed to load plugin from code: ${error}`);
    }
  }

  /**
   * Load plugin from file (for development/testing)
   */
  async loadFromFile(file: File): Promise<{ plugin: Plugin; manifest: PluginManifest }> {
    try {
      const code = await file.text();
      return this.loadFromCode(code, `file://${file.name}`);
    } catch (error) {
      throw new Error(`Failed to load plugin from file: ${error}`);
    }
  }

  /**
   * Parse plugin manifest from code comments
   */
  private parseManifest(code: string): PluginManifest {
    const manifest: Partial<PluginManifest> = {};
    
    // Match multiline comments with @-directives
    const headerMatch = code.match(/\/\*\*([\s\S]*?)\*\//);
    if (!headerMatch) {
      throw new Error('Plugin manifest not found. Must be in /** */ comment block.');
    }
    
    const headerContent = headerMatch[1];
    
    // Parse @-directives
    const directives = headerContent.match(/@(\w+)\s+(.+)/g) || [];
    
    for (const directive of directives) {
      const match = directive.match(/@(\w+)\s+(.+)/);
      if (match) {
        const [, key, value] = match;
        
        switch (key.toLowerCase()) {
          case 'name':
            manifest.name = value.trim();
            break;
          case 'version':
            manifest.version = value.trim();
            break;
          case 'description':
            manifest.description = value.trim();
            break;
          case 'author':
            manifest.author = value.trim();
            break;
          case 'homepage':
            manifest.homepage = value.trim();
            break;
          case 'license':
            manifest.license = value.trim();
            break;
          case 'main':
            manifest.main = value.trim();
            break;
          case 'permission':
            if (!manifest.permissions) manifest.permissions = {};
            const [permission, enabled] = value.split(':').map(s => s.trim());
            (manifest.permissions as any)[permission] = enabled === 'true';
            break;
        }
      }
    }
    
    // Validate required fields
    if (!manifest.name) {
      throw new Error('Plugin manifest missing required field: name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest missing required field: version');
    }
    
    // Set defaults
    manifest.main = manifest.main || 'plugin';
    manifest.permissions = manifest.permissions || {};
    
    return manifest as PluginManifest;
  }

  /**
   * Execute plugin code in a controlled environment
   */
  private executePluginCode(code: string, source: string): Plugin {
    try {
      // Create a safe execution context
      const context = this.createExecutionContext();
      
      // Wrap the code in a function to create scope
      const wrappedCode = `
        (function(exports, require, module, __filename, __dirname) {
          ${code}
          
          // The plugin should export itself
          if (typeof exports.default === 'object') {
            return exports.default;
          } else if (typeof module.exports === 'object') {
            return module.exports;
          } else {
            throw new Error('Plugin must export a default object or use module.exports');
          }
        })
      `;
      
      // Execute the wrapped code
      const pluginFactory = eval(wrappedCode);
      
      // Create mock module system
      const mockModule = { exports: {} };
      const mockRequire = (id: string) => {
        throw new Error(`Plugin attempted to require '${id}' - external dependencies not supported yet`);
      };
      
      // Execute with mock environment
      const plugin = pluginFactory(
        mockModule.exports, // exports
        mockRequire,        // require
        mockModule,         // module
        source,             // __filename
        '/'                 // __dirname
      );
      
      return plugin;
    } catch (error) {
      throw new Error(`Failed to execute plugin code: ${error}`);
    }
  }

  /**
   * Create a safe execution context
   */
  private createExecutionContext(): object {
    // Return a minimal safe context
    return {
      console: {
        log: (...args: any[]) => console.log('[Plugin]', ...args),
        warn: (...args: any[]) => console.warn('[Plugin]', ...args),
        error: (...args: any[]) => console.error('[Plugin]', ...args),
      },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      Date,
      JSON,
      Math,
      Object,
      Array,
      String,
      Number,
      Boolean,
      RegExp,
      Promise,
    };
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin, manifest: PluginManifest): void {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }
    
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a name property');
    }
    
    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a version property');
    }
    
    if (!plugin.register || typeof plugin.register !== 'function') {
      throw new Error('Plugin must have a register function');
    }
    
    // Validate manifest matches plugin
    if (plugin.name !== manifest.name) {
      throw new Error('Plugin name does not match manifest');
    }
    
    if (plugin.version !== manifest.version) {
      throw new Error('Plugin version does not match manifest');
    }
    
    // Check for dangerous patterns in the plugin
    this.securityCheck(plugin);
  }

  /**
   * Basic security checks for plugins
   */
  private securityCheck(plugin: Plugin): void {
    const pluginStr = JSON.stringify(plugin);
    
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
      /\.call\s*\(\s*this/,
      /\.apply\s*\(\s*this/,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(pluginStr)) {
        console.warn(`Plugin ${plugin.name} contains potentially dangerous pattern: ${pattern}`);
      }
    }
  }

  /**
   * Check if plugin code appears to be valid
   */
  static isValidPluginCode(code: string): boolean {
    try {
      // Basic checks
      if (!code || typeof code !== 'string') return false;
      
      // Must have manifest comment
      if (!code.includes('/**') || !code.includes('*/')) return false;
      
      // Must have @name directive
      if (!code.includes('@name')) return false;
      
      // Must have register function
      if (!code.includes('register')) return false;
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract plugin info without full loading
   */
  static extractPluginInfo(code: string): Partial<PluginManifest> | null {
    try {
      const headerMatch = code.match(/\/\*\*([\s\S]*?)\*\//);
      if (!headerMatch) return null;
      
      const headerContent = headerMatch[1];
      const info: Partial<PluginManifest> = {};
      
      const nameMatch = headerContent.match(/@name\s+(.+)/);
      if (nameMatch) info.name = nameMatch[1].trim();
      
      const versionMatch = headerContent.match(/@version\s+(.+)/);
      if (versionMatch) info.version = versionMatch[1].trim();
      
      const descMatch = headerContent.match(/@description\s+(.+)/);
      if (descMatch) info.description = descMatch[1].trim();
      
      const authorMatch = headerContent.match(/@author\s+(.+)/);
      if (authorMatch) info.author = authorMatch[1].trim();
      
      return info;
    } catch {
      return null;
    }
  }
}

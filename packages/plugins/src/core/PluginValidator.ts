import type {
  Plugin,
  PluginManifest,
  PluginPermissions,
} from '@scriptpilot/types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

/**
 * Plugin security level
 */
export type SecurityLevel = 'strict' | 'moderate' | 'permissive';

/**
 * Validation configuration
 */
export interface ValidationConfig {
  /** Security level for validation */
  securityLevel: SecurityLevel;
  /** Whether to allow native code execution */
  allowNativeCode: boolean;
  /** Whether to allow network access */
  allowNetworkAccess: boolean;
  /** Whether to allow file system access */
  allowFileAccess: boolean;
  /** Maximum plugin size in bytes */
  maxSize: number;
  /** Required manifest version */
  requiredManifestVersion?: string;
}

/**
 * Plugin validation utility
 */
export class PluginValidator {
  private config: ValidationConfig;

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = {
      securityLevel: 'moderate',
      allowNativeCode: false,
      allowNetworkAccess: true,
      allowFileAccess: false,
      maxSize: 1024 * 1024, // 1MB
      ...config,
    };
  }

  /**
   * Validate a plugin and its manifest
   */
  validate(
    plugin: Plugin,
    manifest: PluginManifest,
    code?: string
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      securityIssues: [],
    };

    // Validate manifest
    this.validateManifest(manifest, result);

    // Validate plugin structure
    this.validatePluginStructure(plugin, result);

    // Validate permissions
    this.validatePermissions(manifest.permissions || {}, result);

    // Security analysis
    if (code) {
      this.performSecurityAnalysis(code, result);
    }

    // Cross-validation
    this.crossValidate(plugin, manifest, result);

    // Set overall validity
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(
    manifest: PluginManifest,
    result: ValidationResult
  ): void {
    // Required fields
    if (!manifest.name || typeof manifest.name !== 'string') {
      result.errors.push('Manifest missing required field: name');
    } else if (manifest.name.length < 3) {
      result.errors.push('Plugin name must be at least 3 characters long');
    } else if (manifest.name.length > 50) {
      result.errors.push('Plugin name must be less than 50 characters');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      result.errors.push('Manifest missing required field: version');
    } else if (!this.isValidVersion(manifest.version)) {
      result.errors.push(
        'Invalid version format. Use semantic versioning (e.g., 1.0.0)'
      );
    }

    // Optional but recommended fields
    if (!manifest.description) {
      result.warnings.push('Manifest missing description field');
    } else if (manifest.description.length > 500) {
      result.warnings.push('Description is too long (max 500 characters)');
    }

    if (!manifest.author) {
      result.warnings.push('Manifest missing author field');
    }

    if (!manifest.license) {
      result.warnings.push('Manifest missing license field');
    }

    // Validate homepage URL if provided
    if (manifest.homepage && !this.isValidUrl(manifest.homepage)) {
      result.errors.push('Invalid homepage URL');
    }

    // Check for reserved names
    if (this.isReservedName(manifest.name)) {
      result.errors.push(`Plugin name '${manifest.name}' is reserved`);
    }

    // Validate manifest version (if supported in future)
    if (
      this.config.requiredManifestVersion &&
      'manifestVersion' in manifest &&
      (manifest as any).manifestVersion !== this.config.requiredManifestVersion
    ) {
      result.errors.push(
        `Manifest version must be ${this.config.requiredManifestVersion}`
      );
    }
  }

  /**
   * Validate plugin structure
   */
  private validatePluginStructure(
    plugin: Plugin,
    result: ValidationResult
  ): void {
    if (!plugin || typeof plugin !== 'object') {
      result.errors.push('Plugin must be an object');
      return;
    }

    // Required properties
    if (!plugin.name || typeof plugin.name !== 'string') {
      result.errors.push('Plugin missing required property: name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      result.errors.push('Plugin missing required property: version');
    }

    if (!plugin.register || typeof plugin.register !== 'function') {
      result.errors.push('Plugin missing required method: register');
    }

    // Optional methods
    if ('enable' in plugin && typeof plugin.enable !== 'function') {
      result.errors.push('Plugin enable must be a function');
    }

    if ('disable' in plugin && typeof plugin.disable !== 'function') {
      result.errors.push('Plugin disable must be a function');
    }

    // Check for unexpected properties
    const allowedProperties = [
      'name',
      'version',
      'register',
      'unregister',
      'enable',
      'disable',
      'config',
    ];
    const pluginProperties = Object.keys(plugin);
    const unexpectedProps = pluginProperties.filter(
      prop => !allowedProperties.includes(prop)
    );

    if (unexpectedProps.length > 0) {
      result.warnings.push(
        `Plugin has unexpected properties: ${unexpectedProps.join(', ')}`
      );
    }
  }

  /**
   * Validate plugin permissions
   */
  private validatePermissions(
    permissions: PluginPermissions,
    result: ValidationResult
  ): void {
    const allowedPermissions = [
      'storage',
      'network',
      'tabs',
      'scripting',
      'cookies',
      'history',
      'downloads',
      'notifications',
      'fileSystem',
    ];

    for (const [permission, enabled] of Object.entries(permissions)) {
      if (!allowedPermissions.includes(permission)) {
        result.errors.push(`Unknown permission: ${permission}`);
        continue;
      }

      if (typeof enabled !== 'boolean') {
        result.errors.push(`Permission ${permission} must be a boolean`);
        continue;
      }

      // Security checks based on configuration
      if (enabled) {
        switch (permission) {
          case 'network':
            if (!this.config.allowNetworkAccess) {
              result.securityIssues.push(
                'Network access not allowed in current security level'
              );
            }
            break;
          case 'fileSystem':
            if (!this.config.allowFileAccess) {
              result.securityIssues.push(
                'File system access not allowed in current security level'
              );
            }
            break;
          case 'scripting':
            if (this.config.securityLevel === 'strict') {
              result.securityIssues.push(
                'Script injection not allowed in strict security mode'
              );
            }
            break;
        }
      }
    }

    // Warn about sensitive permissions
    const sensitivePermissions = [
      'scripting',
      'fileSystem',
      'cookies',
      'history',
    ];
    const enabledSensitivePerms = sensitivePermissions.filter(
      perm => perm in permissions && (permissions as any)[perm]
    );

    if (enabledSensitivePerms.length > 0) {
      result.warnings.push(
        `Plugin requests sensitive permissions: ${enabledSensitivePerms.join(', ')}`
      );
    }
  }

  /**
   * Perform security analysis on plugin code
   */
  private performSecurityAnalysis(
    code: string,
    result: ValidationResult
  ): void {
    // Size check
    if (code.length > this.config.maxSize) {
      result.errors.push(
        `Plugin code exceeds maximum size (${this.config.maxSize} bytes)`
      );
    }

    // Dangerous patterns based on security level
    const dangerousPatterns = this.getDangerousPatterns();

    for (const { pattern, message, level } of dangerousPatterns) {
      if (this.shouldCheckPattern(level) && pattern.test(code)) {
        result.securityIssues.push(message);
      }
    }

    // Check for obfuscated code
    if (this.isObfuscated(code)) {
      result.securityIssues.push('Plugin appears to contain obfuscated code');
    }

    // Check for minified code without source map
    if (this.isMinified(code) && !code.includes('sourceMappingURL')) {
      result.warnings.push('Plugin appears to be minified without source map');
    }

    // Check for eval usage
    if (this.hasEval(code)) {
      if (this.config.securityLevel === 'strict') {
        result.securityIssues.push(
          'Use of eval() is not allowed in strict mode'
        );
      } else {
        result.warnings.push('Plugin uses eval() which may be unsafe');
      }
    }

    // Check for native code execution
    if (this.hasNativeCode(code) && !this.config.allowNativeCode) {
      result.securityIssues.push('Native code execution not allowed');
    }
  }

  /**
   * Cross-validate plugin and manifest consistency
   */
  private crossValidate(
    plugin: Plugin,
    manifest: PluginManifest,
    result: ValidationResult
  ): void {
    // Name consistency
    if (plugin.name !== manifest.name) {
      result.errors.push('Plugin name does not match manifest name');
    }

    // Version consistency
    if (plugin.version !== manifest.version) {
      result.errors.push('Plugin version does not match manifest version');
    }
  }

  /**
   * Get dangerous code patterns based on security level
   */
  private getDangerousPatterns(): Array<{
    pattern: RegExp;
    message: string;
    level: SecurityLevel;
  }> {
    return [
      {
        pattern: /eval\s*\(/gi,
        message: 'Use of eval() function detected',
        level: 'permissive',
      },
      {
        pattern: /Function\s*\(/gi,
        message: 'Use of Function constructor detected',
        level: 'permissive',
      },
      {
        pattern: /document\.write/gi,
        message: 'Use of document.write detected',
        level: 'moderate',
      },
      {
        pattern: /innerHTML\s*=/gi,
        message: 'Direct innerHTML assignment detected',
        level: 'moderate',
      },
      {
        pattern: /outerHTML\s*=/gi,
        message: 'Direct outerHTML assignment detected',
        level: 'moderate',
      },
      {
        pattern: /\.call\s*\(\s*null/gi,
        message: 'Suspicious function call pattern detected',
        level: 'strict',
      },
      {
        pattern: /setInterval\s*\(\s*["'].*["']/gi,
        message: 'String-based setInterval detected',
        level: 'moderate',
      },
      {
        pattern: /setTimeout\s*\(\s*["'].*["']/gi,
        message: 'String-based setTimeout detected',
        level: 'moderate',
      },
      {
        pattern: /new\s+ActiveXObject/gi,
        message: 'ActiveX object creation detected',
        level: 'strict',
      },
      {
        pattern: /chrome\.runtime\.reload/gi,
        message: 'Extension reload attempt detected',
        level: 'strict',
      },
    ];
  }

  /**
   * Check if pattern should be validated based on security level
   */
  private shouldCheckPattern(patternLevel: SecurityLevel): boolean {
    const levels: SecurityLevel[] = ['strict', 'moderate', 'permissive'];
    const currentIndex = levels.indexOf(this.config.securityLevel);
    const patternIndex = levels.indexOf(patternLevel);

    return currentIndex <= patternIndex;
  }

  /**
   * Check if version string is valid
   */
  private isValidVersion(version: string): boolean {
    const semverRegex =
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  /**
   * Check if URL is valid
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if name is reserved
   */
  private isReservedName(name: string): boolean {
    const reserved = [
      'scriptpilot',
      'core',
      'system',
      'admin',
      'root',
      'api',
      'plugin',
      'extension',
      'chrome',
      'firefox',
      'edge',
      'browser',
    ];
    return reserved.includes(name.toLowerCase());
  }

  /**
   * Check if code appears obfuscated
   */
  private isObfuscated(code: string): boolean {
    // Simple heuristics for obfuscation detection
    const lines = code.split('\n');
    const avgLineLength = code.length / lines.length;
    const singleCharVars = (code.match(/\b[a-zA-Z]\b/g) || []).length;
    const totalVars = (code.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [])
      .length;

    return avgLineLength > 500 || singleCharVars / totalVars > 0.3;
  }

  /**
   * Check if code appears minified
   */
  private isMinified(code: string): boolean {
    const lines = code.split('\n');
    const avgLineLength = code.length / lines.length;
    const whitespaceRatio = (code.match(/\s/g) || []).length / code.length;

    return avgLineLength > 200 && whitespaceRatio < 0.1;
  }

  /**
   * Check for eval usage
   */
  private hasEval(code: string): boolean {
    return /\beval\s*\(/.test(code) || /\bFunction\s*\(/.test(code);
  }

  /**
   * Check for native code execution patterns
   */
  private hasNativeCode(code: string): boolean {
    const nativePatterns = [
      /\.so\b/, // Unix shared libraries
      /\.dll\b/, // Windows DLLs
      /\.dylib\b/, // macOS dynamic libraries
      /WebAssembly\./,
      /wasm/i,
      /native/i,
    ];

    return nativePatterns.some(pattern => pattern.test(code));
  }

  /**
   * Update validation configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current validation configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }
}

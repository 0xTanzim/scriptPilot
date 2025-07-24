// Script validation for syntax, security, and compatibility
import type { Script } from '@scriptpilot/types';

// Import service-level ValidationError directly to avoid conflict
interface ValidationError {
  message: string;
  line: number;
  column: number;
  type: 'syntax' | 'metadata' | 'security' | 'compatibility';
}

interface ValidationWarning {
  message: string;
  line: number;
  column: number;
  type: 'deprecated' | 'performance' | 'best-practice';
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: Script['metadata'];
}

/**
 * Validates userscripts for security, syntax, and compatibility issues
 */
export class ScriptValidator {
  private readonly DANGEROUS_PATTERNS = [
    // Eval and function constructors
    /\beval\s*\(/gi,
    /new\s+Function\s*\(/gi,
    /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi,
    /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi,

    // DOM manipulation that could be dangerous
    /document\.write\s*\(/gi,
    /\.innerHTML\s*=/gi,
    /\.outerHTML\s*=/gi,

    // Network requests to sensitive domains
    /fetch\s*\(\s*["'`][^"'`]*localhost/gi,
    /XMLHttpRequest\s*\(\s*["'`][^"'`]*localhost/gi,

    // File system access
    /require\s*\(\s*["'`]fs["'`]/gi,
    /require\s*\(\s*["'`]path["'`]/gi,

    // Process manipulation
    /process\./gi,
    /require\s*\(\s*["'`]child_process["'`]/gi,
  ];

  private readonly DEPRECATED_GM_APIS = [
    'GM_addStyle', // Use GM_addElement instead
    'GM_getResourceText', // Use GM_getResourceURL instead
    'GM_log', // Use console.log instead
  ];

  /**
   * Validate a userscript for security and compatibility
   */
  async validateScript(code: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check for syntax errors
      this.validateSyntax(code, errors);

      // Check for security issues
      this.validateSecurity(code, errors, warnings);

      // Check for deprecated APIs
      this.validateCompatibility(code, warnings);

      // Check metadata format
      const metadata = this.extractMetadata(code);
      if (metadata) {
        this.validateMetadata(metadata, errors, warnings);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata,
      };
    } catch (error) {
      errors.push({
        message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
        line: 0,
        column: 0,
        type: 'syntax',
      });

      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Validate JavaScript syntax
   */
  private validateSyntax(code: string, errors: ValidationError[]): void {
    try {
      // Use Function constructor to check syntax without executing
      new Function(code);
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Try to extract line/column info from error message
        const match = error.message.match(/line (\d+)/i);
        const line = match ? parseInt(match[1], 10) : 0;

        errors.push({
          message: `Syntax error: ${error.message}`,
          line,
          column: 0,
          type: 'syntax',
        });
      } else {
        errors.push({
          message: `Script validation error: ${error instanceof Error ? error.message : String(error)}`,
          line: 0,
          column: 0,
          type: 'syntax',
        });
      }
    }
  }

  /**
   * Check for security vulnerabilities
   */
  private validateSecurity(
    code: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      for (const pattern of this.DANGEROUS_PATTERNS) {
        const match = pattern.exec(line);
        if (match) {
          const severity = this.getSecuritySeverity(pattern);
          const issue = {
            message: `Potentially dangerous code detected: ${match[0]}`,
            line: index + 1,
            column: match.index || 0,
            type: 'security' as const,
          };

          if (severity === 'error') {
            errors.push(issue);
          } else {
            warnings.push({
              ...issue,
              type: 'best-practice' as const,
            });
          }
        }
      }
    });
  }

  /**
   * Check for deprecated GM APIs and compatibility issues
   */
  private validateCompatibility(
    code: string,
    warnings: ValidationWarning[]
  ): void {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      for (const api of this.DEPRECATED_GM_APIS) {
        if (line.includes(api)) {
          warnings.push({
            message: `Deprecated GM API detected: ${api}. Consider using modern alternatives.`,
            line: index + 1,
            column: line.indexOf(api),
            type: 'deprecated',
          });
        }
      }

      // Check for performance issues
      if (
        line.includes('document.querySelector') &&
        line.includes('setInterval')
      ) {
        warnings.push({
          message:
            'Performance warning: DOM queries in intervals can be expensive',
          line: index + 1,
          column: 0,
          type: 'performance',
        });
      }
    });
  }

  /**
   * Extract and validate userscript metadata
   */
  private extractMetadata(code: string): Script['metadata'] | undefined {
    const headerMatch = code.match(
      /\/\/\s*==UserScript==\s*\n([\s\S]*?)\n\s*\/\/\s*==\/UserScript==/
    );
    if (!headerMatch) return undefined;

    const header = headerMatch[1];
    const metadata: Partial<Script['metadata']> = {
      match: [],
      runAt: 'document-end',
    };

    // Parse metadata lines
    const lines = header.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*\/\/\s*@(\w+)\s+(.+)$/);
      if (match) {
        const [, key, value] = match;
        this.parseMetadataField(key, value.trim(), metadata);
      }
    }

    return metadata as Script['metadata'];
  }

  /**
   * Parse individual metadata field
   */
  private parseMetadataField(
    key: string,
    value: string,
    metadata: Partial<Script['metadata']>
  ): void {
    switch (key) {
      case 'name':
        metadata.name = value;
        break;
      case 'namespace':
        metadata.namespace = value;
        break;
      case 'version':
        metadata.version = value;
        break;
      case 'description':
        metadata.description = value;
        break;
      case 'author':
        metadata.author = value;
        break;
      case 'match':
        metadata.match = metadata.match || [];
        metadata.match.push(value);
        break;
      case 'exclude':
        metadata.exclude = metadata.exclude || [];
        metadata.exclude.push(value);
        break;
      case 'include':
        metadata.include = metadata.include || [];
        metadata.include.push(value);
        break;
      case 'run-at':
      case 'runAt':
        if (
          ['document-start', 'document-end', 'document-idle'].includes(value)
        ) {
          metadata.runAt = value as Script['metadata']['runAt'];
        }
        break;
      case 'grant':
        metadata.grant = metadata.grant || [];
        metadata.grant.push(value);
        break;
      case 'updateURL':
        metadata.updateURL = value;
        break;
      case 'downloadURL':
        metadata.downloadURL = value;
        break;
      case 'homepage':
      case 'homepageURL':
        metadata.homepage = value;
        break;
      case 'supportURL':
        metadata.supportURL = value;
        break;
    }
  }

  /**
   * Validate metadata completeness and correctness
   */
  private validateMetadata(
    metadata: Script['metadata'],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required fields
    if (!metadata.name) {
      warnings.push({
        message: 'Script name is missing. Consider adding @name directive.',
        line: 0,
        column: 0,
        type: 'best-practice',
      });
    }

    if (!metadata.match || metadata.match.length === 0) {
      errors.push({
        message:
          'No @match patterns specified. Script will not run on any pages.',
        line: 0,
        column: 0,
        type: 'metadata',
      });
    }

    // Validate match patterns
    if (metadata.match) {
      for (const pattern of metadata.match) {
        if (!this.isValidMatchPattern(pattern)) {
          errors.push({
            message: `Invalid @match pattern: ${pattern}`,
            line: 0,
            column: 0,
            type: 'metadata',
          });
        }
      }
    }

    // Check version format
    if (metadata.version && !this.isValidVersion(metadata.version)) {
      warnings.push({
        message: `Version format may not be valid: ${metadata.version}`,
        line: 0,
        column: 0,
        type: 'best-practice',
      });
    }
  }

  /**
   * Check if match pattern is valid
   */
  private isValidMatchPattern(pattern: string): boolean {
    // Basic validation for match patterns
    const validProtocols = ['http', 'https', 'ftp', 'file'];
    const protocolMatch = pattern.match(/^(\w+):/);

    if (protocolMatch && !validProtocols.includes(protocolMatch[1])) {
      return false;
    }

    // Allow wildcard patterns
    return /^(\*|https?|file|ftp):\/\//.test(pattern);
  }

  /**
   * Check if version string is valid semver-like
   */
  private isValidVersion(version: string): boolean {
    return /^\d+(\.\d+)*/.test(version);
  }

  /**
   * Determine security issue severity
   */
  private getSecuritySeverity(pattern: RegExp): 'error' | 'warning' {
    const highRiskPatterns = [
      /\beval\s*\(/gi,
      /new\s+Function\s*\(/gi,
      /document\.write\s*\(/gi,
    ];

    return highRiskPatterns.some(p => p.source === pattern.source)
      ? 'error'
      : 'warning';
  }
}

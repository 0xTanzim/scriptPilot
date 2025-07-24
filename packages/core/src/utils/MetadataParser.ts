// Userscript metadata parser for extracting @grant, @match, @name etc.
import type { Script } from '@scriptpilot/types';

/**
 * Parses userscript metadata from script headers
 * Supports standard Greasemonkey/Tampermonkey directives
 */
export class MetadataParser {
  /**
   * Parse userscript metadata from code
   */
  async parseMetadata(code: string): Promise<Script['metadata']> {
    const metadata: Script['metadata'] = {
      match: [],
      runAt: 'document-end',
    };

    // Find the userscript header
    const headerMatch = code.match(
      /\/\/\s*==UserScript==\s*\n([\s\S]*?)\n\s*\/\/\s*==\/UserScript==/
    );

    if (!headerMatch) {
      // No metadata header found, return defaults
      return metadata;
    }

    const headerContent = headerMatch[1];
    const lines = headerContent.split('\n');

    for (const line of lines) {
      const directiveMatch = line.match(/^\s*\/\/\s*@(\w+)\s+(.+)$/);
      if (directiveMatch) {
        const [, directive, value] = directiveMatch;
        this.parseDirective(directive, value.trim(), metadata);
      }
    }

    // Ensure we have at least one match pattern
    if (metadata.match.length === 0) {
      metadata.match = ['<all_urls>'];
    }

    return metadata;
  }

  /**
   * Parse individual metadata directive
   */
  private parseDirective(
    directive: string,
    value: string,
    metadata: Script['metadata']
  ): void {
    switch (directive.toLowerCase()) {
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

      case 'homepage':
      case 'homepageurl':
        metadata.homepage = value;
        break;

      case 'supporturl':
        metadata.supportURL = value;
        break;

      case 'updateurl':
        metadata.updateURL = value;
        break;

      case 'downloadurl':
        metadata.downloadURL = value;
        break;

      case 'icon':
      case 'iconurl':
        metadata.icon = value;
        break;

      case 'match':
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
      case 'runat':
        if (this.isValidRunAt(value)) {
          metadata.runAt = value as Script['metadata']['runAt'];
        }
        break;

      case 'grant':
        metadata.grant = metadata.grant || [];
        metadata.grant.push(value);
        break;

      case 'require':
        metadata.require = metadata.require || [];
        metadata.require.push(value);
        break;

      case 'resource':
        metadata.resource = metadata.resource || {};
        const [resourceName, resourceUrl] = value.split(/\s+/, 2);
        if (resourceName && resourceUrl) {
          metadata.resource[resourceName] = resourceUrl;
        }
        break;

      case 'sandbox':
        if (this.isValidSandbox(value)) {
          metadata.sandbox = value as Script['metadata']['sandbox'];
        }
        break;

      case 'noframes':
        metadata.noframes = value.toLowerCase() === 'true';
        break;

      default:
        // Unknown directive, ignore for now
        break;
    }
  }

  /**
   * Validate run-at directive value
   */
  private isValidRunAt(value: string): boolean {
    return ['document-start', 'document-end', 'document-idle'].includes(value);
  }

  /**
   * Validate sandbox directive value
   */
  private isValidSandbox(value: string): boolean {
    return ['raw', 'JavaScript', 'DOM'].includes(value);
  }

  /**
   * Extract just the header block for validation
   */
  extractHeader(code: string): string | null {
    const headerMatch = code.match(
      /\/\/\s*==UserScript==\s*\n([\s\S]*?)\n\s*\/\/\s*==\/UserScript==/
    );
    return headerMatch ? headerMatch[0] : null;
  }

  /**
   * Check if code has a valid userscript header
   */
  hasValidHeader(code: string): boolean {
    return this.extractHeader(code) !== null;
  }

  /**
   * Get default metadata for scripts without headers
   */
  getDefaultMetadata(): Script['metadata'] {
    return {
      name: 'Untitled Script',
      version: '1.0.0',
      description: 'No description provided',
      match: ['<all_urls>'],
      runAt: 'document-end',
      grant: ['none'],
    };
  }

  /**
   * Create a userscript header from metadata
   */
  createHeader(metadata: Script['metadata']): string {
    const lines = ['// ==UserScript=='];

    if (metadata.name) lines.push(`// @name        ${metadata.name}`);
    if (metadata.namespace) lines.push(`// @namespace   ${metadata.namespace}`);
    if (metadata.version) lines.push(`// @version     ${metadata.version}`);
    if (metadata.description)
      lines.push(`// @description ${metadata.description}`);
    if (metadata.author) lines.push(`// @author      ${metadata.author}`);

    // Add match patterns
    for (const match of metadata.match) {
      lines.push(`// @match       ${match}`);
    }

    // Add excludes
    if (metadata.exclude) {
      for (const exclude of metadata.exclude) {
        lines.push(`// @exclude     ${exclude}`);
      }
    }

    // Add includes
    if (metadata.include) {
      for (const include of metadata.include) {
        lines.push(`// @include     ${include}`);
      }
    }

    // Add run-at
    lines.push(`// @run-at      ${metadata.runAt}`);

    // Add grants
    if (metadata.grant && metadata.grant.length > 0) {
      for (const grant of metadata.grant) {
        lines.push(`// @grant       ${grant}`);
      }
    } else {
      lines.push('// @grant       none');
    }

    // Add URLs
    if (metadata.homepage) lines.push(`// @homepage    ${metadata.homepage}`);
    if (metadata.supportURL)
      lines.push(`// @supportURL  ${metadata.supportURL}`);
    if (metadata.updateURL) lines.push(`// @updateURL   ${metadata.updateURL}`);
    if (metadata.downloadURL)
      lines.push(`// @downloadURL ${metadata.downloadURL}`);
    if (metadata.icon) lines.push(`// @icon        ${metadata.icon}`);

    // Add requires
    if (metadata.require) {
      for (const require of metadata.require) {
        lines.push(`// @require     ${require}`);
      }
    }

    // Add resources
    if (metadata.resource) {
      for (const [name, url] of Object.entries(metadata.resource)) {
        lines.push(`// @resource    ${name} ${url}`);
      }
    }

    // Add sandbox
    if (metadata.sandbox) {
      lines.push(`// @sandbox     ${metadata.sandbox}`);
    }

    // Add noframes
    if (metadata.noframes) {
      lines.push('// @noframes');
    }

    lines.push('// ==/UserScript==');
    lines.push('');

    return lines.join('\n');
  }
}

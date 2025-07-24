/**
 * URL Pattern Utilities
 * Following Design Pattern #6: Proper utility organization
 */

export interface UrlPattern {
  pattern: string;
  isValid: boolean;
  error?: string;
}

/**
 * Validates URL patterns for userscript matching
 */
export const validateUrlPattern = (pattern: string): UrlPattern => {
  if (!pattern.trim()) {
    return { pattern, isValid: false, error: 'Pattern cannot be empty' };
  }

  try {
    // Check for common userscript patterns
    const validPatterns = [
      /^\*$/, // Match all
      /^\*:\/\/\*\/\*$/, // All protocols, all domains
      /^https?:\/\/\*\..*\/\*$/, // Subdomain wildcards
      /^https?:\/\/.*\/\*$/, // Path wildcards
      /^https?:\/\/.*$/, // Specific URLs
    ];

    const isValidPattern = validPatterns.some(regex => regex.test(pattern));

    if (!isValidPattern && !pattern.includes('*')) {
      return {
        pattern,
        isValid: false,
        error: 'Pattern should include wildcards (*) or be a specific URL',
      };
    }

    return { pattern, isValid: true };
  } catch {
    return {
      pattern,
      isValid: false,
      error: 'Invalid pattern format',
    };
  }
};

/**
 * Formats URL patterns for display
 */
export const formatUrlPattern = (pattern: string): string => {
  if (pattern === '*') return 'All URLs';
  if (pattern === '*://*/*') return 'All HTTP/HTTPS URLs';

  return pattern;
};

/**
 * Suggests common URL patterns
 */
export const getUrlPatternSuggestions = (): string[] => [
  '*://*/*',
  'https://*.google.com/*',
  'https://example.com/*',
  'https://github.com/*',
  'https://stackoverflow.com/*',
];

/**
 * Validates exclude patterns
 */
export const validateExcludePattern = (pattern: string): UrlPattern => {
  if (!pattern.trim()) {
    return { pattern, isValid: true }; // Empty exclude is valid
  }

  return validateUrlPattern(pattern);
};

/**
 * Checks if a URL matches a pattern
 */
export const matchesPattern = (url: string, pattern: string): boolean => {
  try {
    // Convert userscript pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\./g, '\\.')
      .replace(/\?/g, '\\?');

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(url);
  } catch {
    return false;
  }
};

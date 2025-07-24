/**
 * Utility functions for safe date formatting and handling
 */

/**
 * Safely formats a date to a locale string, handling both Date objects and strings
 */
export function formatDate(
  date: Date | string | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    return dateObj.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('[ScriptPilot] Error formatting date:', error);
    return 'Unknown';
  }
}

/**
 * Safely formats a date to a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return 'Unknown';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.warn('[ScriptPilot] Error formatting relative time:', error);
    return 'Unknown';
  }
}

/**
 * Ensures a value is a proper Date object
 */
export function ensureDate(date: Date | string | undefined): Date {
  if (!date) return new Date();

  if (date instanceof Date) return date;

  try {
    return new Date(date);
  } catch {
    return new Date();
  }
}

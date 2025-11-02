// Centralized date formatting utility
// Formats dates consistently as "Oct 23, 2025" throughout the application

/**
 * Formats a date string or Date object to "Oct 23, 2025" format
 * @param dateValue - Date string (ISO format, YYYY-MM-DD, etc.) or Date object
 * @returns Formatted date string like "Oct 23, 2025"
 */
export const formatDate = (dateValue: string | Date): string => {
  try {
    let date: Date;

    // Handle date strings in YYYY-MM-DD format to avoid timezone issues
    if (typeof dateValue === 'string') {
      // Check if it's a date-only string (YYYY-MM-DD)
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyPattern.test(dateValue)) {
        // Parse as local date to avoid timezone offset
        const [year, month, day] = dateValue.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateValue);
      }
    } else {
      date = dateValue;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short', // "Oct", "Jan", "Dec"
      day: 'numeric', // "23", "1", "15"
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date string or Date object to "October 23, 2025" format (full month name)
 * @param dateValue - Date string (ISO format, YYYY-MM-DD, etc.) or Date object
 * @returns Formatted date string like "October 23, 2025"
 */
export const formatDateLong = (dateValue: string | Date): string => {
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long', // "October", "January", "December"
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a birthday (shows only month and day, no year)
 * @param dateOfBirth - Date of birth string or Date object
 * @returns Formatted birthday string like "Oct 23"
 */
export const formatBirthday = (dateOfBirth: string | Date): string => {
  try {
    const date = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting birthday:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a birthday with full month name (shows only month and day, no year)
 * @param dateOfBirth - Date of birth string or Date object
 * @returns Formatted birthday string like "October 23"
 */
export const formatBirthdayLong = (dateOfBirth: string | Date): string => {
  try {
    const date = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting birthday:', error);
    return 'Invalid date';
  }
};

export default formatDate;

/**
 * Baku/Azerbaijan Timezone Functions
 * All dates/times in Asia/Baku timezone (UTC+4)
 */

const BAKU_TIMEZONE = 'Asia/Baku';

/**
 * Format datetime for Baku timezone in "Nov 1, 2025 14:30" format
 * Used for roster tables and enrollment displays
 */
export function formatBakuDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '—';

    const dateStr = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: BAKU_TIMEZONE,
    }).format(dateObj);

    const timeStr = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: BAKU_TIMEZONE,
    }).format(dateObj);

    return `${dateStr} ${timeStr}`;
  } catch (error) {
    console.error('Error formatting Baku datetime:', error);
    return '—';
  }
}

/**
 * Format date only for Baku timezone in "Nov 1, 2025" format
 */
export function formatBakuDate(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: BAKU_TIMEZONE,
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting Baku date:', error);
    return '—';
  }
}

/**
 * Format time only for Baku timezone in 24-hour format "14:30"
 */
export function formatBakuTime(date: string | Date | null | undefined): string {
  if (!date) return '—';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '—';

    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: BAKU_TIMEZONE,
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting Baku time:', error);
    return '—';
  }
}

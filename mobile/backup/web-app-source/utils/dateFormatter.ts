// Centralized date formatting utility
// Formats dates consistently with i18n support throughout the application

import i18n from '../i18n/config';

/**
 * Get current locale for date formatting
 * Maps i18n language codes to browser locale codes
 */
const getLocale = (): string => {
  const language = i18n.language || 'en';
  const localeMap: { [key: string]: string } = {
    en: 'en-US',
    az: 'az-Latn-AZ', // Use Latin script for better formatting
    ru: 'ru-RU',
  };
  return localeMap[language] || 'en-US';
};

/**
 * Month names in Azerbaijani (short form)
 */
const azMonthsShort = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'İyn',
  'İyl',
  'Avq',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

/**
 * Month names in Azerbaijani (long form)
 */
const azMonthsLong = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

/**
 * Custom date formatter for Azerbaijani to produce "25 Okt, 2025" format
 */
const formatAzerbaijaniDate = (
  date: Date,
  includeYear: boolean = true,
  longMonth: boolean = false,
): string => {
  const day = date.getDate();
  const month = longMonth ? azMonthsLong[date.getMonth()] : azMonthsShort[date.getMonth()];
  const year = date.getFullYear();

  if (includeYear) {
    return `${day} ${month}, ${year}`;
  }
  return `${day} ${month}`;
};

/**
 * Formats a date string or Date object to localized format like "Oct 23, 2025" (en) or "23 Okt, 2025" (az)
 * @param dateValue - Date string (ISO format, YYYY-MM-DD, etc.) or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateValue: string | Date | null | undefined): string => {
  try {
    // Handle null or undefined
    if (!dateValue) {
      return 'N/A';
    }

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
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short', // "Oct", "Jan", "Dec"
      day: 'numeric', // "23", "1", "15"
    };

    // Use custom formatter for Azerbaijani
    if (i18n.language === 'az') {
      return formatAzerbaijaniDate(date, true, false);
    }

    return date.toLocaleDateString(getLocale(), options);
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
export const formatDateLong = (dateValue: string | Date | null | undefined): string => {
  try {
    // Handle null or undefined
    if (!dateValue) {
      return 'N/A';
    }

    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long', // "October", "January", "December"
      day: 'numeric',
    };

    // Use custom formatter for Azerbaijani
    if (i18n.language === 'az') {
      return formatAzerbaijaniDate(date, true, true);
    }

    return date.toLocaleDateString(getLocale(), options);
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
export const formatBirthday = (dateOfBirth: string | Date | null | undefined): string => {
  try {
    // Handle null or undefined
    if (!dateOfBirth) {
      return 'N/A';
    }

    const date = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    // Use custom formatter for Azerbaijani
    if (i18n.language === 'az') {
      return formatAzerbaijaniDate(date, false, false);
    }

    return date.toLocaleDateString(getLocale(), options);
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
export const formatBirthdayLong = (dateOfBirth: string | Date | null | undefined): string => {
  try {
    // Handle null or undefined
    if (!dateOfBirth) {
      return 'N/A';
    }

    const date = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;

    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };

    // Use custom formatter for Azerbaijani
    if (i18n.language === 'az') {
      return formatAzerbaijaniDate(date, false, true);
    }

    return date.toLocaleDateString(getLocale(), options);
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

    // For Azerbaijani, use custom formatter
    if (i18n.language === 'az') {
      const dateStr = formatAzerbaijaniDate(dateObj, true, false);
      const timeStr = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: BAKU_TIMEZONE,
      }).format(dateObj);
      return `${dateStr} ${timeStr}`;
    }

    const dateStr = new Intl.DateTimeFormat(getLocale(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: BAKU_TIMEZONE,
    }).format(dateObj);

    const timeStr = new Intl.DateTimeFormat(getLocale(), {
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

    // For Azerbaijani, use custom formatter
    if (i18n.language === 'az') {
      return formatAzerbaijaniDate(dateObj, true, false);
    }

    return new Intl.DateTimeFormat(getLocale(), {
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

    return new Intl.DateTimeFormat(getLocale(), {
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

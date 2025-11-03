import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from '../../public/locales/en/translation.json';
import azTranslation from '../../public/locales/az/translation.json';
import ruTranslation from '../../public/locales/ru/translation.json';

// Language detection configuration
const detectionOptions = {
  // Order of language detection
  order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],

  // Keys to use in localStorage
  lookupLocalStorage: 'viking-hammer-language',

  // Cache user language
  caches: ['localStorage'],

  // Exclude specific cache locations
  excludeCacheFor: ['cimode'],
};

i18n
  // Detect user language
  .use(LanguageDetector)

  // Pass the i18n instance to react-i18next
  .use(initReactI18next)

  // Initialize i18next
  .init({
    // Translation resources
    resources: {
      en: {
        translation: enTranslation,
      },
      az: {
        translation: azTranslation,
      },
      ru: {
        translation: ruTranslation,
      },
    },

    // Fallback language chain: az → ru → en
    fallbackLng: ['az', 'ru', 'en'],

    // Default language (Azerbaijani as primary)
    lng: 'az',

    // Language detection options
    detection: detectionOptions,

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Debugging (disable in production)
    debug: process.env.NODE_ENV === 'development',

    // Return empty string for missing keys instead of key name
    returnEmptyString: false,

    // Return null for missing keys
    returnNull: false,

    // Return the key if translation is missing
    parseMissingKeyHandler: (key: string) => {
      console.warn(`🌐 Missing translation key: ${key}`);
      return key;
    },
  });

export default i18n;

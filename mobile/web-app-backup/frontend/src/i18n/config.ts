import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

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
  // Load translations from public folder
  .use(HttpBackend)

  // Detect user language
  .use(LanguageDetector)

  // Pass the i18n instance to react-i18next
  .use(initReactI18next)

  // Initialize i18next
  .init({
    // HTTP backend configuration
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    // Fallback language chain: az → ru → en
    fallbackLng: ['az', 'ru', 'en'],

    // Don't set lng here - let LanguageDetector handle it
    // If no language is detected, fallbackLng will be used
    // lng: 'az', // REMOVED - this was overriding localStorage detection

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

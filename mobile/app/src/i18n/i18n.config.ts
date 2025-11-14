import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './translations/en/translation.json';
import az from './translations/az/translation.json';
import ru from './translations/ru/translation.json';

const resources = {
  en: {
    translation: en,
  },
  az: {
    translation: az,
  },
  ru: {
    translation: ru,
  },
};

// Get device language
const locales = Localization.getLocales?.() ?? [];
const deviceLanguage = locales[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: deviceLanguage || 'en', // Default to device language or English
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Important for React Native
  },
});

export default i18n;

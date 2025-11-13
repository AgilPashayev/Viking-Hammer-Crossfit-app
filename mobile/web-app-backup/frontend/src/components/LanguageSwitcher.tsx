import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

// Language options with native names
const languages = [
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (languageCode: string) => {
    // Change language and persist to localStorage
    i18n.changeLanguage(languageCode);
    localStorage.setItem('viking-hammer-language', languageCode);
    console.log(`🌐 Language changed to: ${languageCode} (saved to localStorage)`);
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="language-label">
        🌐 {t('settings.language')}:
      </label>
      <select
        id="language-select"
        className="language-select"
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.flag} {language.name}
          </option>
        ))}
      </select>
      <span className="current-language-indicator">{currentLanguage.flag}</span>
    </div>
  );
};

export default LanguageSwitcher;

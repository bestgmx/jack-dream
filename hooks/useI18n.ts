
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Language, TranslationKey } from '../types.ts';
import { translations } from '../constants/translations.ts';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(Language.EN);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
  
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === Language.FA ? 'rtl' : 'ltr';
  }, [language]);

  return React.createElement(
    I18nContext.Provider,
    { value: { language, setLanguage, t } },
    children
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

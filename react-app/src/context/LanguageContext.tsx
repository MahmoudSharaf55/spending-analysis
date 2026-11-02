import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';
import { LOCAL_STORAGE_KEYS } from '../utils/constants';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  isRtl: boolean;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.LANG) as Language | null;
    return saved === 'ar' || saved === 'en' ? saved : 'ar';
  });

  const isRtl = lang === 'ar';
  const t = translations[lang];

  useEffect(() => {
    const dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    document.body.setAttribute('dir', dir);

    localStorage.setItem(LOCAL_STORAGE_KEYS.LANG, lang);
  }, [lang, isRtl]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

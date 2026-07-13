import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n from '../i18n/index';

const LangContext = createContext(null);

function applyDirection(lang) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hergla_lang') || 'fr';
  });

  // Apply direction on mount and whenever lang changes
  useEffect(() => {
    applyDirection(lang);
    i18n.changeLanguage(lang);
  }, [lang]);

  const switchLang = useCallback((newLang) => {
    if (newLang !== lang) {
      setLang(newLang);
      localStorage.setItem('hergla_lang', newLang);
    }
  }, [lang]);

  const toggleLang = useCallback(() => {
    const newLang = lang === 'fr' ? 'ar' : 'fr';
    setLang(newLang);
    localStorage.setItem('hergla_lang', newLang);
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, switchLang, toggleLang, isRTL: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used inside LangProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { zh } from './locales/zh.js';
import { en } from './locales/en.js';

export type Language = 'zh' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const dictionaries: Record<Language, Record<string, string>> = {
  zh,
  en,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('ros_panel_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ros_panel_lang', lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      try {
        localStorage.setItem('ros_panel_lang', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const t = (key: string, fallback?: string): string => {
    const dict = dictionaries[language] || dictionaries.zh;
    const value = dict[key];
    if (value !== undefined) return value;
    if (fallback !== undefined) return fallback;
    if ((import.meta as any).env?.DEV) {
      console.warn(`[i18n] Missing translation for key: "${key}" (lang: ${language})`);
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

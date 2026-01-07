import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';

export type Locale = 'EN' | 'AR';

const localeToLanguageMap: Record<Locale, 'en' | 'ar'> = {
  EN: 'en',
  AR: 'ar',
};

const getStoredLocale = (): Locale => {
  if (typeof window === 'undefined') {
    return 'AR';
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ar') return 'AR';
    if (stored === 'en') return 'EN';
  } catch (error) {
    console.warn('Unable to read locale from localStorage:', error);
  }

  return 'AR';
};

export const useLocale = () => {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    const nextLanguage = localeToLanguageMap[locale];

    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
      } catch (error) {
        console.warn('Unable to persist locale to localStorage:', error);
      }
    }
  }, [i18n, locale]);

  useEffect(() => {
    const normalized = i18n.language.startsWith('ar') ? 'AR' : 'EN';
    if (normalized !== locale) {
      setLocaleState(normalized);
    }
  }, [i18n.language, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState((current) => (current === next ? current : next));
  }, []);

  return { locale, setLocale };
};

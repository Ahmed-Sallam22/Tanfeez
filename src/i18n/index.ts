import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export const LANGUAGE_STORAGE_KEY = 'tanfeez_locale';
const FALLBACK_LANGUAGE = 'en';

const getInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_LANGUAGE;
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      return stored;
    }
  } catch (error) {
    console.warn('Unable to read persisted language:', error);
  }

  return FALLBACK_LANGUAGE;
};

const resources = {
  ar: { translation: ar },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
  });

export default i18n;

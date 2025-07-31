import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from '../../../public/locales/en.json';

const resources = {
  en: {
    translation: translationEN,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
});

export default i18n;

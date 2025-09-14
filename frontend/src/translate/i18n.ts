import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import hr from './languages/hr.json'
import en from './languages/en.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hr: { translation: hr },
      en: { translation: en },
    },
    lng: localStorage.getItem('lang') || 'hr', 
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false, 
  })

export default i18n

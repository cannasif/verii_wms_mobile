import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '@/constants/storage';
import { storage } from '@/lib/storage';
import tr from './tr.json';
import en from './en.json';

export const resources = {
  tr: { translation: tr },
  en: { translation: en },
} as const;

export type SupportedLanguage = keyof typeof resources;

const supportedLanguages = Object.keys(resources) as SupportedLanguage[];

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: 'tr',
  fallbackLng: 'tr',
  resources,
  interpolation: { escapeValue: false },
});

void (async () => {
  const storedLanguage = await storage.get<string>(LANGUAGE_STORAGE_KEY);
  if (storedLanguage && storedLanguage !== i18n.language) {
    await i18n.changeLanguage(storedLanguage);
  }
})();

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await storage.set(LANGUAGE_STORAGE_KEY, language);
}

export async function cycleLanguage(): Promise<void> {
  const currentIndex = supportedLanguages.indexOf((i18n.language as SupportedLanguage) || 'tr');
  const next = supportedLanguages[(currentIndex + 1) % supportedLanguages.length] ?? supportedLanguages[0];
  await setLanguage(next);
}

export function getCurrentLanguageLabel(): string {
  return (i18n.language || 'tr').slice(0, 2).toUpperCase();
}

export default i18n;

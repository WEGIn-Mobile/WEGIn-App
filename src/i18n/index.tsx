import { createContext, useContext, type ReactNode } from 'react';
import { getLocales, useLocales, type Locale } from 'expo-localization';
import { usePreferences } from '@/hooks/use-preferences';
import { en } from './locales/en';
import { es } from './locales/es';
import { pt } from './locales/pt';
import type { Dictionary, TranslationKey, TranslationParams } from './types';

export type Language = 'pt' | 'en' | 'es';
export type LanguagePreference = Language | 'system';
export type { TranslationKey } from './types';

export const languages: Language[] = ['pt', 'en', 'es'];
export const languageNames: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

const dictionaries: Record<Language, Dictionary> = { pt, en, es };
const defaultTags: Record<Language, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};
const fallbackLanguage: Language = 'en';

function isLanguage(code: string | null | undefined): code is Language {
  return !!code && (languages as string[]).includes(code);
}

/** Primeiro idioma suportado na lista do dispositivo; senão, inglês. */
export function detectLanguage(locales: Locale[]): Language {
  for (const locale of locales) {
    const code = locale.languageCode?.toLowerCase();
    if (isLanguage(code)) return code;
  }
  return fallbackLanguage;
}

function resolveLocaleTag(language: Language, locales: Locale[]) {
  // Mantém a região do dispositivo (ex.: pt-PT, es-MX) para datas e números.
  const match = locales.find(
    (locale) => locale.languageCode?.toLowerCase() === language,
  );
  return match?.languageTag ?? defaultTags[language];
}

// Estado do módulo para que serviços e apiFetch traduzam fora dos componentes.
let currentLanguage: Language = detectLanguage(getLocales());

function lookup(dictionary: Dictionary, key: string) {
  let value: unknown = dictionary;
  for (const part of key.split('.')) {
    if (typeof value !== 'object' || value === null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : undefined;
}

function translate(
  language: Language,
  key: TranslationKey,
  params?: TranslationParams,
) {
  const count = params?.count;
  const candidates =
    typeof count === 'number'
      ? [`${key}_${count === 1 ? 'one' : 'other'}`, key]
      : [key];
  let text: string | undefined;
  for (const dictionary of [dictionaries[language], dictionaries.en]) {
    for (const candidate of candidates) {
      text ??= lookup(dictionary, candidate);
    }
  }
  if (text === undefined) return key;
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Tradução no idioma ativo; use `useI18n().t` dentro de componentes. */
export function t(key: TranslationKey, params?: TranslationParams) {
  return translate(currentLanguage, key, params);
}

export function getLanguage() {
  return currentLanguage;
}

type DateFormatter = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
) => string;

function createDateFormatter(locale: string): DateFormatter {
  return (value, options) => new Date(value).toLocaleString(locale, options);
}

function createConversationTimeFormatter(
  language: Language,
  formatDate: DateFormatter,
) {
  /** Hora para hoje, "Ontem" e data curta para dias anteriores, como no WhatsApp. */
  return (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const day = 24 * 60 * 60 * 1000;
    if (date.getTime() >= startOfToday)
      return formatDate(date, { hour: '2-digit', minute: '2-digit' });
    if (date.getTime() >= startOfToday - day)
      return translate(language, 'common.yesterday');
    return formatDate(date, { day: '2-digit', month: '2-digit' });
  };
}

type I18n = {
  language: Language;
  locale: string;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  // Expostos pelo hook para que o React Compiler refaça a formatação ao
  // trocar o idioma, em vez de reaproveitar um valor memoizado.
  formatDate: DateFormatter;
  formatConversationTime: (value: string) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language: preference } = usePreferences();
  const locales = useLocales();
  const language =
    preference === 'system' ? detectLanguage(locales) : preference;
  const locale = resolveLocaleTag(language, locales);
  currentLanguage = language;
  const formatDate = createDateFormatter(locale);
  return (
    <I18nContext.Provider
      value={{
        language,
        locale,
        t: (key, params) => translate(language, key, params),
        formatDate,
        formatConversationTime: createConversationTimeFormatter(
          language,
          formatDate,
        ),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error('useI18n deve estar dentro de I18nProvider.');
  return i18n;
}

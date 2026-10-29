import en from '../locales/en.json';
import ny from '../locales/ny.json';

export type LocaleCode = 'en' | 'ny';

export interface LocaleOption {
  code: LocaleCode;
  label: string;
  nativeLabel: string;
}

export const AVAILABLE_LOCALES: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ny', label: 'Chichewa', nativeLabel: 'Chichewa' },
];

const dictionaries: Record<LocaleCode, any> = {
  en,
  ny,
};

let activeLocale: LocaleCode = 'en';
const listeners = new Set<(locale: LocaleCode) => void>();

export function getLocale(): LocaleCode {
  return activeLocale;
}

export function setLocale(locale: LocaleCode): void {
  if (locale !== activeLocale && dictionaries[locale]) {
    activeLocale = locale;
    listeners.forEach((listener) => listener(activeLocale));
  }
}

export function subscribeLocale(listener: (locale: LocaleCode) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function t(path: string, fallback?: string): string {
  const parts = path.split('.');
  const currentDict = dictionaries[activeLocale] || en;
  let current: any = currentDict;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English dictionary if key is missing in active locale
      let enFallback: any = en;
      for (const p of parts) {
        if (enFallback && typeof enFallback === 'object' && p in enFallback) {
          enFallback = enFallback[p];
        } else {
          return fallback || path;
        }
      }
      return typeof enFallback === 'string' ? enFallback : fallback || path;
    }
  }

  if (typeof current === 'string') {
    return current;
  }
  return fallback || path;
}

export default t;

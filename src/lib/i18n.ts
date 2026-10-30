import es from "@/i18n/es.json";
import en from "@/i18n/en.json";

type Translations = typeof es;
type Locale = "es" | "en";

const translations: Record<Locale, Translations> = { es, en };

export function getTranslation(locale: Locale = "es"): Translations {
  return translations[locale] || translations.es;
}

export function t(locale: Locale, key: string): string {
  const keys = key.split(".");
  let value: unknown = translations[locale] || translations.es;
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === "string" ? value : key;
}

export type { Locale, Translations };
// Common cookie constants and utilities
export const LOCALE_COOKIE = 'NEXT_LOCALE' as any;
export const DEFAULT_LOCALE = 'en' as any;
export const SUPPORTED_LOCALES = ['en', 'es'] as any;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

// For use with string value already retrieved from cookie
export function getLocaleFromValue(cookieValue: string | undefined): SupportedLocale {
  if (cookieValue && isValidLocale(cookieValue)) {
    return cookieValue as SupportedLocale;
  }
  return DEFAULT_LOCALE;
}

// Cookie settings
export const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24 * 365, // 1 year
} as const;
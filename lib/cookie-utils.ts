// Common cookie constants and utilities
export const LOCALE_COOKIE = 'NEXT_LOCALE' as any;
export const DEFAULT_LOCALE = 'en' as const;
export const SUPPORTED_LOCALES = ['en', 'es'] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export function getLocaleFromCookie(cookieValue: string | undefined): SupportedLocale {
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
} as any;

// For client-side cookie setting
export function setLocaleCookie(locale: SupportedLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=${COOKIE_OPTIONS.path};max-age=${COOKIE_OPTIONS.maxAge};samesite=${COOKIE_OPTIONS.sameSite}`;
}
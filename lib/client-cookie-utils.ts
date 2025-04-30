'use client';

import { LOCALE_COOKIE, COOKIE_OPTIONS, SupportedLocale } from './cookie-constants';

// For client-side cookie setting
export function setLocaleCookie(locale: SupportedLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=${COOKIE_OPTIONS.path};max-age=${COOKIE_OPTIONS.maxAge};samesite=${COOKIE_OPTIONS.sameSite}`;
}
'use server';

import { cookies } from 'next/headers';
import { LOCALE_COOKIE, getLocaleFromValue, SupportedLocale } from './cookie-constants';

// Server-side function that gets locale from cookie store
export async function getLocaleFromCookie(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  return getLocaleFromValue(cookieValue);
}
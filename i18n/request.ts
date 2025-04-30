import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { LOCALE_COOKIE, getLocaleFromCookie } from '@/lib/cookie-utils';

export default getRequestConfig(async () => {
    // Get locale from cookie
    const cookieStore = await cookies();
    const localeFromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
    const localeToUse = getLocaleFromCookie(localeFromCookie);
    
    return {
        locale: localeToUse,
        messages: (await import(`../messages/${localeToUse}.json`)).default
    };
});
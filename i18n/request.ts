import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
    // Get locale from cookie
    const cookieStore = await cookies();
    const localeFromCookie = cookieStore.get('NEXT_LOCALE' as any)?.value;
    const localeToUse = localeFromCookie && ['en', 'es'].includes(localeFromCookie)
        ? localeFromCookie
        : 'en';
    
    return {
        locale: localeToUse,
        messages: (await import(`../messages/${localeToUse}.json`)).default
    };
});
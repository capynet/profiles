import { getRequestConfig } from 'next-intl/server';
import { getLocaleFromCookie } from '@/lib/cookie-utils';

export default getRequestConfig(async () => {
    // Get locale from cookie
    const localeToUse = await getLocaleFromCookie();
    
    return {
        locale: localeToUse,
        messages: (await import(`../messages/${localeToUse}.json`)).default
    };
});
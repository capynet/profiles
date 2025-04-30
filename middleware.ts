import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  LOCALE_COOKIE, 
  COOKIE_OPTIONS,
  getLocaleFromValue
} from '@/lib/cookie-constants';

export function middleware(request: NextRequest) {
  // Check if there's a locale in the cookie
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = getLocaleFromValue(cookieLocale);
  
  // Create a response object from the request
  const response = NextResponse.next();
  
  // Set the locale cookie if not present or different
  if (!cookieLocale || cookieLocale !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale as any, COOKIE_OPTIONS);
  }
  
  return response;
}

export const config = {
  // Skip all paths that should not be processed
  matcher: ['/((?!api|_next|_vercel|.*\\.).*)'],
};
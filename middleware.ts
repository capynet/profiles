import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'NEXT_LOCALE' as any;
const DEFAULT_LOCALE = 'en';
const LOCALES = ['en', 'es'];

export function middleware(request: NextRequest) {
  // Check if there's a locale in the cookie
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  const locale = cookieLocale && LOCALES.includes(cookieLocale)
    ? cookieLocale
    : DEFAULT_LOCALE;
  
  // Create a response object from the request
  const response = NextResponse.next();
  
  // Set the locale cookie if not present or different
  if (!cookieLocale || cookieLocale !== locale) {
    response.cookies.set(COOKIE_NAME, locale as any, {
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  
  return response;
}

export const config = {
  // Skip all paths that should not be processed
  matcher: ['/((?!api|_next|_vercel|.*\\.).*)'],
};
'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SupportedLocale } from '@/lib/cookie-constants';
import { setLocaleCookie } from '@/lib/client-cookie-utils';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: SupportedLocale) => {
    if (newLocale === locale) return;
    
    // Set the cookie
    setLocaleCookie(newLocale);
    
    // Reload the current page to apply the new locale
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-2 py-1 text-xs font-medium rounded ${locale === 'en' 
          ? 'bg-indigo-600 text-white' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('es')}
        disabled={isPending}
        className={`px-2 py-1 text-xs font-medium rounded ${locale === 'es' 
          ? 'bg-indigo-600 text-white' 
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
      >
        ES
      </button>
    </div>
  );
}
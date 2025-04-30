'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    
    // Set the cookie
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=strict`;
    
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
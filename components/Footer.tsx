'use client';

import { useTranslations } from 'next-intl';

export default function Footer() {
    const t = useTranslations('Footer');
    
    return (
        <footer className="py-4 px-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
                {t('copyright')}
            </div>
        </footer>
    );
}
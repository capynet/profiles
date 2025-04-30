'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CreateProfileBannerProps {
    className?: string;
}

export default function CreateProfileBanner({ className = '' }: CreateProfileBannerProps) {
    const t = useTranslations('CreateProfileBanner');
    
    return (
        <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-md ${className}`}>
            <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold mb-1">{t('title')}</h2>
                    <p className="text-white text-opacity-90">
                        {t('description')}
                    </p>
                </div>
                <Link
                    href="/profile/create"
                    className="whitespace-nowrap px-6 py-2 bg-white text-indigo-700 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                    {t('button')}
                </Link>
            </div>
        </div>
    );
}
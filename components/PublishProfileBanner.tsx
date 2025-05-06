'use client';

import { useTranslations } from 'next-intl';
import { toggleProfilePublication } from '@/app/profile/actions';
import { useState } from 'react';

interface PublishProfileBannerProps {
    className?: string;
}

export default function PublishProfileBanner({ className = '' }: PublishProfileBannerProps) {
    const t = useTranslations('PublishProfileBanner');
    const [isPublishing, setIsPublishing] = useState(false);
    
    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            await toggleProfilePublication();
            // Refresh the page to update the profile status
            window.location.reload();
        } catch (error) {
            console.error('Error publishing profile:', error);
            alert('Failed to publish profile. Please try again.');
        } finally {
            setIsPublishing(false);
        }
    };
    
    return (
        <div className={`bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg shadow-md ${className}`}>
            <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold mb-1">{t('title')}</h2>
                    <p className="text-white text-opacity-90">
                        {t('description')}
                    </p>
                </div>
                <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="whitespace-nowrap px-6 py-2 bg-white text-orange-700 rounded-md font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                    {isPublishing ? t('publishing') : t('button')}
                </button>
            </div>
        </div>
    );
}
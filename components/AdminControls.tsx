'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface AdminControlsProps {
    isPublished: boolean;
    onPublishedChange: (published: boolean) => void;
    profileId?: number;
    profileName?: string;
    userName?: string;
    userEmail?: string;
}

export default function AdminControls({
                                          isPublished,
                                          onPublishedChange,
                                          profileId,
                                          profileName,
                                          userName,
                                          userEmail
                                      }: AdminControlsProps) {
    const t = useTranslations('AdminControls');
    
    // Local state to manage checkbox
    const [localPublished, setLocalPublished] = useState(isPublished);

    // Update local state when prop changes
    useEffect(() => {
        setLocalPublished(isPublished);
    }, [isPublished]);

    // Handle checkbox change
    const handlePublishedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.checked;
        console.log("Publishing checkbox changed to:", newValue); // Debug log
        setLocalPublished(newValue);
        onPublishedChange(newValue);
    };

    // CSS classes
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    return (
        <div className="space-y-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('title')}</h3>

                {profileId && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('profileId')}: {profileId}
                    </span>
                )}
            </div>

            {/* Profile info summary */}
            {(profileName || userName || userEmail) && (
                <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                    {profileName && <div>{t('profileLabel')}: <span className="font-medium">{profileName}</span></div>}
                    {(userName || userEmail) && (
                        <div>
                            {t('userLabel')}: <span className="font-medium">{userName || userEmail}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Publication control */}
            <div className="bg-white dark:bg-gray-800 rounded-md p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="published"
                        name="published"
                        checked={localPublished}
                        onChange={handlePublishedChange}
                        className={checkboxClassName}
                    />
                    <label htmlFor="published" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('publishCheckbox')}
                    </label>
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t('visibilityDescription')}
                    {!localPublished && ` ${t('privateVisibility')}`}
                </p>

                {/* Show additional warning if changing from published to unpublished */}
                {isPublished && !localPublished && (
                    <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 text-xs">
                        <strong>Warning:</strong> {t('unpublishWarning')}
                    </div>
                )}

                {/* Show success message if changing from unpublished to published */}
                {!isPublished && localPublished && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 text-green-800 dark:text-green-200 text-xs">
                        <strong>Note:</strong> {t('publishNote')}
                    </div>
                )}

                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500">
                    {t('currentStatus')}: {localPublished ? t('publishedStatus') : t('unpublishedStatus')}
                </div>
            </div>

            {/* Additional admin actions */}
            <div className="flex space-x-3 mt-3">
                {profileId && (
                    <>
                        <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300
                        bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
                        rounded-md hover:bg-gray-50 dark:hover:bg-gray-700
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => window.open(`/admin/profiles/${profileId}/view`, '_blank')}
                        >
                            {t('viewDetailsButton')}
                        </button>

                        <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300
                        bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-800
                        rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => window.open(`/profile/${profileId}`, '_blank')}
                        >
                            {t('viewPublicProfileButton')}
                        </button>
                    </>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>
                    <strong>{t('adminNotesTitle')}</strong>
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>{t('adminNote1')}</li>
                    <li>{t('adminNote2')}</li>
                    <li>{t('adminNote3')}</li>
                </ul>
            </div>
        </div>
    );
}
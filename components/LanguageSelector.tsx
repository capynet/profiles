// components/LanguageSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface Language {
    id: number;
    name: string;
}

interface LanguageSelectorProps {
    selectedLanguages: number[];
    onChange: (languageIds: number[]) => void;
    error?: string;
}

export default function LanguageSelector({
                                             selectedLanguages,
                                             onChange,
                                             error
                                         }: LanguageSelectorProps) {
    const t = useTranslations('LanguageSelector');
    const [languages, setLanguages] = useState<Language[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Fetch languages on component mount
    useEffect(() => {
        const fetchLanguages = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/languages');

                if (!response.ok) {
                    throw new Error('Failed to fetch languages');
                }

                const data = await response.json();
                setLanguages(data);
            } catch (error) {
                console.error('Error fetching languages:', error);
                setLoadError(t('failedToLoad'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchLanguages();
    }, [t]);

    // Handle language selection/deselection
    const handleLanguageChange = (languageId: number) => {
        const newSelectedLanguages = selectedLanguages.includes(languageId)
            ? selectedLanguages.filter(id => id !== languageId)
            : [...selectedLanguages, languageId];

        onChange(newSelectedLanguages);
    };

    // CSS classes
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('title')}
            </label>

            {isLoading ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('loading')}
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {loadError}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    {languages.length > 0 ? (
                        languages.map(language => (
                            <div key={language.id} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`language-${language.id}`}
                                    checked={selectedLanguages.includes(language.id)}
                                    onChange={() => handleLanguageChange(language.id)}
                                    className={checkboxClassName}
                                />
                                <label
                                    htmlFor={`language-${language.id}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {language.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">
                            {t('noLanguages')}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
            )}

            {selectedLanguages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {selectedLanguages.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('selected', { count: selectedLanguages.length })}
            </span>
                    )}
                </div>
            )}
        </div>
    );
}
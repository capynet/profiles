// components/LanguageSelector.tsx
'use client';

import useSWR from 'swr';
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LanguageSelector({
                                             selectedLanguages,
                                             onChange,
                                             error
                                         }: LanguageSelectorProps) {
    const t = useTranslations('LanguageSelector');

    // Use SWR for automatic caching and revalidation
    const { data: languages = [], error: loadError, isLoading, mutate } = useSWR<Language[]>(
        '/api/languages',
        fetcher,
        {
            revalidateOnFocus: true, // Refresh when window regains focus
            revalidateOnReconnect: true, // Refresh when reconnecting
            dedupingInterval: 10000, // Dedupe requests within 10 seconds
        }
    );

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
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('title')}
                </label>
                <button
                    type="button"
                    onClick={() => mutate()}
                    disabled={isLoading}
                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                    title="Refresh list"
                >
                    {isLoading ? '⟳' : '↻'} Refresh
                </button>
            </div>

            {isLoading && languages.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('loading')}
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {t('failedToLoad')}
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
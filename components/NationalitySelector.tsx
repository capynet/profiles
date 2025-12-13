// components/NationalitySelector.tsx
'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';

interface Nationality {
    id: number;
    name: string;
}

interface NationalitySelectorProps {
    selectedNationality: number | null;
    onChange: (nationalityId: number | null) => void;
    error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NationalitySelector({
                                                selectedNationality,
                                                onChange,
                                                error
                                            }: NationalitySelectorProps) {
    const t = useTranslations('NationalitySelector');

    const { data: nationalities = [], error: loadError, isLoading, mutate } = useSWR<Nationality[]>(
        '/api/nationalities',
        fetcher,
        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            dedupingInterval: 10000,
        }
    );

    // CSS classes
    const radioClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300";

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

            {isLoading && nationalities.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('loading')}
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {loadError}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    {nationalities.length > 0 ? (
                        nationalities.map(nationality => (
                            <div key={nationality.id} className="flex items-center">
                                <input
                                    type="radio"
                                    id={`nationality-${nationality.id}`}
                                    name="nationality"
                                    checked={selectedNationality === nationality.id}
                                    onChange={() => onChange(nationality.id)}
                                    className={radioClassName}
                                />
                                <label
                                    htmlFor={`nationality-${nationality.id}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {nationality.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">
                            {t('noNationalities')}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>
            )}
        </div>
    );
}
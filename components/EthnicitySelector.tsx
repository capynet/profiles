// components/EthnicitySelector.tsx
'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';

interface Ethnicity {
    id: number;
    name: string;
}

interface EthnicitySelectorProps {
    selectedEthnicity: number | null;
    onChange: (ethnicityId: number | null) => void;
    error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EthnicitySelector({
                                              selectedEthnicity,
                                              onChange,
                                              error
                                          }: EthnicitySelectorProps) {
    const t = useTranslations('EthnicitySelector');

    const { data: ethnicities = [], error: loadError, isLoading, mutate } = useSWR<Ethnicity[]>(
        '/api/ethnicities',
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('title')}
            </label>

            {isLoading && ethnicities.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('loading')}
                </div>
            ) : loadError ? (
                <div className="p-3 text-sm text-red-500 dark:text-red-400">
                    {loadError}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    {ethnicities.length > 0 ? (
                        ethnicities.map(ethnicity => (
                            <div key={ethnicity.id} className="flex items-center">
                                <input
                                    type="radio"
                                    id={`ethnicity-${ethnicity.id}`}
                                    name="ethnicity"
                                    checked={selectedEthnicity === ethnicity.id}
                                    onChange={() => onChange(ethnicity.id)}
                                    className={radioClassName}
                                />
                                <label
                                    htmlFor={`ethnicity-${ethnicity.id}`}
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {ethnicity.name}
                                </label>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">
                            {t('noEthnicities')}
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
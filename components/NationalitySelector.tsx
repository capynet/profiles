// components/NationalitySelector.tsx
'use client';

import { useState, useEffect } from 'react';
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

export default function NationalitySelector({
                                                selectedNationality,
                                                onChange,
                                                error
                                            }: NationalitySelectorProps) {
    const t = useTranslations('NationalitySelector');
    const [nationalities, setNationalities] = useState<Nationality[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNationalities = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/nationalities');
                if (!response.ok) {
                    throw new Error('Failed to fetch nationalities');
                }
                const data = await response.json();
                setNationalities(data);
            } catch (error) {
                console.error('Error fetching nationalities:', error);
                setLoadError(t('failedToLoad'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchNationalities();
    }, [t]);

    // CSS classes
    const radioClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300";

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
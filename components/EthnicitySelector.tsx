// components/EthnicitySelector.tsx
'use client';

import { useState, useEffect } from 'react';

interface Ethnicity {
    id: number;
    name: string;
}

interface EthnicitySelectorProps {
    selectedEthnicity: number | null;
    onChange: (ethnicityId: number | null) => void;
    error?: string;
}

export default function EthnicitySelector({
                                              selectedEthnicity,
                                              onChange,
                                              error
                                          }: EthnicitySelectorProps) {
    const [ethnicities, setEthnicities] = useState<Ethnicity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEthnicities = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/api/ethnicities');
                if (!response.ok) {
                    throw new Error('Failed to fetch ethnicities');
                }
                const data = await response.json();
                setEthnicities(data);
            } catch (error) {
                console.error('Error fetching ethnicities:', error);
                setLoadError('Failed to load ethnicities. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEthnicities();
    }, []);

    // CSS classes
    const radioClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300";

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ethnicity
            </label>

            {isLoading ? (
                <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                    Loading ethnicities...
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
                            No ethnicities available
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
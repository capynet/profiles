'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Language {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface ProfileFiltersProps {
    languages: Language[];
    paymentMethods: PaymentMethod[];
}

export default function ProfileFilters({ languages, paymentMethods }: ProfileFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter states
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    // Initialize filters from URL params
    useEffect(() => {
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const minAgeParam = searchParams.get('minAge');
        const maxAgeParam = searchParams.get('maxAge');
        const languagesParam = searchParams.get('languages');
        const paymentMethodsParam = searchParams.get('paymentMethods');

        if (minPriceParam) setMinPrice(minPriceParam);
        if (maxPriceParam) setMaxPrice(maxPriceParam);
        if (minAgeParam) setMinAge(minAgeParam);
        if (maxAgeParam) setMaxAge(maxAgeParam);

        if (languagesParam) {
            setSelectedLanguages(languagesParam.split(',').map(Number));
        }

        if (paymentMethodsParam) {
            setSelectedPaymentMethods(paymentMethodsParam.split(',').map(Number));
        }
    }, [searchParams]);

    const handleFilter = () => {
        const params = new URLSearchParams();

        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (minAge) params.append('minAge', minAge);
        if (maxAge) params.append('maxAge', maxAge);

        if (selectedLanguages.length > 0) {
            params.append('languages', selectedLanguages.join(','));
        }

        if (selectedPaymentMethods.length > 0) {
            params.append('paymentMethods', selectedPaymentMethods.join(','));
        }

        router.push(`/?${params.toString()}`);
    };

    const handleReset = () => {
        setMinPrice('');
        setMaxPrice('');
        setMinAge('');
        setMaxAge('');
        setSelectedLanguages([]);
        setSelectedPaymentMethods([]);
        router.push('/');
    };

    const toggleLanguage = (id: number) => {
        setSelectedLanguages(prev =>
            prev.includes(id)
                ? prev.filter(langId => langId !== id)
                : [...prev, id]
        );
    };

    const togglePaymentMethod = (id: number) => {
        setSelectedPaymentMethods(prev =>
            prev.includes(id)
                ? prev.filter(methodId => methodId !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h2>
                <button
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm focus:outline-none"
                >
                    {isFiltersVisible ? 'Ocultar' : 'Mostrar'}
                </button>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersVisible ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 space-y-6">
                    {/* Price Range */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio (€)</h3>
                        <div className="flex space-x-2">
                            <div className="w-1/2">
                                <label htmlFor="minPrice" className="sr-only">Precio mínimo</label>
                                <input
                                    type="number"
                                    id="minPrice"
                                    placeholder="Min"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                            <div className="w-1/2">
                                <label htmlFor="maxPrice" className="sr-only">Precio máximo</label>
                                <input
                                    type="number"
                                    id="maxPrice"
                                    placeholder="Max"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Age Range */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Edad</h3>
                        <div className="flex space-x-2">
                            <div className="w-1/2">
                                <label htmlFor="minAge" className="sr-only">Edad mínima</label>
                                <input
                                    type="number"
                                    id="minAge"
                                    placeholder="Min"
                                    value={minAge}
                                    onChange={(e) => setMinAge(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                            <div className="w-1/2">
                                <label htmlFor="maxAge" className="sr-only">Edad máxima</label>
                                <input
                                    type="number"
                                    id="maxAge"
                                    placeholder="Max"
                                    value={maxAge}
                                    onChange={(e) => setMaxAge(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Languages */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idiomas</h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            {languages.map(language => (
                                <div key={language.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`lang-${language.id}`}
                                        checked={selectedLanguages.includes(language.id)}
                                        onChange={() => toggleLanguage(language.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`lang-${language.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {language.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Métodos de Pago</h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            {paymentMethods.map(method => (
                                <div key={method.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`method-${method.id}`}
                                        checked={selectedPaymentMethods.includes(method.id)}
                                        onChange={() => togglePaymentMethod(method.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`method-${method.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {method.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex space-x-2 pt-2">
                        <button
                            onClick={handleFilter}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Aplicar Filtros
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Active filters summary (always visible) */}
            {(minPrice || maxPrice || minAge || maxAge || selectedLanguages.length > 0 || selectedPaymentMethods.length > 0) && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs">
                    <div className="flex flex-wrap gap-2">
                        {minPrice && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                Min: {minPrice}€
              </span>
                        )}
                        {maxPrice && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                Max: {maxPrice}€
              </span>
                        )}
                        {minAge && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                Edad min: {minAge}
              </span>
                        )}
                        {maxAge && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                Edad max: {maxAge}
              </span>
                        )}
                        {selectedLanguages.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                {selectedLanguages.length} idioma(s)
              </span>
                        )}
                        {selectedPaymentMethods.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {selectedPaymentMethods.length} método(s) de pago
              </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
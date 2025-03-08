'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RangeSlider from './RangeSlider';

interface Language {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface SidebarFiltersProps {
    languages: Language[];
    paymentMethods: PaymentMethod[];
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarFilters({
                                           languages,
                                           paymentMethods,
                                           isOpen,
                                           onClose
                                       }: SidebarFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter states
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);

    // Price and age limits for sliders
    const priceMin = 0;
    const priceMax = 500;
    const ageMin = 18;
    const ageMax = 100;

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

        // Close sidebar on mobile after applying filters
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const handleReset = () => {
        setMinPrice('');
        setMaxPrice('');
        setMinAge('');
        setMaxAge('');
        setSelectedLanguages([]);
        setSelectedPaymentMethods([]);
        router.push('/');

        // Close sidebar on mobile after resetting filters
        if (window.innerWidth < 768) {
            onClose();
        }
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

    // Active filters count
    const activeFiltersCount = [
        minPrice, maxPrice, minAge, maxAge,
        ...selectedLanguages, ...selectedPaymentMethods
    ].filter(Boolean).length;

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed md:sticky top-0 left-0 h-full md:h-auto md:max-h-[calc(100vh-4rem)] overflow-y-auto
          w-80 max-w-[80vw] z-50 md:z-10 bg-white dark:bg-gray-800 shadow-lg md:shadow-md transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200 md:hidden"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    {/* Price Range Slider */}
                    <RangeSlider
                        min={priceMin}
                        max={priceMax}
                        step={5}
                        minValue={minPrice}
                        maxValue={maxPrice}
                        onMinChange={setMinPrice}
                        onMaxChange={setMaxPrice}
                        label="Precio (€)"
                    />

                    {/* Age Range Slider */}
                    <RangeSlider
                        min={ageMin}
                        max={ageMax}
                        step={1}
                        minValue={minAge}
                        maxValue={maxAge}
                        onMinChange={setMinAge}
                        onMaxChange={setMaxAge}
                        label="Edad"
                    />

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

                {/* Active filters summary */}
                {activeFiltersCount > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtros activos</h3>
                        <div className="flex flex-wrap gap-2">
                            {minPrice && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    Min: {minPrice}€
                                </span>
                            )}
                            {maxPrice && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    Max: {maxPrice}€
                                </span>
                            )}
                            {minAge && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    Edad min: {minAge}
                                </span>
                            )}
                            {maxAge && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    Edad max: {maxAge}
                                </span>
                            )}
                            {selectedLanguages.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
                                    {selectedLanguages.length} idioma(s)
                                </span>
                            )}
                            {selectedPaymentMethods.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                                    {selectedPaymentMethods.length} método(s) de pago
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
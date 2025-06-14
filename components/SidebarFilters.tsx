'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import RangeSlider from './RangeSlider';

interface Language {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface Nationality {
    id: number;
    name: string;
}

interface Ethnicity {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
}

interface SidebarFiltersProps {
    languages: Language[];
    paymentMethods: PaymentMethod[];
    nationalities: Nationality[];
    ethnicities: Ethnicity[];
    services: Service[];
    isOpen: boolean;
    onClose: () => void;
}

export default function SidebarFilters({
                                           languages,
                                           paymentMethods,
                                           nationalities,
                                           ethnicities,
                                           services,
                                           isOpen,
                                           onClose
                                       }: SidebarFiltersProps) {
    const t = useTranslations('SidebarFilters');
    const nationalityT = useTranslations('ProfileEntities.Nationalities');
    const ethnicityT = useTranslations('ProfileEntities.Ethnicities');
    const languageT = useTranslations('ProfileEntities.Languages');
    const paymentMethodT = useTranslations('ProfileEntities.PaymentMethods');
    const serviceT = useTranslations('ProfileEntities.Services');
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter states
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minAge, setMinAge] = useState<string>('');
    const [maxAge, setMaxAge] = useState<string>('');
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [selectedNationality, setSelectedNationality] = useState<number | null>(null);
    const [selectedEthnicity, setSelectedEthnicity] = useState<number | null>(null);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);

    // Price and age limits for sliders
    const priceMin = 0;
    const priceMax = 500;
    const ageMin = 18;
    const ageMax = 100;

    // Initialize filters from URL params
    useEffect(() => {
        if (!searchParams) return;
        
        const minPriceParam = searchParams.get('minPrice');
        const maxPriceParam = searchParams.get('maxPrice');
        const minAgeParam = searchParams.get('minAge');
        const maxAgeParam = searchParams.get('maxAge');
        const languagesParam = searchParams.get('languages');
        const paymentMethodsParam = searchParams.get('paymentMethods');
        const nationalityParam = searchParams.get('nationality');
        const ethnicityParam = searchParams.get('ethnicity');
        const servicesParam = searchParams.get('services');

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
        
        if (nationalityParam) {
            setSelectedNationality(Number(nationalityParam));
        }
        
        if (ethnicityParam) {
            setSelectedEthnicity(Number(ethnicityParam));
        }
        
        if (servicesParam) {
            setSelectedServices(servicesParam.split(',').map(Number));
        }
    }, [searchParams]);

    const handleFilter = () => {
        // Start with current URL params to preserve location params (lat, lng, radius)
        const params = new URLSearchParams(searchParams?.toString() || '');
        
        // Preserve only location params (lat, lng, radius) and remove any existing filter params
        const locationParams = new URLSearchParams();
        if (params.has('lat')) locationParams.append('lat', params.get('lat')!);
        if (params.has('lng')) locationParams.append('lng', params.get('lng')!);
        if (params.has('radius')) locationParams.append('radius', params.get('radius')!);
        
        // Create new params object starting with preserved location params
        const newParams = new URLSearchParams(locationParams.toString());
        
        // Add filter params
        if (minPrice) newParams.append('minPrice', minPrice);
        if (maxPrice) newParams.append('maxPrice', maxPrice);
        if (minAge) newParams.append('minAge', minAge);
        if (maxAge) newParams.append('maxAge', maxAge);

        if (selectedLanguages.length > 0) {
            newParams.append('languages', selectedLanguages.join(','));
        }

        if (selectedPaymentMethods.length > 0) {
            newParams.append('paymentMethods', selectedPaymentMethods.join(','));
        }

        if (selectedNationality) {
            newParams.append('nationality', selectedNationality.toString());
        }

        if (selectedEthnicity) {
            newParams.append('ethnicity', selectedEthnicity.toString());
        }
        
        if (selectedServices.length > 0) {
            newParams.append('services', selectedServices.join(','));
        }

        router.push(`/?${newParams.toString()}`);

        // Close sidebar on mobile after applying filters
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const handleReset = () => {
        // Reset state
        setMinPrice('');
        setMaxPrice('');
        setMinAge('');
        setMaxAge('');
        setSelectedLanguages([]);
        setSelectedPaymentMethods([]);
        setSelectedNationality(null);
        setSelectedEthnicity(null);
        setSelectedServices([]);
        
        // Preserve location parameters if they exist
        const currentParams = new URLSearchParams(searchParams?.toString() || '');
        const locationParams = new URLSearchParams();
        
        if (currentParams.has('lat')) locationParams.append('lat', currentParams.get('lat')!);
        if (currentParams.has('lng')) locationParams.append('lng', currentParams.get('lng')!);
        if (currentParams.has('radius')) locationParams.append('radius', currentParams.get('radius')!);
        
        // If we have location params, keep them in the URL
        if (locationParams.toString()) {
            router.push(`/?${locationParams.toString()}`);
        } else {
            router.push('/');
        }

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
        ...selectedLanguages, ...selectedPaymentMethods,
        ...selectedServices,
        selectedNationality, selectedEthnicity
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
                        {t('title')}
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
                        label={t('price')}
                        showInputs={false}
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
                        label={t('age')}
                        showInputs={false}
                    />

                    {/* Languages */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('languages')}</h3>
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
                                        {languageT(language.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethods')}</h3>
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
                                        {paymentMethodT(method.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Nationalities */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('nationality')}</h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            <div className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    id="nationality-none"
                                    name="nationality"
                                    checked={selectedNationality === null}
                                    onChange={() => setSelectedNationality(null)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <label
                                    htmlFor="nationality-none"
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {t('any')}
                                </label>
                            </div>
                            {nationalities.map(nationality => (
                                <div key={nationality.id} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`nationality-${nationality.id}`}
                                        name="nationality"
                                        checked={selectedNationality === nationality.id}
                                        onChange={() => setSelectedNationality(nationality.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label
                                        htmlFor={`nationality-${nationality.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {nationalityT(nationality.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Ethnicities */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('ethnicity')}</h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            <div className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    id="ethnicity-none"
                                    name="ethnicity"
                                    checked={selectedEthnicity === null}
                                    onChange={() => setSelectedEthnicity(null)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <label
                                    htmlFor="ethnicity-none"
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    {t('any')}
                                </label>
                            </div>
                            {ethnicities.map(ethnicity => (
                                <div key={ethnicity.id} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`ethnicity-${ethnicity.id}`}
                                        name="ethnicity"
                                        checked={selectedEthnicity === ethnicity.id}
                                        onChange={() => setSelectedEthnicity(ethnicity.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label
                                        htmlFor={`ethnicity-${ethnicity.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {ethnicityT(ethnicity.name)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Services */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('services')}</h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            {services.map(service => (
                                <div key={service.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`service-${service.id}`}
                                        checked={selectedServices.includes(service.id)}
                                        onChange={() => {
                                            if (selectedServices.includes(service.id)) {
                                                setSelectedServices(selectedServices.filter(id => id !== service.id));
                                            } else {
                                                setSelectedServices([...selectedServices, service.id]);
                                            }
                                        }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`service-${service.id}`}
                                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {serviceT(service.name)}
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
                            {t('applyFilters')}
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                            {t('reset')}
                        </button>
                    </div>
                </div>

                {/* Active filters summary */}
                {activeFiltersCount > 0 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('activeFilters')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {minPrice && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    {t('minPrice', { value: minPrice })}
                                </span>
                            )}
                            {maxPrice && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    {t('maxPrice', { value: maxPrice })}
                                </span>
                            )}
                            {minAge && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    {t('minAge', { value: minAge })}
                                </span>
                            )}
                            {maxAge && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs">
                                    {t('maxAge', { value: maxAge })}
                                </span>
                            )}
                            {selectedLanguages.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs">
                                    {t('languagesCount', { count: selectedLanguages.length })}
                                </span>
                            )}
                            {selectedPaymentMethods.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs">
                                    {t('paymentMethodsCount', { count: selectedPaymentMethods.length })}
                                </span>
                            )}
                            {selectedNationality && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
                                    {t('nationalityLabel', { name: nationalityT(nationalities.find(n => n.id === selectedNationality)?.name || '') })}
                                </span>
                            )}
                            {selectedEthnicity && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs">
                                    {t('ethnicityLabel', { name: ethnicityT(ethnicities.find(e => e.id === selectedEthnicity)?.name || '') })}
                                </span>
                            )}
                            {selectedServices.length > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-xs">
                                    {t('servicesCount', { count: selectedServices.length })}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
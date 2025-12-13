'use client';

import { useState, useEffect, useRef } from 'react';
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

interface SidebarFiltersPropsExtended extends SidebarFiltersProps {
    showMap: boolean;
    setShowMap: (value: boolean) => void;
    isNearMeActive: boolean;
    isLocating: boolean;
    handleNearMeClick: () => void;
    radiusValue: number;
    radiusOptions: Array<{value: number, label: string, className?: string}>;
    handleRadiusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function SidebarFilters({
                                           languages,
                                           paymentMethods,
                                           nationalities,
                                           ethnicities,
                                           services,
                                           isOpen,
                                           onClose,
                                           showMap,
                                           setShowMap,
                                           isNearMeActive,
                                           isLocating,
                                           handleNearMeClick,
                                           radiusValue,
                                           radiusOptions,
                                           handleRadiusChange
                                       }: SidebarFiltersPropsExtended) {
    const t = useTranslations('SidebarFilters');
    const searchT = useTranslations('Search');
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
    const [selectedNationalities, setSelectedNationalities] = useState<number[]>([]);
    const [selectedEthnicities, setSelectedEthnicities] = useState<number[]>([]);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);

    // Track if this is the first render and if we're resetting from external event
    const isFirstRender = useRef(true);
    const isResettingFromEvent = useRef(false);

    // Price and age limits for sliders
    const priceMin = 0;
    const priceMax = 500;
    const ageMin = 18;
    const ageMax = 100;

    // Load filters from localStorage on mount
    useEffect(() => {
        const savedFilters = localStorage.getItem('profileFilters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                setMinPrice(filters.minPrice || '');
                setMaxPrice(filters.maxPrice || '');
                setMinAge(filters.minAge || '');
                setMaxAge(filters.maxAge || '');
                setSelectedLanguages(filters.selectedLanguages || []);
                setSelectedPaymentMethods(filters.selectedPaymentMethods || []);
                setSelectedNationalities(filters.selectedNationalities || []);
                setSelectedEthnicities(filters.selectedEthnicities || []);
                setSelectedServices(filters.selectedServices || []);
            } catch (e) {
                console.error('Error loading filters from localStorage:', e);
            }
        }

        // Mark first render as complete
        isFirstRender.current = false;
    }, []);

    // Listen for external filter clear events
    useEffect(() => {
        const handleFiltersChanged = (event: any) => {
            const filters = event.detail;

            // Check if filters were cleared (empty object)
            const isEmpty = !filters.minPrice && !filters.maxPrice && !filters.minAge && !filters.maxAge &&
                (!filters.selectedLanguages || filters.selectedLanguages.length === 0) &&
                (!filters.selectedPaymentMethods || filters.selectedPaymentMethods.length === 0) &&
                (!filters.selectedNationalities || filters.selectedNationalities.length === 0) &&
                (!filters.selectedEthnicities || filters.selectedEthnicities.length === 0) &&
                (!filters.selectedServices || filters.selectedServices.length === 0);

            if (isEmpty) {
                // Mark that we're resetting from external event to avoid triggering another event
                isResettingFromEvent.current = true;

                // Reset all filter states
                setMinPrice('');
                setMaxPrice('');
                setMinAge('');
                setMaxAge('');
                setSelectedLanguages([]);
                setSelectedPaymentMethods([]);
                setSelectedNationalities([]);
                setSelectedEthnicities([]);
                setSelectedServices([]);

                // Reset the flag after state updates
                setTimeout(() => {
                    isResettingFromEvent.current = false;
                }, 100);
            }
        };

        window.addEventListener('filtersChanged', handleFiltersChanged);
        return () => window.removeEventListener('filtersChanged', handleFiltersChanged);
    }, []);

    // Save filters to localStorage and trigger a custom event
    useEffect(() => {
        // Skip on first render or when resetting from external event
        if (isFirstRender.current || isResettingFromEvent.current) {
            return;
        }

        const filters = {
            minPrice,
            maxPrice,
            minAge,
            maxAge,
            selectedLanguages,
            selectedPaymentMethods,
            selectedNationalities,
            selectedEthnicities,
            selectedServices
        };

        // Save to localStorage
        localStorage.setItem('profileFilters', JSON.stringify(filters));

        // Dispatch custom event to notify HomeClient
        const timeoutId = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('filtersChanged', { detail: filters }));
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [minPrice, maxPrice, minAge, maxAge, selectedLanguages, selectedPaymentMethods, selectedNationalities, selectedEthnicities, selectedServices]);

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

    const toggleNationality = (id: number) => {
        setSelectedNationalities(prev =>
            prev.includes(id)
                ? prev.filter(natId => natId !== id)
                : [...prev, id]
        );
    };

    const toggleEthnicity = (id: number) => {
        setSelectedEthnicities(prev =>
            prev.includes(id)
                ? prev.filter(ethId => ethId !== id)
                : [...prev, id]
        );
    };

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
          fixed md:relative top-0 left-0 h-full md:h-auto overflow-y-auto
          w-80 max-w-[80vw] z-50 md:z-10 bg-white dark:bg-gray-800 shadow-lg md:shadow-md transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end items-center md:hidden">
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label="Cerrar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Map and Near Me controls */}
                <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
                    {/* Map toggle button */}
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                            showMap
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                        aria-label={showMap ? searchT('hideMap') : searchT('showMap')}
                        title={showMap ? searchT('hideMap') : searchT('showMap')}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            <span>{showMap ? searchT('hideMap') : searchT('showMap')}</span>
                        </div>
                    </button>

                    {/* Near Me button */}
                    <button
                        onClick={() => handleNearMeClick()}
                        disabled={isLocating}
                        className={`w-full px-3 py-2 text-sm rounded-md border ${
                            isNearMeActive
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                        aria-label={searchT('nearMe')}
                        title={searchT('nearMe')}
                    >
                        <div className="flex items-center justify-center space-x-2">
                            {isLocating ? (
                                <>
                                    <div className="h-5 w-5 border-t-2 border-green-500 rounded-full animate-spin"></div>
                                    <span>{searchT('locating')}</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{searchT('nearMe')}</span>
                                </>
                            )}
                        </div>
                    </button>

                    {/* Radius button group - visible when Near Me is active */}
                    {isNearMeActive && (
                        <div className="flex flex-wrap gap-2">
                            {radiusOptions.map((option, index, arr) => {
                                const isLastOptionForDesktop = option.value === 100 && option.label === "Sin límite";
                                const isLastOptionForMobile = option.value === 100 && option.label === "∞";

                                // Skip the mobile-only option in sidebar
                                if (isLastOptionForMobile) return null;

                                return (
                                    <button
                                        key={`${option.value}-${option.label}`}
                                        onClick={() => handleRadiusChange({ target: { value: option.value.toString() }} as React.ChangeEvent<HTMLSelectElement>)}
                                        className={`
                                            flex-1 px-2 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md
                                            ${radiusValue === option.value
                                                ? 'bg-green-600 text-white border-green-600 dark:bg-green-600 dark:text-white dark:border-green-700'
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }
                                            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500
                                        `}
                                        title={option.value === 100 ? searchT('noLimitLong') : `${searchT('searchRadius')}: ${option.label}`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
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

                    {/* Services */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('services')}</h3>
                        <div className="space-y-1">
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

                    {/* Languages */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('languages')}</h3>
                        <div className="space-y-1">
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
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('paymentMethods')}</h3>
                        <div className="space-y-1">
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
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('nationality')}</h3>
                        <div className="space-y-1">
                            {nationalities.map(nationality => (
                                <div key={nationality.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`nationality-${nationality.id}`}
                                        checked={selectedNationalities.includes(nationality.id)}
                                        onChange={() => toggleNationality(nationality.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t('ethnicity')}</h3>
                        <div className="space-y-1">
                            {ethnicities.map(ethnicity => (
                                <div key={ethnicity.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`ethnicity-${ethnicity.id}`}
                                        checked={selectedEthnicities.includes(ethnicity.id)}
                                        onChange={() => toggleEthnicity(ethnicity.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
                </div>
            </aside>
        </>
    );
}
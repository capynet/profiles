'use client';

import {useState, useEffect, useMemo} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import { useTranslations } from 'next-intl';
import ProfileCard from '@/components/ProfileCard';
import SidebarFilters from '@/components/SidebarFilters';
import dynamic from 'next/dynamic';

const ProfileMap = dynamic(() => import('@/components/ProfileMap'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    )
});
import CreateProfileBanner from '@/components/CreateProfileBanner';
import PublishProfileBanner from '@/components/PublishProfileBanner';

interface ProfileImage {
    id: number;
    mediumUrl: string;
    thumbnailUrl?: string | null;
}

interface Profile {
    id: number;
    name: string;
    age: number;
    price: number;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    images: ProfileImage[];
    languages: Array<{ language: { id: number; name: string } }>;
    paymentMethods: Array<{ paymentMethod: { id: number; name: string } }>;
    nationalities?: Array<{ nationality: { id: number; name: string } }>;
    ethnicities?: Array<{ ethnicity: { id: number; name: string } }>;
    services?: Array<{ service: { id: number; name: string } }>;
}

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

interface HomeClientProps {
    initialProfiles: Profile[];
    languages: Language[];
    paymentMethods: PaymentMethod[];
    nationalities: Nationality[];
    ethnicities: Ethnicity[];
    services: Service[];
    googleMapsApiKey: string;
    googleMapsId?: string;
    user?: {
        id: string;
        hasProfile: boolean;
        profilePublished?: boolean;
    } | null;
}

export default function HomeClient({
                                       initialProfiles,
                                       languages,
                                       paymentMethods,
                                       nationalities,
                                       ethnicities,
                                       services,
                                       googleMapsApiKey,
                                       googleMapsId,
                                       user
                                   }: HomeClientProps) {
    const t = useTranslations('Search');
    
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isNearMeActive, setIsNearMeActive] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [filtersKey, setFiltersKey] = useState(0); // Force re-render when filters change
    const searchParams = useSearchParams();

    // Initialize map once when it's first shown
    useEffect(() => {
        if (showMap && !mapInitialized) {
            setMapInitialized(true);
        }
    }, [showMap, mapInitialized]);
    
    // Initialize radius value from URL parameters on component load
    useEffect(() => {
        if (searchParams) {
            const radius = searchParams.get('radius');
            if (radius) {
                // Use parseFloat to handle decimal values like 0.2 and 0.5
                const radiusValue = parseFloat(radius);
                console.log('Setting radius from URL to:', radiusValue);
                setRadiusValue(radiusValue);
            }
        }
    }, [searchParams]);

    const [radiusValue, setRadiusValue] = useState(10); // Default 10km radius
    
    // Handle radius change (works with both the select dropdown and button group)
    const handleRadiusChange = async (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string } }) => {
        // Parse as float to handle decimal values like 0.2 and 0.5
        const newRadius = parseFloat(e.target.value);
        setRadiusValue(newRadius);
        
        console.log('Changed radius to:', newRadius, 'type:', typeof newRadius);
        
        // If near me is active, update the URL params and fetch profiles with this radius
        if (isNearMeActive && userLocation) {
            // Show loading indicator briefly for UI feedback
            setLoading(true);
            
            // Preserve all existing parameters (including filters)
            const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
            
            // Update only the radius parameter
            currentParams.set('radius', newRadius.toString());
            
            // Navigate with all parameters preserved
            router.push(`/?${currentParams.toString()}`);
            
            // The useEffect for searchParams will handle the data fetch
        }
    };
    
    const router = useRouter();
    
    // Define available radius options for search
    const radiusOptions = [
        { value: 0.2, label: "200 m" },
        { value: 0.5, label: "500 m" },
        { value: 1, label: "1 km" },
        { value: 2, label: "2 km" },
        { value: 5, label: "5 km" },
        { value: 100, label: t('noLimitLong'), className: "hidden sm:block" },
        { value: 100, label: "∞", className: "sm:hidden" }
    ];
    
    // Function to find profiles with the minimum radius needed
    const findProfilesWithMinimumRadius = async (lat: number, lng: number) => {
        setIsLocating(true);
        
        // Results cache to prevent UI updates during search
        let foundProfiles = [];
        let foundRadius = 0;
        
        // Preserve existing filters
        const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
        
        // Try each radius option from smallest to largest until we find results
        for (const option of radiusOptions) {
            // Skip duplicate "No limit" option
            if (option.value === 100 && option.label === "∞") continue;
            
            try {
                const radius = option.value;
                console.log(`Searching with radius: ${radius}`);
                
                // Use existing filters but add location params
                const params = new URLSearchParams(currentParams.toString());
                params.set('lat', lat.toString());
                params.set('lng', lng.toString());
                params.set('radius', radius.toString());
                
                const response = await fetch(`/api/profiles?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch profiles');
                }
                
                const data = await response.json();
                
                // If we have results, use this radius
                if (data.length > 0) {
                    console.log(`Found ${data.length} profiles with radius ${radius}`);
                    foundProfiles = data;
                    foundRadius = radius;
                    
                    // Stop searching once we find results
                    break;
                }
                
                // If no results with this radius, try the next larger one
                console.log(`No profiles found with radius ${radius}, trying larger radius`);
                
            } catch (error) {
                console.error(`Error searching with radius ${option.value}:`, error);
            }
        }
        
        // After search is complete, update UI once
        if (foundProfiles.length > 0) {
            // We found profiles, use this radius
            setRadiusValue(foundRadius);
            setProfiles(foundProfiles);
            
            // Update URL with this radius but preserve other filters
            const updatedParams = new URLSearchParams(currentParams.toString());
            updatedParams.set('lat', lat.toString());
            updatedParams.set('lng', lng.toString());
            updatedParams.set('radius', foundRadius.toString());
            router.push(`/?${updatedParams.toString()}`);
            
            return true;
        } else {
            // No profiles found with any radius, use the largest normal radius
            const largestNormalRadius = radiusOptions.filter(o => o.value !== 100)[radiusOptions.filter(o => o.value !== 100).length - 1].value;
            setRadiusValue(largestNormalRadius);
            
            // Update URL with this radius but preserve other filters
            const updatedParams = new URLSearchParams(currentParams.toString());
            updatedParams.set('lat', lat.toString());
            updatedParams.set('lng', lng.toString());
            updatedParams.set('radius', largestNormalRadius.toString());
            router.push(`/?${updatedParams.toString()}`);
            
            return false;
        }
    };

    // Handle "Near Me" button click
    const handleNearMeClick = () => {
        if (isNearMeActive) {
            // If already active, deactivate it and reset
            setIsNearMeActive(false);
            setUserLocation(null);
            
            // Remove only location params but preserve other filters
            const currentParams = new URLSearchParams(searchParams ? searchParams.toString() : '');
            currentParams.delete('lat');
            currentParams.delete('lng');
            currentParams.delete('radius');
            router.push(`/?${currentParams.toString()}`);
            
            return;
        }
        
        setIsLocating(true);
        
        // Get user's geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });
                    setIsNearMeActive(true);
                    
                    // Find profiles with the minimum radius needed while preserving filters
                    await findProfilesWithMinimumRadius(latitude, longitude);
                    
                    setIsLocating(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Please ensure location services are enabled.');
                    setIsLocating(false);
                    setIsNearMeActive(false);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            alert('Geolocation is not supported by your browser');
            setIsLocating(false);
        }
    };

    // Fetch profiles based on filters
    const fetchProfiles = async () => {
        try {
            setLoading(true);

            // Get filters from localStorage
            const savedFilters = localStorage.getItem('profileFilters');
            const filters = savedFilters ? JSON.parse(savedFilters) : {};

            // Build query params with location data from URL
            const params = new URLSearchParams();

            // Add location params from URL
            if (searchParams) {
                if (searchParams.has('lat')) params.set('lat', searchParams.get('lat')!);
                if (searchParams.has('lng')) params.set('lng', searchParams.get('lng')!);
                if (searchParams.has('radius')) params.set('radius', searchParams.get('radius')!);
            }

            // Add filter params from localStorage
            if (filters.minPrice) params.set('minPrice', filters.minPrice);
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
            if (filters.minAge) params.set('minAge', filters.minAge);
            if (filters.maxAge) params.set('maxAge', filters.maxAge);
            if (filters.selectedLanguages?.length > 0) params.set('languages', filters.selectedLanguages.join(','));
            if (filters.selectedPaymentMethods?.length > 0) params.set('paymentMethods', filters.selectedPaymentMethods.join(','));
            if (filters.selectedNationalities?.length > 0) params.set('nationalities', filters.selectedNationalities.join(','));
            if (filters.selectedEthnicities?.length > 0) params.set('ethnicities', filters.selectedEthnicities.join(','));
            if (filters.selectedServices?.length > 0) params.set('services', filters.selectedServices.join(','));

            const response = await fetch(`/api/profiles?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch profiles');
            }

            const data = await response.json();
            setProfiles(data);

            // Check if near me filter is active based on URL params
            if (searchParams && searchParams.has('lat') && searchParams.has('lng')) {
                setIsNearMeActive(true);
                setUserLocation({
                    lat: parseFloat(searchParams.get('lat') || '0'),
                    lng: parseFloat(searchParams.get('lng') || '0')
                });
            } else {
                setIsNearMeActive(false);
                setUserLocation(null);
            }
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch profiles when URL params change (location)
    useEffect(() => {
        fetchProfiles();
    }, [searchParams]);

    // Listen for filter changes from localStorage
    useEffect(() => {
        const handleFiltersChanged = () => {
            setFiltersKey(prev => prev + 1); // Trigger re-render of filter badges
            fetchProfiles();
        };

        window.addEventListener('filtersChanged', handleFiltersChanged);
        return () => window.removeEventListener('filtersChanged', handleFiltersChanged);
    }, [searchParams]);

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Show create profile banner for logged-in users without a profile */}
            {user && !user.hasProfile && (
                <CreateProfileBanner className="mb-8" />
            )}

            {/* Show publish profile banner for logged-in users with unpublished profile */}
            {user && user.hasProfile && !user.profilePublished && (
                <PublishProfileBanner className="mb-8" />
            )}

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Filters */}
                <SidebarFilters
                    languages={languages}
                    paymentMethods={paymentMethods}
                    nationalities={nationalities}
                    ethnicities={ethnicities}
                    services={services}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    showMap={showMap}
                    setShowMap={setShowMap}
                    isNearMeActive={isNearMeActive}
                    isLocating={isLocating}
                    handleNearMeClick={handleNearMeClick}
                    radiusValue={radiusValue}
                    radiusOptions={radiusOptions}
                    handleRadiusChange={handleRadiusChange}
                />

                {/* Main Content */}
                <div className="flex-1">
                    {/* Active filters and mobile button */}
                    {(() => {
                        const savedFilters = typeof window !== 'undefined' ? localStorage.getItem('profileFilters') : null;
                        const filters = savedFilters ? JSON.parse(savedFilters) : {};
                        const hasFilters = filters.minPrice || filters.maxPrice || filters.minAge || filters.maxAge ||
                            filters.selectedLanguages?.length > 0 || filters.selectedPaymentMethods?.length > 0 ||
                            filters.selectedNationalities?.length > 0 || filters.selectedEthnicities?.length > 0 ||
                            filters.selectedServices?.length > 0;

                        if (!hasFilters) {
                            // Only show mobile filter button without container
                            return (
                                <div className="flex justify-end mb-6 md:hidden">
                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="px-3 py-2 bg-indigo-600 text-white rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                                        </svg>
                                        <span>{t('filters')}</span>
                                    </button>
                                </div>
                            );
                        }

                        const removeFilter = (filterType: string, value?: any) => {
                            const savedFilters = localStorage.getItem('profileFilters');
                            const currentFilters = savedFilters ? JSON.parse(savedFilters) : {};

                            switch (filterType) {
                                case 'minPrice':
                                    delete currentFilters.minPrice;
                                    break;
                                case 'maxPrice':
                                    delete currentFilters.maxPrice;
                                    break;
                                case 'minAge':
                                    delete currentFilters.minAge;
                                    break;
                                case 'maxAge':
                                    delete currentFilters.maxAge;
                                    break;
                                case 'languages':
                                    currentFilters.selectedLanguages = [];
                                    break;
                                case 'paymentMethods':
                                    currentFilters.selectedPaymentMethods = [];
                                    break;
                                case 'nationalities':
                                    currentFilters.selectedNationalities = [];
                                    break;
                                case 'ethnicities':
                                    currentFilters.selectedEthnicities = [];
                                    break;
                                case 'services':
                                    currentFilters.selectedServices = [];
                                    break;
                            }

                            localStorage.setItem('profileFilters', JSON.stringify(currentFilters));
                            setFiltersKey(prev => prev + 1);
                            window.dispatchEvent(new CustomEvent('filtersChanged', { detail: currentFilters }));
                        };

                        return (
                            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                                {/* Active Filters - Left side */}
                                <div key={filtersKey} className="flex flex-wrap gap-2 items-center">
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem('profileFilters');
                                            setFiltersKey(prev => prev + 1);
                                            window.dispatchEvent(new CustomEvent('filtersChanged', { detail: {} }));
                                        }}
                                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Limpiar filtros
                                    </button>
                                    {filters.minPrice && (
                                        <button
                                            onClick={() => removeFilter('minPrice')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Mín: {filters.minPrice}€
                                        </button>
                                    )}
                                    {filters.maxPrice && (
                                        <button
                                            onClick={() => removeFilter('maxPrice')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Máx: {filters.maxPrice}€
                                        </button>
                                    )}
                                    {filters.minAge && (
                                        <button
                                            onClick={() => removeFilter('minAge')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Edad mín: {filters.minAge}
                                        </button>
                                    )}
                                    {filters.maxAge && (
                                        <button
                                            onClick={() => removeFilter('maxAge')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            Edad máx: {filters.maxAge}
                                        </button>
                                    )}
                                    {filters.selectedLanguages?.length > 0 && (
                                        <button
                                            onClick={() => removeFilter('languages')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {filters.selectedLanguages.length} {filters.selectedLanguages.length === 1 ? 'Idioma' : 'Idiomas'}
                                        </button>
                                    )}
                                    {filters.selectedPaymentMethods?.length > 0 && (
                                        <button
                                            onClick={() => removeFilter('paymentMethods')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {filters.selectedPaymentMethods.length} {filters.selectedPaymentMethods.length === 1 ? 'Método de pago' : 'Métodos de pago'}
                                        </button>
                                    )}
                                    {filters.selectedNationalities?.length > 0 && (
                                        <button
                                            onClick={() => removeFilter('nationalities')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {filters.selectedNationalities.length} {filters.selectedNationalities.length === 1 ? 'Nacionalidad' : 'Nacionalidades'}
                                        </button>
                                    )}
                                    {filters.selectedEthnicities?.length > 0 && (
                                        <button
                                            onClick={() => removeFilter('ethnicities')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {filters.selectedEthnicities.length} {filters.selectedEthnicities.length === 1 ? 'Etnia' : 'Etnias'}
                                        </button>
                                    )}
                                    {filters.selectedServices?.length > 0 && (
                                        <button
                                            onClick={() => removeFilter('services')}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 text-sm hover:bg-pink-200 dark:hover:bg-pink-800 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {filters.selectedServices.length} {filters.selectedServices.length === 1 ? 'Servicio' : 'Servicios'}
                                        </button>
                                    )}
                                </div>

                                {/* Mobile filter toggle - Right side */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="md:hidden px-3 py-2 bg-indigo-600 text-white rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                                    </svg>
                                    <span>{t('filters')}</span>
                                </button>
                            </div>
                        );
                    })()}

                    {/* Map (rendered once then kept in DOM) */}
                    <div
                        className={`mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ease-in-out ${
                            showMap ? 'opacity-100 max-h-[650px]' : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                    >
                        {/* No longer needed as radius control has been moved */}

                        {mapInitialized && (profiles.length > 0 || userLocation) && (
                            <ProfileMap
                                profiles={profiles}
                                apiKey={googleMapsApiKey}
                                mapId={googleMapsId}
                                userLocation={userLocation}
                                radius={radiusValue}
                            />
                        )}
                    </div>

                    {/* Proximity message when Near Me is active */}
                    {isNearMeActive && (
                        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                <p>
                                    {radiusValue === 100 ? (
                                        <>Mostrando <span className="font-medium">{profiles.length} perfiles</span> <span className="font-medium">sin límite de distancia</span>, ordenados por proximidad a tu ubicación.</>
                                    ) : (
                                        <>Mostrando <span className="font-medium">{profiles.length} perfiles</span> dentro de <span className="font-medium">
                                            {radiusValue < 1 ? `${radiusValue * 1000} m` : `${radiusValue} km`}
                                        </span> de tu ubicación, ordenados por proximidad.</>
                                    )}
                                </p>
                                {/* Active filters message */}
                                {(() => {
                                    const savedFilters = typeof window !== 'undefined' ? localStorage.getItem('profileFilters') : null;
                                    const filters = savedFilters ? JSON.parse(savedFilters) : {};
                                    const hasFilters = filters.minPrice || filters.maxPrice || filters.minAge || filters.maxAge ||
                                        filters.selectedLanguages?.length > 0 || filters.selectedPaymentMethods?.length > 0 ||
                                        filters.selectedNationalities?.length > 0 || filters.selectedEthnicities?.length > 0 ||
                                        filters.selectedServices?.length > 0;

                                    return hasFilters && (
                                        <p className="mt-1 text-xs italic">
                                            {t('filteredResults')}
                                        </p>
                                    );
                                })()}
                                {!showMap && (
                                    <button 
                                        onClick={() => setShowMap(true)}
                                        className="mt-1 text-green-600 dark:text-green-400 underline hover:no-underline text-sm"
                                    >
                                        {t('showMap')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Profiles Grid (always visible) */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <>
                            {profiles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {profiles.map((profile, index) => (
                                        <ProfileCard
                                            key={profile.id}
                                            id={profile.id}
                                            name={profile.name}
                                            age={profile.age}
                                            price={profile.price}
                                            description={profile.description}
                                            address={profile.address}
                                            images={profile.images}
                                            languages={profile.languages}
                                            paymentMethods={profile.paymentMethods}
                                            nationalities={profile.nationalities}
                                            ethnicities={profile.ethnicities}
                                            services={profile.services}
                                            priority={index < 4}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">{t('noResultsFound')}</h3>
                                    <p className="text-gray-600 dark:text-gray-400">{t('tryModifyingFilters')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
'use client';

import {useState, useEffect} from 'react';
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
    const [showMap, setShowMap] = useState(false);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isNearMeActive, setIsNearMeActive] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
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
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
                const response = await fetch(`/api/profiles?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch profiles');
                }

                const data = await response.json();
                setProfiles(data);
                
                // Check if near me filter is active based on URL params
                if (params.has('lat') && params.has('lng')) {
                    setIsNearMeActive(true);
                    setUserLocation({
                        lat: parseFloat(params.get('lat') || '0'), 
                        lng: parseFloat(params.get('lng') || '0')
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

        fetchProfiles();
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

            {/* Header with toggle for map */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('searchProfiles')}</h1>

                <div className="flex items-center flex-wrap gap-2 sm:flex-nowrap sm:space-x-2">
                    {/* Map toggle button */}
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`px-3 py-2 text-sm rounded-md border ${
                            showMap
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                        aria-label={showMap ? t('hideMap') : t('showMap')}
                        title={showMap ? t('hideMap') : t('showMap')}
                    >
                        <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            <span>{showMap ? t('hideMap') : t('showMap')}</span>
                        </div>
                    </button>
                    
                    {/* Near Me button */}
                    <button
                        onClick={() => handleNearMeClick()}
                        disabled={isLocating}
                        className={`px-3 py-2 text-sm rounded-md border ${
                            isNearMeActive
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                        aria-label={t('nearMe')}
                        title={t('nearMe')}
                    >
                        <div className="flex items-center space-x-1">
                            {isLocating ? (
                                <>
                                    <div className="h-5 w-5 border-t-2 border-green-500 rounded-full animate-spin"></div>
                                    <span>{t('locating')}</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{t('nearMe')}</span>
                                </>
                            )}
                        </div>
                    </button>
                    
                    {/* Radius button group - visible when Near Me is active */}
                    {isNearMeActive && (
                        <div className="flex ml-2 rounded-md shadow-sm h-full">
                            {radiusOptions.map((option, index, arr) => {
                                // Filter out duplicates (the "Sin límite" and "∞" options both have value 100)
                                const isLastOptionForDesktop = option.value === 100 && option.label === "Sin límite";
                                const isLastOptionForMobile = option.value === 100 && option.label === "∞";
                                
                                // Calculate if this is the first or last visible button in the group
                                const isFirst = index === 0;
                                const isLast = index === arr.length - 2 && isLastOptionForDesktop || index === arr.length - 1 && isLastOptionForMobile;
                                
                                return (
                                    <button
                                        key={`${option.value}-${option.label}`}
                                        onClick={() => handleRadiusChange({ target: { value: option.value.toString() }} as React.ChangeEvent<HTMLSelectElement>)}
                                        className={`
                                            px-2 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600
                                            ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''}
                                            ${index > 0 ? '-ml-px' : ''}
                                            ${radiusValue === option.value 
                                                ? 'bg-green-600 text-white border-green-600 dark:bg-green-600 dark:text-white dark:border-green-700 z-10' 
                                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }
                                            focus:z-10 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500
                                            ${option.className || ''}
                                        `}
                                        title={option.value === 100 ? t('noLimitLong') : `${t('searchRadius')}: ${option.label}`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Mobile filter toggle */}
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
            </div>

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
                />

                {/* Main Content */}
                <div className="flex-1">
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
                                key={`map-${radiusValue}-${userLocation?.lat}-${userLocation?.lng}`} // Force re-render on radius or location change
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
                                {(searchParams && (searchParams.has('minPrice') || searchParams.has('maxPrice') || 
                                  searchParams.has('minAge') || searchParams.has('maxAge') || 
                                  searchParams.has('languages') || searchParams.has('paymentMethods') ||
                                  searchParams.has('nationality') || searchParams.has('ethnicity') ||
                                  searchParams.has('services'))) && (
                                    <p className="mt-1 text-xs italic">
                                        {t('filteredResults')}
                                    </p>
                                )}
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
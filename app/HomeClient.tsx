'use client';

import {useState, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';
import SidebarFilters from '@/components/SidebarFilters';
import ProfileMap from '@/components/ProfileMap';
import CreateProfileBanner from '@/components/CreateProfileBanner';

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
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [mapInitialized, setMapInitialized] = useState(false);
    const searchParams = useSearchParams();

    // Initialize map once when it's first shown
    useEffect(() => {
        if (showMap && !mapInitialized) {
            setMapInitialized(true);
        }
    }, [showMap, mapInitialized]);

    // Fetch profiles based on filters
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(searchParams);
                const response = await fetch(`/api/profiles?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch profiles');
                }

                const data = await response.json();
                setProfiles(data);
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

            {/* Header with toggle for map */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Encuentra Perfiles</h1>

                <div className="flex space-x-2">
                    {/* Map toggle button */}
                    <button
                        onClick={() => setShowMap(!showMap)}
                        className={`px-3 py-2 text-sm rounded-md border ${
                            showMap
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                        }`}
                        aria-label={showMap ? "Hide map" : "Show map"}
                        title={showMap ? "Hide map" : "Show map"}
                    >
                        <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                            </svg>
                            <span>{showMap ? "Hide map" : "Show map"}</span>
                        </div>
                    </button>

                    {/* Mobile filter toggle */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden px-3 py-2 bg-indigo-600 text-white rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                        </svg>
                        <span>Filtros</span>
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
                            showMap ? 'opacity-100 max-h-[600px]' : 'opacity-0 max-h-0 overflow-hidden'
                        }`}
                    >
                        {mapInitialized && profiles.length > 0 && (
                            <ProfileMap
                                profiles={profiles}
                                apiKey={googleMapsApiKey}
                                mapId={googleMapsId}
                            />
                        )}
                    </div>

                    {/* Profiles Grid (always visible) */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : (
                        <>
                            {profiles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {profiles.map(profile => (
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
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No se encontraron perfiles</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Intenta modificar los filtros de búsqueda</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
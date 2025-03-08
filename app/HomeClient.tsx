'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProfileCard from '@/components/ProfileCard';
import ProfileFilters from '@/components/ProfileFilters';

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
}

interface Language {
    id: number;
    name: string;
}

interface PaymentMethod {
    id: number;
    name: string;
}

interface HomeClientProps {
    initialProfiles: Profile[];
    languages: Language[];
    paymentMethods: PaymentMethod[];
}

export default function HomeClient({ initialProfiles, languages, paymentMethods }: HomeClientProps) {
    const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

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
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Encuentra Perfiles</h1>
                <ProfileFilters languages={languages} paymentMethods={paymentMethods} />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <>
                    {profiles.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    );
}
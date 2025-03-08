'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useLoadScript, InfoWindow, MarkerF } from '@react-google-maps/api';
import ProfileMapCard from './ProfileMapCard';

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

interface ProfileMapProps {
    profiles: Profile[];
    apiKey: string;
    mapId?: string; // Optional Map ID for advanced features
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
};

// List of libraries to use with Google Maps
const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = [];

export default function ProfileMap({ profiles, apiKey, mapId }: ProfileMapProps) {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Load the Google Maps script using the hook
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries,
    });

    // Calculate center of map based on profile locations
    const center = useMemo(() => {
        if (profiles.length === 0) {
            // Default center (e.g., Madrid, Spain)
            return { lat: 40.4168, lng: -3.7038 };
        }

        const sumLat = profiles.reduce((sum, profile) => sum + profile.latitude, 0);
        const sumLng = profiles.reduce((sum, profile) => sum + profile.longitude, 0);

        return {
            lat: sumLat / profiles.length,
            lng: sumLng / profiles.length
        };
    }, [profiles]);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    if (loadError) {
        return <div className="p-4 text-red-500">Error loading maps: {loadError.message}</div>;
    }

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // Since we can't use AdvancedMarkerElement without a Map ID, we'll use the MarkerF component
    // MarkerF is the functional version of Marker in @react-google-maps/api
    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={() => setSelectedProfile(null)}
            options={{
                mapId: mapId, // This is needed for Advanced Markers, but we'll fall back to regular markers
            }}
        >
            {profiles.map(profile => (
                <MarkerF
                    key={profile.id}
                    position={{ lat: profile.latitude, lng: profile.longitude }}
                    onClick={() => setSelectedProfile(profile)}
                    icon={{
                        path: "M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z",
                        fillColor: "#4F46E5",
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#FFFFFF",
                        scale: 1.5,
                        anchor: new google.maps.Point(12, 22),
                    }}
                />
            ))}

            {selectedProfile && (
                <InfoWindow
                    position={{ lat: selectedProfile.latitude, lng: selectedProfile.longitude }}
                    onCloseClick={() => setSelectedProfile(null)}
                >
                    <div className="bg-white rounded overflow-hidden">
                        <ProfileMapCard
                            id={selectedProfile.id}
                            name={selectedProfile.name}
                            age={selectedProfile.age}
                            price={selectedProfile.price}
                            images={selectedProfile.images}
                            address={selectedProfile.address}
                        />
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>
    );
}
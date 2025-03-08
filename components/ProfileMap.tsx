'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
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
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
};

export default function ProfileMap({ profiles, apiKey }: ProfileMapProps) {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

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

    return (
        <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {profiles.map(profile => (
                    <Marker
                        key={profile.id}
                        position={{ lat: profile.latitude, lng: profile.longitude }}
                        onClick={() => setSelectedProfile(profile)}
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
        </LoadScript>
    );
}
'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GoogleMap, useLoadScript, InfoWindow, Marker } from '@react-google-maps/api';
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
    mapId?: string;
    userLocation?: { lat: number, lng: number } | null;
    radius?: number; // Radius in kilometers
}

const mapContainerStyle = {
    width: '100%',
    height: '600px'
};

// Define libraries as a static constant outside the component
// This prevents React from reloading the script unnecessarily
const libraries = ["marker"] as const;

export default function ProfileMap({ profiles, apiKey, mapId, userLocation, radius = 10 }: ProfileMapProps) {
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const circleRef = useRef<google.maps.Circle | null>(null);

    // Load the Google Maps script using the hook with static libraries array
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries
    });

    // Calculate center of map based on user location or profile locations
    const center = useMemo(() => {
        // If user location is provided, use that as center
        if (userLocation) {
            return userLocation;
        }
        
        // If no profiles, use default center
        if (profiles.length === 0) {
            // Default center (e.g., Madrid, Spain)
            return { lat: 40.4168, lng: -3.7038 };
        }

        // Otherwise, center map on average of all profile locations
        const sumLat = profiles.reduce((sum, profile) => sum + profile.latitude, 0);
        const sumLng = profiles.reduce((sum, profile) => sum + profile.longitude, 0);

        return {
            lat: sumLat / profiles.length,
            lng: sumLng / profiles.length
        };
    }, [profiles, userLocation]);

    // Create or update the circle when the map or user location changes
    useEffect(() => {
        // Only execute if the map is loaded and google object is available
        if (isLoaded && mapRef.current && userLocation && window.google) {
            // Clear existing circle
            if (circleRef.current) {
                circleRef.current.setMap(null);
            }
            
            // Create new circle
            circleRef.current = new window.google.maps.Circle({
                map: mapRef.current,
                center: userLocation,
                radius: radius * 1000, // Convert km to meters
                fillColor: "#22C55E",
                fillOpacity: 0.1,
                strokeColor: "#22C55E",
                strokeOpacity: 0.5,
                strokeWeight: 1,
                clickable: false,
                zIndex: 1
            });
        }
        
        // Clean up on unmount
        return () => {
            if (circleRef.current) {
                circleRef.current.setMap(null);
                circleRef.current = null;
            }
        };
    }, [isLoaded, userLocation, radius, mapRef]);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // Handle marker click
    const handleMarkerClick = useCallback((profile: Profile) => {
        setSelectedProfile(profile);
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

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={userLocation ? 13 : 12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={() => setSelectedProfile(null)}
            options={{
                mapId,
                scrollwheel: true,
                gestureHandling: 'greedy'
            }}
        >
            {/* User location marker */}
            {userLocation && (
                <Marker
                    position={userLocation}
                    icon={{
                        path: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z",
                        fillColor: "#22C55E",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                        scale: 1.2,
                        anchor: new google.maps.Point(12, 12),
                    }}
                    zIndex={1000} // Keep user marker on top
                    title="Your location"
                />
            )}
            
            {/* User location circle is handled via useEffect and circleRef */}

            {/* Profile markers */}
            {profiles.map(profile => (
                <Marker
                    key={profile.id}
                    position={{ lat: profile.latitude, lng: profile.longitude }}
                    onClick={() => handleMarkerClick(profile)}
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
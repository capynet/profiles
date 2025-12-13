'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface ProfileDetailMapProps {
    latitude: number;
    longitude: number;
    name: string;
    apiKey: string;
    mapId?: string;
}

// Map container style will be applied via className for responsive design
const getMapContainerStyle = (isMobile: boolean) => ({
    width: '100%',
    height: isMobile ? '100vw' : '450px', // Square on mobile, 450px on desktop
    maxHeight: isMobile ? 'calc(100vw - 2rem)' : '450px', // Account for padding on mobile
    borderRadius: '0.5rem',
});

// Define libraries as a static constant outside the component
const libraries: ("marker")[] = ["marker"];

export default function ProfileDetailMap({ latitude, longitude, name, apiKey, mapId }: ProfileDetailMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load the Google Maps script
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey,
        libraries
    });
    
    const center = {
        lat: latitude,
        lng: longitude
    };
    
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
            <div className="flex justify-center items-center aspect-square lg:h-[450px] lg:aspect-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <GoogleMap
            mapContainerStyle={getMapContainerStyle(isMobile)}
            center={center}
            zoom={15}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                mapId,
                scrollwheel: true,
                gestureHandling: 'greedy'
            }}
        >
            <Marker
                position={center}
                title={name}
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
        </GoogleMap>
    );
}
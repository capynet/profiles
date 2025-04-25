'use client';

import { useState, useCallback, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface ProfileDetailMapProps {
    latitude: number;
    longitude: number;
    name: string;
    apiKey: string;
    mapId?: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.5rem',
};

// Define libraries as a static constant outside the component
const libraries = ["marker"] as const;

export default function ProfileDetailMap({ latitude, longitude, name, apiKey, mapId }: ProfileDetailMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    
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
    
    // Generate Google Maps directions URL
    const getDirectionsUrl = () => {
        return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    };
    
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
        <div className="space-y-3">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
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
            
            <div className="flex justify-end">
                <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12 1.586l-4 4V4a1 1 0 00-2 0v4a1 1 0 001 1h4a1 1 0 000-2H9.414l4-4A1 1 0 0012 1.586z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h2a1 1 0 010 2H5v12h12v-2a1 1 0 012 0v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" clipRule="evenodd" />
                    </svg>
                    Cómo llegar
                </a>
            </div>
        </div>
    );
}
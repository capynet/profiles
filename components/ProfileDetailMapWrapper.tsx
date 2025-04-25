'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to prevent server-side rendering issues
const ProfileDetailMap = dynamic(() => import('@/components/ProfileDetailMap'), {
    ssr: false,
    loading: () => (
        <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    )
});

interface ProfileDetailMapWrapperProps {
    latitude: number;
    longitude: number;
    name: string;
    apiKey: string;
    mapId?: string;
}

export default function ProfileDetailMapWrapper(props: ProfileDetailMapWrapperProps) {
    return <ProfileDetailMap {...props} />;
}
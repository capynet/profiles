'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ImpersonationBannerProps {
    impersonatingUserId?: string;
    originalAdminId?: string;
    userName?: string | null;
}

export default function ImpersonationBanner({
    impersonatingUserId,
    originalAdminId,
    userName
}: ImpersonationBannerProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Don't show the banner if not impersonating
    if (!impersonatingUserId || !originalAdminId) {
        return null;
    }

    const handleStopImpersonation = async () => {
        try {
            setIsLoading(true);

            const response = await fetch('/api/admin/impersonate', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to stop impersonation');
            }

            // Redirect to admin panel
            window.location.href = '/admin';
        } catch (error) {
            console.error('Error stopping impersonation:', error);
            alert('Failed to stop impersonation');
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-yellow-500 text-black px-4 py-3 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                        <p className="font-bold">
                            Impersonating User
                        </p>
                        <p className="text-sm">
                            You are viewing as: <span className="font-semibold">{userName || 'Unknown User'}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleStopImpersonation}
                    disabled={isLoading}
                    className="px-4 py-2 bg-black text-yellow-500 rounded-md font-medium hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? 'Stopping...' : 'Stop Impersonating'}
                </button>
            </div>
        </div>
    );
}

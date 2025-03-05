// components/ImageDetailModal.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

interface ProfileImage {
    id: number;
    mediumUrl: string;
    mediumCdnUrl?: string | null;
    thumbnailUrl?: string | null;
    thumbnailCdnUrl?: string | null;
    highQualityUrl?: string | null;
    highQualityCdnUrl?: string | null;
    // other fields
}

interface ImageDetailModalProps {
    image: ProfileImage | null;
    onClose: () => void;
}

export default function ImageDetailModal({ image, onClose }: ImageDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Get high quality image URL with fallback to medium
    const imageUrl = image?.highQualityUrl || image?.highQualityCdnUrl || image?.mediumCdnUrl || image?.mediumUrl || '';

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Handle click outside to close
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!mounted || !image) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-lg">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}

                    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                        <Image
                            src={imageUrl}
                            alt="Full size image"
                            width={704}
                            height={1152}
                            className="max-h-[90vh] w-auto object-contain"
                            onLoadingComplete={() => setIsLoading(false)}
                            unoptimized={imageUrl.startsWith('https://storage.googleapis.com')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
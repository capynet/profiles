// Example 1: Responsive image component that loads the appropriate size
// components/ResponsiveProfileImage.tsx
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ProfileImage {
    id: number;
    url: string;
    cdnUrl?: string | null;
    thumbnailUrl?: string | null;
    thumbnailCdnUrl?: string | null;
    highQualityUrl?: string | null;
    highQualityCdnUrl?: string | null;
}

interface ResponsiveProfileImageProps {
    image: ProfileImage;
    alt: string;
    priority?: boolean;
    sizes?: string;
    className?: string;
    onClick?: () => void;
}

export function ResponsiveProfileImage({
                                           image,
                                           alt,
                                           priority = false,
                                           sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
                                           className = "object-cover",
                                           onClick
                                       }: ResponsiveProfileImageProps) {
    const [connection, setConnection] = useState<string>('4g');
    const [viewportWidth, setViewportWidth] = useState<number>(0);

    // Determine the best image URL based on connection and viewport
    const getOptimalImageUrl = () => {
        // For small thumbnails in a grid, always use thumbnail version
        if (viewportWidth < 640 || connection === 'slow-2g' || connection === '2g') {
            return image.thumbnailUrl || image.thumbnailCdnUrl || image.mediumUrl;
        }

        // For medium-sized devices or average connections, use medium version
        if (viewportWidth < 1024 || connection === '3g') {
            return image.mediumCdnUrl || image.mediumUrl;
        }

        // For large screens and good connections, use high quality
        return image.highQualityUrl || image.highQualityCdnUrl || image.mediumUrl;
    };

    useEffect(() => {
        // Update viewport width
        const updateWidth = () => {
            setViewportWidth(window.innerWidth);
        };

        // Try to get connection information if available
        if (navigator.connection) {
            // @ts-ignore - networkInformation is not in the standard TS definitions
            const connectionType = navigator.connection.effectiveType;
            if (connectionType) {
                setConnection(connectionType);
            }
        }

        // Set initial width
        updateWidth();

        // Add listener
        window.addEventListener('resize', updateWidth);

        // Clean up
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Use an unoptimized image for CDN URLs
    const shouldUnoptimize = !!(
        (viewportWidth < 640 && image.thumbnailCdnUrl) ||
        (viewportWidth >= 1024 && image.highQualityCdnUrl) ||
        image.cdnUrl
    );

    return (
        <Image
            src={getOptimalImageUrl() || ''}
            alt={alt}
            fill
            sizes={sizes}
            className={className}
            unoptimized={shouldUnoptimize}
            priority={priority}
            onClick={onClick}
        />
    );
}

// Example 2: Image gallery with lazy-loaded high-quality versions
// components/ProfileGallery.tsx
'use client';

import { useState } from 'react';
import { ResponsiveProfileImage } from './ResponsiveProfileImage';
import ImageDetailModal from './ImageDetailModal';

interface ProfileImage {
    id: number;
    url: string;
    cdnUrl?: string | null;
    thumbnailUrl?: string | null;
    thumbnailCdnUrl?: string | null;
    highQualityUrl?: string | null;
    highQualityCdnUrl?: string | null;
}

interface ProfileGalleryProps {
    images: ProfileImage[];
    profileName: string;
}

export function ProfileGallery({ images, profileName }: ProfileGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<ProfileImage | null>(null);

    if (!images || images.length === 0) {
        return (
            <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                <p>No images available 2</p>
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="aspect-[9/16] relative rounded-lg overflow-hidden shadow-md cursor-pointer transform transition-transform hover:scale-105"
                        onClick={() => setSelectedImage(image)}
                    >
                        <ResponsiveProfileImage
                            image={image}
                            alt={`${profileName} - Image ${index + 1}`}
                            priority={index === 0} // Only prioritize first image
                        />
                    </div>
                ))}
            </div>

            {selectedImage && (
                <ImageDetailModal
                    image={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
}
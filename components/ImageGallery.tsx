'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface ImageData {
    id: number;
    thumbnailUrl: string | null;
    highQualityUrl: string | null;
    mediumUrl: string;
}

interface ImageGalleryProps {
    images: ImageData[];
    profileName: string;
    clickable?: boolean;
}

export default function ImageGallery({ images, profileName, clickable = true }: ImageGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [loadedHighQualityImages, setLoadedHighQualityImages] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);

    // Handle opening gallery
    const openGallery = (index: number) => {
        if (!clickable) return;
        setSelectedIndex(index);
        setIsLoading(true);
    };

    // Handle closing gallery
    const closeGallery = useCallback(() => {
        setSelectedIndex(null);
    }, []);

    // Navigate to previous image
    const goToPrevious = useCallback((e?: React.MouseEvent | Event) => {
        e?.stopPropagation();
        if (selectedIndex !== null) {
            const newIndex = (selectedIndex - 1 + images.length) % images.length;
            setSelectedIndex(newIndex);
            setIsLoading(true);
        }
    }, [selectedIndex, images.length]);

    // Navigate to next image
    const goToNext = useCallback((e?: React.MouseEvent | Event) => {
        e?.stopPropagation();
        if (selectedIndex !== null) {
            const newIndex = (selectedIndex + 1) % images.length;
            setSelectedIndex(newIndex);
            setIsLoading(true);
        }
    }, [selectedIndex, images.length]);

    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    // Handle touch move
    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    // Handle touch end (detect swipe)
    const handleTouchEnd = () => {
        if (touchStartX.current - touchEndX.current > 75) {
            // Swiped left - go to next
            goToNext();
        }

        if (touchEndX.current - touchStartX.current > 75) {
            // Swiped right - go to previous
            goToPrevious();
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;

            if (e.key === 'Escape' || e.key === 'Esc') {
                closeGallery();
            } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
                goToPrevious(e);
            } else if (e.key === 'ArrowRight' || e.key === 'Right') {
                goToNext(e);
            } else if (e.key === 'Home') {
                // Go to first image
                setSelectedIndex(0);
                setIsLoading(true);
            } else if (e.key === 'End') {
                // Go to last image
                setSelectedIndex(images.length - 1);
                setIsLoading(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex, closeGallery, goToPrevious, goToNext, images.length]);

    // Preload high quality image and adjacent images
    useEffect(() => {
        if (selectedIndex === null) return;

        const currentImage = images[selectedIndex];
        const imageUrl = currentImage.highQualityUrl || currentImage.mediumUrl;

        // Load current image
        const img = new window.Image();
        img.onload = () => {
            setLoadedHighQualityImages(prev => new Set(prev).add(selectedIndex));
            setIsLoading(false);

            // Preload next images in background
            const nextIndex = (selectedIndex + 1) % images.length;
            const prevIndex = (selectedIndex - 1 + images.length) % images.length;

            // Preload next image
            if (images[nextIndex]) {
                const nextUrl = images[nextIndex].highQualityUrl || images[nextIndex].mediumUrl;
                const nextImg = new window.Image();
                nextImg.src = nextUrl;
                nextImg.onload = () => {
                    setLoadedHighQualityImages(prev => new Set(prev).add(nextIndex));
                };
            }

            // Preload previous image
            if (images[prevIndex]) {
                const prevUrl = images[prevIndex].highQualityUrl || images[prevIndex].mediumUrl;
                const prevImg = new window.Image();
                prevImg.src = prevUrl;
                prevImg.onload = () => {
                    setLoadedHighQualityImages(prev => new Set(prev).add(prevIndex));
                };
            }
        };
        img.src = imageUrl;
    }, [selectedIndex, images]);

    return (
        <>
            {/* Thumbnail Grid - 1 column on mobile, 2 columns on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-md transition-opacity ${
                            clickable ? 'cursor-pointer hover:opacity-90' : 'cursor-default'
                        }`}
                        onClick={() => openGallery(index)}
                    >
                        <Image
                            src={image.thumbnailUrl || image.mediumUrl}
                            alt={`${profileName} - Image ${index + 1}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 20vw"
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Gallery Modal */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
                    onClick={closeGallery}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Close button */}
                    <button
                        onClick={closeGallery}
                        className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image counter */}
                    <div className="absolute top-4 left-4 z-50 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                        {selectedIndex + 1} / {images.length}
                    </div>

                    {/* Previous button */}
                    {images.length > 1 && (
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Next button */}
                    {images.length > 1 && (
                        <button
                            onClick={goToNext}
                            className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                    )}

                    {/* Main image */}
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            <Image
                                src={images[selectedIndex].highQualityUrl || images[selectedIndex].mediumUrl}
                                alt={`${profileName} - Image ${selectedIndex + 1}`}
                                fill
                                className="object-contain"
                                priority
                                onLoad={() => setIsLoading(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

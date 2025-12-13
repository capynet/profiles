'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    // Handle opening gallery
    const openGallery = (index: number) => {
        if (!clickable) return;
        setSelectedIndex(index);
    };

    // Handle closing gallery
    const closeGallery = () => {
        setSelectedIndex(null);
    };

    // Handle ESC key to close modal
    useEffect(() => {
        if (selectedIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                closeGallery();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex]);

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
                            src={image.mediumUrl}
                            alt={`${profileName} - Image ${index + 1}`}
                            fill
                            sizes="(max-width: 1024px) 100vw, 20vw"
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Gallery Modal with Swiper */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
                    onClick={closeGallery}
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

                    {/* Swiper Container */}
                    <div className="w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <div className="max-w-[90vw] max-h-[90vh] w-full h-full">
                            <Swiper
                                modules={[Navigation, Pagination, Keyboard]}
                                initialSlide={selectedIndex}
                                spaceBetween={30}
                                slidesPerView={1}
                                navigation={{
                                    prevEl: '.swiper-button-prev-modal',
                                    nextEl: '.swiper-button-next-modal',
                                }}
                                pagination={{
                                    clickable: true,
                                    dynamicBullets: true,
                                }}
                                keyboard={{
                                    enabled: true,
                                }}
                                speed={400}
                                grabCursor={true}
                                onSwiper={setSwiper}
                                className="w-full h-full"
                            >
                                {images.map((image, index) => (
                                    <SwiperSlide key={image.id}>
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <Image
                                                src={image.highQualityUrl || image.mediumUrl}
                                                alt={`${profileName} - Image ${index + 1}`}
                                                fill
                                                className="object-contain"
                                                priority={index === selectedIndex}
                                            />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>

                            {/* Custom Navigation buttons */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        className="swiper-button-prev-modal absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                                        onClick={() => swiper?.slidePrev()}
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        className="swiper-button-next-modal absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition-all"
                                        onClick={() => swiper?.slideNext()}
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface ImageData {
    id: number;
    thumbnailUrl: string | null;
    highQualityUrl: string | null;
    mediumUrl: string;
}

interface ImageCarouselProps {
    images: ImageData[];
    profileName: string;
}

export default function ImageCarousel({ images, profileName }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    if (images.length === 0) {
        return (
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[3/4] flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No images available</p>
            </div>
        );
    }

    return (
        <div className="relative w-full">
            <Swiper
                modules={[Navigation, Pagination, EffectCoverflow]}
                spaceBetween={20}
                slidesPerView={1}
                navigation={{
                    prevEl: '.swiper-button-prev-custom',
                    nextEl: '.swiper-button-next-custom',
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                }}
                effect="coverflow"
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: false,
                }}
                speed={400}
                grabCursor={true}
                onSwiper={setSwiper}
                onSlideChange={(swiper) => setCurrentIndex(swiper.activeIndex)}
                className="rounded-lg shadow-lg"
            >
                {images.map((image, index) => (
                    <SwiperSlide key={image.id}>
                        <div className="relative aspect-[3/4] w-full">
                            <Image
                                src={image.mediumUrl}
                                alt={`${profileName} - Image ${index + 1}`}
                                fill
                                sizes="100vw"
                                className="object-cover rounded-lg"
                                priority={index === 0}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Custom Navigation buttons */}
            {images.length > 1 && (
                <>
                    <button
                        className="swiper-button-prev-custom absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        onClick={() => swiper?.slidePrev()}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        className="swiper-button-next-custom absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        onClick={() => swiper?.slideNext()}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 right-4 z-10 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
}

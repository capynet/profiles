'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import ImageDetailModal from '@/components/ImageDetailModal';

interface ProfileImage {
    id: number;
    mediumUrl: string;
    mediumCdnUrl?: string | null;
    mediumStorageKey: string;
    thumbnailUrl?: string | null;
    thumbnailCdnUrl?: string | null;
    thumbnailStorageKey?: string | null;
    highQualityUrl?: string | null;
    highQualityCdnUrl?: string | null;
    highQualityStorageKey?: string | null;
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

interface ProfilePageClientProps {
    profile?: Profile | null;
}

export default function ProfilePageClient({ profile }: ProfilePageClientProps) {
    const [modalImage, setModalImage] = useState<ProfileImage | null>(null);
    const [activeImage, setActiveImage] = useState<ProfileImage | null>(null);

    // Set the first image as active when profile loads or changes
    useEffect(() => {
        if (profile?.images && profile.images.length > 0) {
            setActiveImage(profile.images[0]);
        }
    }, [profile]);

    // If profile is undefined or null, show a message with a link to create one
    if (!profile) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="text-center py-8">
                    <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">No tienes un perfil creado</h1>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">Crea tu perfil para comenzar a ofrecer tus servicios.</p>
                    <Link href="/profile/create" className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
                        Crear Perfil
                    </Link>
                </div>
            </div>
        );
    }

    // Open the modal for fullscreen view
    const openModal = (image: ProfileImage) => {
        setModalImage(image);
    };

    // Close the modal
    const closeModal = () => {
        setModalImage(null);
    };

    // Handle thumbnail click to set active image
    const handleThumbnailClick = (image: ProfileImage) => {
        setActiveImage(image);
    };

    // Handle main image click to open modal
    const handleMainImageClick = () => {
        if (activeImage) {
            openModal(activeImage);
        }
    };

    // Get the appropriate URL for thumbnails - always use smallest version available
    const getThumbnailUrl = (image: ProfileImage) => {
        // Strict priority: thumbnail first, then medium as fallback
        return image.thumbnailUrl || image.thumbnailCdnUrl || image.mediumUrl || '';
    };

    // Get the best quality URL for the main image
    const getMainImageUrl = (image: ProfileImage) => {
        // For main image display, medium quality is sufficient and loads faster
        return image.mediumUrl || image.mediumCdnUrl || '';
    };

    // Get high quality image for modal view
    const getHighQualityUrl = (image: ProfileImage) => {
        // For fullscreen modal, use highest quality available
        return image.highQualityUrl || image.highQualityCdnUrl || image.mediumUrl || '';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile.age} años</p>
                    </div>
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        ${profile.price.toFixed(2)}
                    </div>
                </div>

                {/* Display image gallery with main image and thumbnails */}
                {profile.images && profile.images.length > 0 ? (
                    <div className="mb-6 space-y-4">
                        {/* Main active image display with navigation arrows */}
                        <div className="relative">
                            <div
                                className="relative aspect-[9/16] max-h-[70vh] w-full bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer"
                                onClick={handleMainImageClick}
                            >
                                {activeImage && (
                                    <Image
                                        src={getMainImageUrl(activeImage)}
                                        alt={`${profile.name} - main image`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-contain"
                                        priority
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                    <span className="text-white text-sm px-2 py-1 bg-black/50 rounded-md">Click to enlarge</span>
                                </div>
                            </div>

                            {/* Navigation arrows for main image */}
                            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                                <button
                                    className="ml-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors pointer-events-auto focus:outline-none focus:ring-2 focus:ring-white"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening modal
                                        const currentIndex = profile.images.findIndex(img => img.id === activeImage?.id);
                                        if (currentIndex > 0) {
                                            setActiveImage(profile.images[currentIndex - 1]);
                                        } else {
                                            setActiveImage(profile.images[profile.images.length - 1]);
                                        }
                                    }}
                                    aria-label="Previous image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    className="mr-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors pointer-events-auto focus:outline-none focus:ring-2 focus:ring-white"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening modal
                                        const currentIndex = profile.images.findIndex(img => img.id === activeImage?.id);
                                        if (currentIndex < profile.images.length - 1) {
                                            setActiveImage(profile.images[currentIndex + 1]);
                                        } else {
                                            setActiveImage(profile.images[0]);
                                        }
                                    }}
                                    aria-label="Next image"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Thumbnails slider with navigation arrows */}
                        <div className="flex items-center gap-2">
                            <button
                                className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={() => {
                                    const currentIndex = profile.images.findIndex(img => img.id === activeImage?.id);
                                    if (currentIndex > 0) {
                                        setActiveImage(profile.images[currentIndex - 1]);
                                    } else {
                                        setActiveImage(profile.images[profile.images.length - 1]);
                                    }
                                }}
                                aria-label="Previous image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="flex-1 overflow-x-auto py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <div className="flex gap-3">
                                    {profile.images.map((image) => (
                                        <div
                                            key={image.id}
                                            className={`flex-shrink-0 w-[150px] aspect-[9/16] relative rounded-md overflow-hidden cursor-pointer transition-all 
                                            ${activeImage?.id === image.id
                                                ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 scale-95'
                                                : 'hover:scale-95'}`}
                                            onClick={() => handleThumbnailClick(image)}
                                        >
                                            <Image
                                                src={getThumbnailUrl(image)}
                                                alt={`${profile.name} thumbnail`}
                                                fill
                                                sizes="150px"
                                                className="object-cover"
                                                quality={60}
                                                unoptimized={!!image.thumbnailCdnUrl}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onClick={() => {
                                    const currentIndex = profile.images.findIndex(img => img.id === activeImage?.id);
                                    if (currentIndex < profile.images.length - 1) {
                                        setActiveImage(profile.images[currentIndex + 1]);
                                    } else {
                                        setActiveImage(profile.images[0]);
                                    }
                                }}
                                aria-label="Next image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                        <p>No images available</p>
                    </div>
                )}

                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Descripción</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{profile.description}</p>
                </div>

                {/* Rest of your profile information */}
                <div className="mt-4">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Ubicación</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{profile.address}</p>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Lat: {profile.latitude}, Long: {profile.longitude}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Payment methods</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile.paymentMethods.map(({paymentMethod}) => (
                                <span
                                    key={paymentMethod.id}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 rounded text-sm"
                                >
                                    {paymentMethod.name}
                                </span>
                            ))}
                            {profile.paymentMethods.length === 0 && (
                                <span className="text-gray-500 dark:text-gray-400">No hay Payment methods registrados</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Languages</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile.languages.map(({language}) => (
                                <span
                                    key={language.id}
                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 rounded text-sm"
                                >
                                    {language.name}
                                </span>
                            ))}
                            {profile.languages.length === 0 && (
                                <span className="text-gray-500 dark:text-gray-400">No hay Languages registrados</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Link
                        href="/profile/edit"
                        className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                    >
                        Editar Perfil
                    </Link>
                </div>
            </div>

            {/* Image detail modal */}
            {modalImage && (
                <ImageDetailModal
                    image={modalImage}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
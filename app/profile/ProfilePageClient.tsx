'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
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
    const [selectedImage, setSelectedImage] = useState<ProfileImage | null>(null);

    // If profile is undefined or null, show a message with a link to create one
    if (!profile) {
        return (
            <div className="container mx-auto py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">No tienes un perfil creado</h1>
                    <p className="mb-6">Crea tu perfil para comenzar a ofrecer tus servicios.</p>
                    <Link href="/profile/create" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                        Crear Perfil
                    </Link>
                </div>
            </div>
        );
    }

    const handleImageClick = (image: ProfileImage) => {
        setSelectedImage(image);
    };

    const closeModal = () => {
        setSelectedImage(null);
    };

    const getImageUrl = (image: ProfileImage) => {
        // For gallery thumbnails, prefer thumbnail version if available
        return image.thumbnailUrl || image.thumbnailCdnUrl || image.mediumUrl || '';
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                        <p className="text-sm text-gray-500">{profile.age} años</p>
                    </div>
                    <div className="text-xl font-bold text-green-600">
                        ${profile.price.toFixed(2)}
                    </div>
                </div>

                {/* Display image gallery with responsive image loading */}
                {profile.images && profile.images.length > 0 ? (
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-3">Gallery</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {profile.images.map(image => (
                                <div
                                    key={image.id}
                                    className="aspect-[9/16] relative rounded-lg overflow-hidden shadow-md cursor-pointer transform transition-transform hover:scale-105"
                                    onClick={() => handleImageClick(image)}
                                >
                                    <Image
                                        src={getImageUrl(image)}
                                        alt={`${profile.name}`}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        className="object-cover"
                                        unoptimized={!!image.thumbnailCdnUrl}
                                        priority={image.id === profile.images[0]?.id} // Only prioritize first image
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                        <p>No images available</p>
                    </div>
                )}

                <div className="mt-4">
                    <h2 className="text-lg font-semibold">Descripción</h2>
                    <p className="mt-2 text-gray-600">{profile.description}</p>
                </div>

                {/* Rest of your profile information */}
                <div className="mt-4">
                    <h2 className="text-lg font-semibold">Ubicación</h2>
                    <p className="mt-2 text-gray-600">{profile.address}</p>
                    <div className="mt-1 text-sm text-gray-500">
                        Lat: {profile.latitude}, Long: {profile.longitude}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">Métodos de Pago</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile.paymentMethods.map(({paymentMethod}) => (
                                <span
                                    key={paymentMethod.id}
                                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                                >
                                    {paymentMethod.name}
                                </span>
                            ))}
                            {profile.paymentMethods.length === 0 && (
                                <span className="text-gray-500">No hay métodos de pago registrados</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Idiomas</h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {profile.languages.map(({language}) => (
                                <span
                                    key={language.id}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm"
                                >
                                    {language.name}
                                </span>
                            ))}
                            {profile.languages.length === 0 && (
                                <span className="text-gray-500">No hay idiomas registrados</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <Link
                        href="/profile/edit"
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        Editar Perfil
                    </Link>
                </div>
            </div>

            {/* Image detail modal */}
            {selectedImage && (
                <ImageDetailModal
                    image={selectedImage}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
// app/profile/[id]/page.tsx
import {notFound} from "next/navigation";
import {auth} from "@/auth";
import {prisma} from "@/prisma";
import Link from "next/link";
import ProfileDetailMapWrapper from "@/components/ProfileDetailMapWrapper";
import ImageGallery from "@/components/ImageGallery";
import ImageCarousel from "@/components/ImageCarousel";
import { FaWhatsapp, FaTelegram, FaPhone } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';

interface ProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

// Enable ISR with 60 seconds revalidation
export const revalidate = 60;

// Allow dynamic params for profiles not pre-generated
export const dynamicParams = true;

// Generate metadata for SEO
export async function generateMetadata({ params }: ProfilePageProps) {
    const { id } = await params;
    const profileId = parseInt(id);
    
    if (isNaN(profileId)) {
        return {
            title: 'Profile Not Found',
        };
    }

    try {
        const profile = await prisma.profile.findUnique({
            where: { id: profileId, published: true, isDraft: false },
            select: {
                name: true,
                description: true,
                address: true,
                images: {
                    select: { mediumUrl: true },
                    take: 1
                }
            }
        });

        if (!profile) {
            return {
                title: 'Profile Not Found',
            };
        }

        const imageUrl = profile.images[0]?.mediumUrl;
        
        return {
            title: `${profile.name} - Profile`,
            description: profile.description.substring(0, 160),
            openGraph: {
                title: `${profile.name} - Profile`,
                description: profile.description.substring(0, 160),
                images: imageUrl ? [{ url: imageUrl }] : [],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${profile.name} - Profile`,
                description: profile.description.substring(0, 160),
                images: imageUrl ? [imageUrl] : [],
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Profile',
        };
    }
}

// Generate static params for popular profiles
export async function generateStaticParams() {
    try {
        // Get all published profiles for static generation
        const profiles = await prisma.profile.findMany({
            where: {
                published: true,
                isDraft: false
            },
            select: {
                id: true
            },
            take: 100 // Generate first 100 profiles statically
        });

        return profiles.map((profile) => ({
            id: profile.id.toString(),
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

export default async function ProfileDetailPage(props: ProfilePageProps) {
    const params = await props.params;
    const session = await auth();

    // Get Google Maps API key from environment variables
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    const googleMapsId = process.env.GOOGLE_MAPS_ID;

    // Get profile by ID
    const profileId = parseInt(params.id);

    if (isNaN(profileId)) {
        notFound();
    }

    const profile = await prisma.profile.findUnique({
        where: {id: profileId},
        include: {
            languages: {
                where: {
                    language: {enabled: true}
                },
                include: {language: true}
            },
            paymentMethods: {include: {paymentMethod: true}},
            nationalities: {include: {nationality: true}},
            ethnicities: {include: {ethnicity: true}},
            services: {include: {service: true}},
            images: true,
            user: {select: {name: true, email: true}},
        },
    });

    if (!profile) {
        notFound();
    }

    // Check if this profile belongs to the current user or if user is admin
    const isOwner = session?.user?.id === profile.userId;
    const isAdmin = session?.user?.role === 'admin';

    // Check if there's a pending draft for this profile (only relevant for owners)
    let hasPendingDraft = false;
    if (isOwner) {
        const pendingDraft = await prisma.profile.findFirst({
            where: {
                originalProfileId: profileId,
                isDraft: true
            }
        });
        hasPendingDraft = !!pendingDraft;
    }

    // If profile is not published and user is not owner or admin, return 404
    if (!profile.published && !isOwner && !isAdmin) {
        notFound();
    }

    // Prepare images data for gallery
    const galleryImages = profile.images.map(img => ({
        id: img.id,
        thumbnailUrl: img.thumbnailUrl,
        highQualityUrl: img.highQualityUrl,
        mediumUrl: img.mediumUrl
    }));

    return (
        <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
            {/* Show warning banner if profile is not published */}
            {!profile.published && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">This profile is not published yet</p>
                            <p className="text-xs mt-1">This profile is only visible to you and administrators. It will be available to the public once an administrator approves and publishes it.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Show pending changes banner if owner has pending draft */}
            {hasPendingDraft && (
                <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Profile Updates Pending</p>
                            <p className="text-xs mt-1">Your currently published profile is pending to be updated with the latest changes you did on it. Soon an administrator will approve the latest changes you made on it. Meanwhile your public profile will show the original info.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {isOwner && (
                <div className="flex justify-end mb-4">
                    <Link
                        href="/profile/edit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Editar
                    </Link>
                </div>
            )}

            {/* Mobile Carousel - Only visible on mobile */}
            <div className="lg:hidden mb-6">
                {profile.images.length > 0 ? (
                    <ImageCarousel images={galleryImages} profileName={profile.name} />
                ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[3/4] flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No images available</p>
                    </div>
                )}
            </div>

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column - Images (40%) - Only visible on desktop */}
                <div className="hidden lg:block w-full lg:w-2/5">
                    {profile.images.length > 0 ? (
                        <ImageGallery images={galleryImages} profileName={profile.name} clickable={true} />
                    ) : (
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-[3/4] flex items-center justify-center">
                            <p className="text-gray-500 dark:text-gray-400">No images available</p>
                        </div>
                    )}
                </div>

                {/* Right Column - Profile Information (60%) */}
                <div className="w-full lg:w-3/5">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        {/* Name, Age, Price */}
                        <div className="mb-6">
                            <div className="flex items-start justify-between mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                                <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-full">
                                    <span className="text-xl font-bold">{profile.price}€</span>
                                </div>
                            </div>
                            <p className="text-lg text-gray-600 dark:text-gray-400">{profile.age} años</p>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Descripción</h2>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-lg">{profile.description}</p>
                        </div>

                        {/* Languages */}
                        {profile.languages.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Languages</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.languages.map(({language}) => (
                                        <span
                                            key={language.id}
                                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                                        >
                                            {language.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Methods */}
                        {profile.paymentMethods.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Payment methods</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.paymentMethods.map(({paymentMethod}) => (
                                        <span
                                            key={paymentMethod.id}
                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                                        >
                                            {paymentMethod.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nationality */}
                        {profile.nationalities && profile.nationalities.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Nationality</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.nationalities.map(({nationality}) => (
                                        <span
                                            key={nationality.id}
                                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                                        >
                                            {nationality.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ethnicity */}
                        {profile.ethnicities && profile.ethnicities.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Ethnicity</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.ethnicities.map(({ethnicity}) => (
                                        <span
                                            key={ethnicity.id}
                                            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
                                        >
                                            {ethnicity.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Services */}
                        {profile.services && profile.services.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Services</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.services.map(({service}) => (
                                        <span
                                            key={service.id}
                                            className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full text-sm"
                                        >
                                            {service.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contacto</h2>
                            <div className="space-y-3 text-gray-700 dark:text-gray-300">

                                {profile.phone && (
                                    <div className="flex items-center flex-wrap gap-4">
                                        <div className="flex items-center">
                                            <FaPhone className="h-5 w-5 mr-2 text-indigo-600" />
                                            <a
                                                href={`tel:${profile.phone}`}
                                                className="text-lg font-bold hover:underline"
                                            >
                                                {profile.phone}
                                            </a>
                                        </div>

                                        {profile.hasWhatsapp && (
                                            <a
                                                href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                                            >
                                                <FaWhatsapp className="h-8 w-8 mr-2" />
                                                WhatsApp
                                            </a>
                                        )}

                                        {profile.hasTelegram && (
                                            <a
                                                href={`tg://${profile.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                                            >
                                                <FaTelegram className="h-8 w-8 mr-2" />
                                                Telegram
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ubicación</h2>

                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <p className="text-gray-700 dark:text-gray-300">{profile.address}</p>

                                {profile.latitude && profile.longitude && (
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}&travelmode=driving`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap ml-4"
                                    >
                                        <MdDirections className="h-5 w-5 mr-2" />
                                        Cómo llegar
                                    </a>
                                )}
                            </div>


                            {/* Map display */}
                            {profile.latitude && profile.longitude && (
                                <div className="mt-4">
                                    <ProfileDetailMapWrapper
                                        latitude={profile.latitude}
                                        longitude={profile.longitude}
                                        name={profile.name}
                                        apiKey={googleMapsApiKey}
                                        mapId={googleMapsId}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Thumbnails - Only visible on mobile, not clickable */}
            <div className="lg:hidden mt-6">
                {profile.images.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Galería</h2>
                        <ImageGallery images={galleryImages} profileName={profile.name} clickable={false} />
                    </div>
                )}
            </div>

            {/* Fixed Bottom Bar - Only visible on mobile */}
            {profile.phone && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
                    <div className="flex">
                        {/* Phone number */}
                        <a
                            href={`tel:${profile.phone}`}
                            className="flex items-center justify-center px-4 py-3 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 transition-colors whitespace-nowrap"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            <span className="font-bold text-l">{profile.phone}</span>
                        </a>

                        {/* WhatsApp */}
                        {profile.hasWhatsapp && (
                            <a
                                href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-2 py-3 bg-green-500 text-white hover:bg-green-600 transition-colors flex-1"
                            >
                                <FaWhatsapp className="h-6 w-6 mr-2" />
                                <span className="font-medium text-sm">WhatsApp</span>
                            </a>
                        )}

                        {/* Telegram */}
                        {profile.hasTelegram && (
                            <a
                                href={`tg://${profile.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                            >
                                <FaTelegram className="h-6 w-6" />
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
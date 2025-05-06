// app/profile/[id]/page.tsx
import {notFound} from "next/navigation";
import {auth} from "@/auth";
import {prisma} from "@/prisma";
import Link from "next/link";
import Image from "next/image";
import ProfileDetailMapWrapper from "@/components/ProfileDetailMapWrapper";

interface ProfilePageProps {
    params: Promise<{
        id: string;
    }>;
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
            languages: {include: {language: true}},
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

    return (
        <div className="container mx-auto px-4 py-8">
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="relative">
                    <div className="h-60 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

                    <div className="absolute bottom-0 left-0 w-full transform translate-y-1/2 px-8 flex justify-between items-end">
                        <div className="flex items-end">
                            {/* Profile Image */}
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                                <Image
                                    src={profile.images[0]?.mediumUrl || "/api/placeholder/128/128"}
                                    alt={profile.name}
                                    width={128}
                                    height={128}
                                    className="object-cover w-full h-full"
                                    priority
                                />
                            </div>

                            {/* Profile Name and Basic Info */}
                            <div className="ml-6 mb-4">
                                <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                                <p className="text-indigo-100">{profile.age} años</p>
                            </div>
                        </div>

                        {/* Price Badge */}
                        <div className="mb-4">
                            <div className="px-6 py-2 bg-white dark:bg-gray-900 rounded-full shadow-md">
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{profile.price}€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="mt-20 px-8 py-6">
                    {/* Actions */}
                    <div className="flex justify-end mb-6 space-x-4">

                        {isOwner && (
                            <Link
                                href="/profile/edit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Editar
                            </Link>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Descripción</h2>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{profile.description}</p>
                    </div>

                    {/* Location */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ubicación</h2>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">{profile.address}</p>
                        
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
                        
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                            Coordenadas: {profile.latitude}, {profile.longitude}
                        </div>
                    </div>

                    {/* Gallery */}
                    {profile.images.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Galería</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {profile.images.map(image => (
                                    <div key={image.id} className="aspect-[9/16] relative rounded-lg overflow-hidden shadow-md">
                                        <Image
                                            src={image.mediumUrl}
                                            alt={profile.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Languages and Payment Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Languages */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Languages</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.languages.map(({language}) => (
                                    <span
                                        key={language.id}
                                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                                    >
                                        {language.name}
                                    </span>
                                ))}
                                {profile.languages.length === 0 && (
                                    <span className="text-gray-500 dark:text-gray-400">No languages available</span>
                                )}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Payment methods</h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.paymentMethods.map(({paymentMethod}) => (
                                    <span
                                        key={paymentMethod.id}
                                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                                    >
                                        {paymentMethod.name}
                                    </span>
                                ))}
                                {profile.paymentMethods.length === 0 && (
                                    <span className="text-gray-500 dark:text-gray-400">No hay Payment methods registrados</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Nationality */}
                        {profile.nationalities && profile.nationalities.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nationality</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.nationalities.map(({nationality}) => (
                                        <span
                                            key={nationality.id}
                                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
                                        >
                                            {nationality.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Ethnicity */}
                        {profile.ethnicities && profile.ethnicities.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ethnicity</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.ethnicities.map(({ethnicity}) => (
                                        <span
                                            key={ethnicity.id}
                                            className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full"
                                        >
                                            {ethnicity.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Services */}
                        {profile.services && profile.services.length > 0 && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Services</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.services.map(({service}) => (
                                        <span
                                            key={service.id}
                                            className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded-full"
                                        >
                                            {service.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Contacto</h2>
                        <div className="space-y-3 text-gray-700 dark:text-gray-300">
                            <div>
                                Contactar por email: {profile.user.email}
                            </div>
                            
                            {profile.phone && (
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                        </svg>
                                        <a 
                                            href={`tel:${profile.phone}`} 
                                            className="text-indigo-600 hover:text-indigo-800 hover:underline"
                                        >
                                            {profile.phone}
                                        </a>
                                    </div>
                                    
                                    <div className="flex space-x-4 ml-7">
                                        {profile.hasWhatsapp && (
                                            <a 
                                                href={`https://wa.me/${profile.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                            >
                                                <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.088.535 4.05 1.475 5.762L.106 23.486c-.038.178.032.363.169.451.53.035.117.053.202.053.108 0 .215-.037.301-.106l5.913-3.255c1.615.834 3.437 1.307 5.374 1.37h.006c6.627 0 12-5.373 12-12S18.627 0 12 0zM12 22.02h-.006c-1.834-.04-3.59-.531-5.137-1.423l-.368-.221-3.826 2.104 2.141-3.826-.235-.38C3.505 16.698 2.98 14.881 2.98 12c0-4.962 4.038-9 9-9 4.963 0 9 4.038 9 9 0 4.963-4.037 9-9 9z" fillRule="evenodd" clipRule="evenodd"/>
                                                </svg>
                                                WhatsApp
                                            </a>
                                        )}
                                        
                                        {profile.hasTelegram && (
                                            <a 
                                                href={`tg://${profile.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                            >
                                                <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248c-.235 2.46-1.258 8.42-1.776 11.173-.217 1.168-.5 1.557-.818 1.593-.698.082-1.23-.455-1.9-.892-1.056-.68-1.655-1.105-2.68-1.772-1.188-.775-.419-1.202.258-1.898.177-.182 3.247-2.977 3.307-3.23.007-.03.014-.105-.04-.15-.058-.044-.117-.027-.167-.015-.071.017-1.204.784-3.396 2.3-1.02.705-1.763 1.05-2.23 1.037-.487-.015-1.423-.283-2.12-.514-.85-.284-1.527-.497-1.47-.984.03-.255.256-.502.677-.745 2.82-1.632 4.996-2.7 6.526-3.204 3.118-1.02 3.763-.84 4.188-.606.19.107.406.36.422.704.016.345.015.638-.004.895z"/>
                                                </svg>
                                                Telegram
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
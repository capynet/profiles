// app/profile/[id]/page.tsx
import {notFound} from "next/navigation";
import {auth} from "@/auth";
import {prisma} from "@/prisma";
import Link from "next/link";
import Image from "next/image";

interface ProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ProfileDetailPage(props: ProfilePageProps) {
    const params = await props.params;
    const session = await auth();

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
                        <p className="text-gray-700 dark:text-gray-300">{profile.address}</p>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                    </div>

                    {/* Contact Info */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Contacto</h2>
                        <p className="text-gray-700 dark:text-gray-300">
                            Para contactar con este profesional, debes iniciar sesión.
                        </p>
                        {session && (
                            <div className="mt-2 text-gray-700 dark:text-gray-300">
                                Contactar por email: {profile.user.email}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
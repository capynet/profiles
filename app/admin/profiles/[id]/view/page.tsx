// app/admin/profiles/[id]/view/page.tsx
import {notFound} from 'next/navigation';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import Link from 'next/link';
import Image from 'next/image';
import AdminProfileActionButtons from '@/components/AdminProfileActionButtons';

export const metadata = {
    title: 'Admin - View Profile',
    description: 'View profile details in admin mode',
};

interface AdminProfileViewPageProps {
    params: {
        id: string;
    };
}

export default async function AdminProfileViewPage({ params }: AdminProfileViewPageProps) {
    // Ensure user is an admin
    await requireAdmin();

    const profileId = parseInt(params.id);
    if (isNaN(profileId)) {
        notFound();
    }

    // Get profile with all needed related data
    const profile = await prisma.profile.findUnique({
        where: {id: profileId},
        include: {
            languages: {
                include: {
                    language: true
                }
            },
            paymentMethods: {
                include: {
                    paymentMethod: true
                }
            },
            images: {
                orderBy: {
                    position: 'asc'
                }
            },
            user: {
                select: {name: true, email: true, id: true}
            },
            originalProfile: true
        },
    });

    if (!profile) {
        notFound();
    }

    // If this is a draft with an original profile, fetch the original profile details
    let originalProfile = null;
    if (profile.isDraft && profile.originalProfileId) {
        originalProfile = await prisma.profile.findUnique({
            where: { id: profile.originalProfileId },
            include: {
                languages: {
                    include: {
                        language: true
                    }
                },
                paymentMethods: {
                    include: {
                        paymentMethod: true
                    }
                },
                images: {
                    orderBy: {
                        position: 'asc'
                    }
                }
            }
        });
    }

    // Determine status for UI display
    const isDraft = profile.isDraft;
    const hasOriginal = Boolean(profile.originalProfileId);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {isDraft ? "Review Draft Profile" : "View Profile"}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        User: {profile.user.name || profile.user.email}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/admin"
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                        Back to admin
                    </Link>

                    {/* Client component for interactive buttons */}
                    <AdminProfileActionButtons
                        profileId={profile.id}
                        isDraft={isDraft}
                        hasOriginal={hasOriginal}
                    />
                </div>
            </div>

            {/* Draft status indicator */}
            {isDraft && (
                <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">This is a draft profile</p>
                            {hasOriginal && (
                                <p className="text-xs mt-1">
                                    This is a newer version of an existing published profile. Review the changes before approving.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Draft profile */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {isDraft && hasOriginal ? "Draft Version" : "Profile Information"}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                <p className="mt-1 text-lg text-gray-900 dark:text-white">{profile.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                    <p className="mt-1 text-lg text-gray-900 dark:text-white">{profile.age} years</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                    <p className="mt-1 text-lg text-gray-900 dark:text-white">{profile.price}€</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                <div className="mt-1 prose dark:prose-invert max-w-none">
                                    <p className="text-gray-900 dark:text-white whitespace-pre-line">{profile.description}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                <p className="mt-1 text-gray-900 dark:text-white">{profile.address}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Coordinates: {profile.latitude}, {profile.longitude}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {profile.languages.map(({language}) => (
                                        <span key={language.id} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-sm">
                                            {language.name}
                                        </span>
                                    ))}
                                    {profile.languages.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {profile.paymentMethods.map(({paymentMethod}) => (
                                        <span key={paymentMethod.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                                            {paymentMethod.name}
                                        </span>
                                    ))}
                                    {profile.paymentMethods.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images</h3>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {profile.images.map((image, index) => (
                                        <div
                                            key={image.id}
                                            className={`relative aspect-[9/16] rounded-md overflow-hidden ${index === 0 ? 'ring-2 ring-indigo-500' : ''}`}
                                        >
                                            <Image
                                                src={image.mediumUrl}
                                                alt={`Image ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 40vw, 200px"
                                                className="object-cover"
                                            />
                                            {index === 0 && (
                                                <div className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {profile.images.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Original profile for comparison when viewing a draft */}
                {isDraft && hasOriginal && originalProfile && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Original Published Version</h2>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                    <p className="mt-1 text-lg text-gray-900 dark:text-white">{originalProfile.name}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                        <p className="mt-1 text-lg text-gray-900 dark:text-white">{originalProfile.age} years</p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                        <p className="mt-1 text-lg text-gray-900 dark:text-white">{originalProfile.price}€</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                    <div className="mt-1 prose dark:prose-invert max-w-none">
                                        <p className="text-gray-900 dark:text-white whitespace-pre-line">{originalProfile.description}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                    <p className="mt-1 text-gray-900 dark:text-white">{originalProfile.address}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Coordinates: {originalProfile.latitude}, {originalProfile.longitude}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {originalProfile.languages.map(({language}) => (
                                            <span key={language.id} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-sm">
                                                {language.name}
                                            </span>
                                        ))}
                                        {originalProfile.languages.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {originalProfile.paymentMethods.map(({paymentMethod}) => (
                                            <span key={paymentMethod.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                                                {paymentMethod.name}
                                            </span>
                                        ))}
                                        {originalProfile.paymentMethods.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images</h3>
                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {originalProfile.images.map((image, index) => (
                                            <div
                                                key={image.id}
                                                className={`relative aspect-[9/16] rounded-md overflow-hidden ${index === 0 ? 'ring-2 ring-indigo-500' : ''}`}
                                            >
                                                <Image
                                                    src={image.mediumUrl}
                                                    alt={`Image ${index + 1}`}
                                                    fill
                                                    sizes="(max-width: 768px) 40vw, 200px"
                                                    className="object-cover"
                                                />
                                                {index === 0 && (
                                                    <div className="absolute top-1 left-1 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                                        Main
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {originalProfile.images.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// app/admin/profiles/[id]/draft-compare/page.tsx
import {notFound, redirect} from 'next/navigation';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import Link from 'next/link';
import Image from 'next/image';
import AdminProfileActionButtons from '@/components/AdminProfileActionButtons';
import TextDiff from '@/components/TextDiff';

export const metadata = {
    title: 'Compare Draft',
    description: 'Compare draft with published version',
};

// Disable caching for admin pages
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface DraftComparePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DraftComparePage(props: DraftComparePageProps) {
    const params = await props.params;
    // Ensure user is an admin
    await requireAdmin();

    const draftId = parseInt(params.id);
    if (isNaN(draftId)) {
        notFound();
    }

    // Get the draft profile
    const draft = await prisma.profile.findUnique({
        where: {id: draftId},
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

    if (!draft || !draft.isDraft) {
        notFound();
    }

    // If this draft has an original profile, fetch it
    let originalProfile = null;
    if (draft.originalProfileId) {
        originalProfile = await prisma.profile.findUnique({
            where: { id: draft.originalProfileId },
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

    const hasOriginal = Boolean(originalProfile);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Compare Draft
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        User: {draft.user.name || draft.user.email}
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
                        profileId={draft.id}
                        isDraft={true}
                        hasOriginal={hasOriginal}
                    />
                </div>
            </div>

            {/* Draft status indicator */}
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

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Original profile (Old - Removed) */}
                {hasOriginal && originalProfile && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-red-500">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Original Published Version</h2>
                                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-md">
                                    Current Live - Old
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                    <p className={`mt-1 text-lg ${originalProfile.name !== draft.name ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {originalProfile.name !== draft.name && <span className="text-xs mr-1">−</span>}
                                        {originalProfile.name}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                        <p className={`mt-1 text-lg ${originalProfile.age !== draft.age ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                            {originalProfile.age !== draft.age && <span className="text-xs mr-1">−</span>}
                                            {originalProfile.age} years
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                        <p className={`mt-1 text-lg ${originalProfile.price !== draft.price ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                            {originalProfile.price !== draft.price && <span className="text-xs mr-1">−</span>}
                                            {originalProfile.price}€
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                    <div className={`mt-1 ${originalProfile.description !== draft.description ? 'bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded' : ''}`}>
                                        <p className={`${originalProfile.description !== draft.description ? 'text-red-700 dark:text-red-300' : 'text-gray-900 dark:text-white'} whitespace-pre-line`}>
                                            {originalProfile.description}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                    <p className={`mt-1 ${originalProfile.address !== draft.address ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {originalProfile.address !== draft.address && <span className="text-xs mr-1">−</span>}
                                        {originalProfile.address}
                                    </p>
                                    <p className={`text-sm mt-1 ${originalProfile.latitude !== draft.latitude || originalProfile.longitude !== draft.longitude ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {(originalProfile.latitude !== draft.latitude || originalProfile.longitude !== draft.longitude) && <span className="text-xs mr-1">−</span>}
                                        Coordinates: {originalProfile.latitude}, {originalProfile.longitude}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {originalProfile.languages.map(({language}) => {
                                            const isRemoved = !draft.languages.some(l => l.languageId === language.id);
                                            return (
                                                <span key={language.id} className={`px-2 py-1 rounded-md text-sm ${isRemoved ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}`}>
                                                    {language.name}
                                                </span>
                                            );
                                        })}
                                        {originalProfile.languages.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {originalProfile.paymentMethods.map(({paymentMethod}) => {
                                            const isRemoved = !draft.paymentMethods.some(pm => pm.paymentMethodId === paymentMethod.id);
                                            return (
                                                <span key={paymentMethod.id} className={`px-2 py-1 rounded-md text-sm ${isRemoved ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                                                    {paymentMethod.name}
                                                </span>
                                            );
                                        })}
                                        {originalProfile.paymentMethods.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images ({originalProfile.images.length})</h3>
                                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {originalProfile.images.map((image, index) => {
                                            const isRemoved = !draft.images.some(img => img.mediumStorageKey === image.mediumStorageKey);
                                            return (
                                                <div
                                                    key={image.id}
                                                    className={`relative aspect-[9/16] rounded-md overflow-hidden ${
                                                        isRemoved
                                                            ? 'ring-4 ring-red-500 dark:ring-red-400'
                                                            : index === 0
                                                                ? 'ring-2 ring-gray-300 dark:ring-gray-600'
                                                                : 'ring-1 ring-gray-200 dark:ring-gray-700'
                                                    }`}
                                                >
                                                    <Image
                                                        src={image.mediumUrl}
                                                        alt={`Image ${index + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 40vw, 200px"
                                                        className={`object-cover ${isRemoved ? 'opacity-60' : ''}`}
                                                    />
                                                    {isRemoved && (
                                                        <div className="absolute inset-0 bg-red-500 bg-opacity-40 flex items-center justify-center backdrop-blur-[1px]">
                                                            <div className="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold shadow-lg">
                                                                −
                                                            </div>
                                                        </div>
                                                    )}
                                                    {index === 0 && !isRemoved && (
                                                        <div className="absolute top-1 left-1 bg-gray-800 bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                                            Main
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {originalProfile.images.length === 0 && (
                                            <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Draft profile (New - Added) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {hasOriginal ? "New Draft Version" : "New Profile Draft"}
                            </h2>
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-md">
                                Draft Changes - New
                            </span>
                        </div>

                        <div className="space-y-4">
                            {hasOriginal && originalProfile ? (
                                <>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                        <p className={`mt-1 text-lg ${originalProfile.name !== draft.name ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                            {originalProfile.name !== draft.name && <span className="text-xs mr-1">+</span>}
                                            {draft.name}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                            <p className={`mt-1 text-lg ${originalProfile.age !== draft.age ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                                {originalProfile.age !== draft.age && <span className="text-xs mr-1">+</span>}
                                                {draft.age} years
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                            <p className={`mt-1 text-lg ${originalProfile.price !== draft.price ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                                {originalProfile.price !== draft.price && <span className="text-xs mr-1">+</span>}
                                                {draft.price}€
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                        <div className={`mt-1 ${originalProfile.description !== draft.description ? 'bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded' : ''}`}>
                                            <p className={`${originalProfile.description !== draft.description ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-white'} whitespace-pre-line`}>
                                                {draft.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                        <p className={`mt-1 ${originalProfile.address !== draft.address ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                            {originalProfile.address !== draft.address && <span className="text-xs mr-1">+</span>}
                                            {draft.address}
                                        </p>
                                        <p className={`text-sm mt-1 ${originalProfile.latitude !== draft.latitude || originalProfile.longitude !== draft.longitude ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {(originalProfile.latitude !== draft.latitude || originalProfile.longitude !== draft.longitude) && <span className="text-xs mr-1">+</span>}
                                            Coordinates: {draft.latitude}, {draft.longitude}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {draft.languages.map(({language}) => {
                                                const isNew = !originalProfile.languages.some(l => l.languageId === language.id);
                                                return (
                                                    <span key={language.id} className={`px-2 py-1 rounded-md text-sm ${isNew ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-semibold' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}`}>
                                                        {isNew && <span className="text-xs mr-1">+</span>}
                                                        {language.name}
                                                    </span>
                                                );
                                            })}
                                            {draft.languages.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {draft.paymentMethods.map(({paymentMethod}) => {
                                                const isNew = !originalProfile.paymentMethods.some(pm => pm.paymentMethodId === paymentMethod.id);
                                                return (
                                                    <span key={paymentMethod.id} className={`px-2 py-1 rounded-md text-sm ${isNew ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-semibold' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                                                        {isNew && <span className="text-xs mr-1">+</span>}
                                                        {paymentMethod.name}
                                                    </span>
                                                );
                                            })}
                                            {draft.paymentMethods.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images ({draft.images.length})</h3>
                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {draft.images.map((image, index) => {
                                                const isNew = !originalProfile.images.some(img => img.mediumStorageKey === image.mediumStorageKey);
                                                return (
                                                    <div
                                                        key={image.id}
                                                        className={`relative aspect-[9/16] rounded-md overflow-hidden ${
                                                            isNew
                                                                ? 'ring-4 ring-green-500 dark:ring-green-400'
                                                                : index === 0
                                                                    ? 'ring-2 ring-gray-300 dark:ring-gray-600'
                                                                    : 'ring-1 ring-gray-200 dark:ring-gray-700'
                                                        }`}
                                                    >
                                                        <Image
                                                            src={image.mediumUrl}
                                                            alt={`Image ${index + 1}`}
                                                            fill
                                                            sizes="(max-width: 768px) 40vw, 200px"
                                                            className="object-cover"
                                                        />
                                                        {isNew && (
                                                            <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-1 rounded-md font-semibold shadow-lg">
                                                                + NEW
                                                            </div>
                                                        )}
                                                        {index === 0 && !isNew && (
                                                            <div className="absolute top-1 left-1 bg-gray-800 bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded-sm">
                                                                Main
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {draft.images.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                        <p className="mt-1 text-lg text-gray-900 dark:text-white">{draft.name}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                            <p className="mt-1 text-lg text-gray-900 dark:text-white">{draft.age} years</p>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                            <p className="mt-1 text-lg text-gray-900 dark:text-white">{draft.price}€</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                        <div className="mt-1">
                                            <p className="text-gray-900 dark:text-white whitespace-pre-line">{draft.description}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                        <p className="mt-1 text-gray-900 dark:text-white">{draft.address}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Coordinates: {draft.latitude}, {draft.longitude}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {draft.languages.map(({language}) => (
                                                <span key={language.id} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-sm">
                                                    {language.name}
                                                </span>
                                            ))}
                                            {draft.languages.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {draft.paymentMethods.map(({paymentMethod}) => (
                                                <span key={paymentMethod.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-sm">
                                                    {paymentMethod.name}
                                                </span>
                                            ))}
                                            {draft.paymentMethods.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images</h3>
                                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {draft.images.map((image, index) => (
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
                                            {draft.images.length === 0 && (
                                                <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

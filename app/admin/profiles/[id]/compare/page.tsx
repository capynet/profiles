// app/admin/profiles/[id]/compare/page.tsx
import {notFound} from 'next/navigation';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import Link from 'next/link';
import Image from 'next/image';
import TextDiff from '@/components/TextDiff';

export const metadata = {
    title: 'Compare Versions',
    description: 'Compare two profile versions',
};

// Disable caching for admin pages
export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface ComparePageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        from?: string;
        to?: string;
    }>;
}

export default async function ComparePage(props: ComparePageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;

    // Ensure user is an admin
    await requireAdmin();

    const profileId = parseInt(params.id);
    const fromVersionId = searchParams.from ? parseInt(searchParams.from) : null;
    const toVersionId = searchParams.to ? parseInt(searchParams.to) : null;

    if (isNaN(profileId) || !fromVersionId || !toVersionId) {
        notFound();
    }

    // Get both versions from ProfileVersion table
    const [fromVersion, toVersion] = await Promise.all([
        prisma.profileVersion.findUnique({
            where: { id: fromVersionId },
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
            }
        }),
        prisma.profileVersion.findUnique({
            where: { id: toVersionId },
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
            }
        })
    ]);

    if (!fromVersion || !toVersion || fromVersion.profileId !== profileId || toVersion.profileId !== profileId) {
        notFound();
    }

    // Get profile info for context
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: {
            user: {
                select: { name: true, email: true }
            }
        }
    });

    if (!profile) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Compare Versions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        User: {profile.user.name || profile.user.email}
                    </p>
                </div>

                <Link
                    href={`/admin/profiles/${profileId}/versions`}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Back to versions
                </Link>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* From Version (Old - Removed) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-red-500">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Version {fromVersion.version}
                            </h2>
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-md">
                                Old - {new Date(fromVersion.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                <div className="mt-1">
                                    {fromVersion.name !== toVersion.name ? (
                                        <TextDiff oldText={fromVersion.name} newText={toVersion.name} mode="words" />
                                    ) : (
                                        <p className="text-lg text-gray-900 dark:text-white">{fromVersion.name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                    <p className={`mt-1 text-lg ${fromVersion.age !== toVersion.age ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {fromVersion.age !== toVersion.age && <span className="text-xs mr-1">−</span>}
                                        {fromVersion.age} years
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                    <p className={`mt-1 text-lg ${fromVersion.price !== toVersion.price ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {fromVersion.price !== toVersion.price && <span className="text-xs mr-1">−</span>}
                                        {fromVersion.price}€
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                <div className="mt-1">
                                    {fromVersion.description !== toVersion.description ? (
                                        <TextDiff oldText={fromVersion.description} newText={toVersion.description} />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white whitespace-pre-line">{fromVersion.description}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                <div className="mt-1">
                                    {fromVersion.address !== toVersion.address ? (
                                        <TextDiff oldText={fromVersion.address} newText={toVersion.address} mode="words" />
                                    ) : (
                                        <p className="text-gray-900 dark:text-white">{fromVersion.address}</p>
                                    )}
                                </div>
                                <p className={`text-sm mt-1 ${fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {(fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude) && <span className="text-xs mr-1">−</span>}
                                    Coordinates: {fromVersion.latitude}, {fromVersion.longitude}
                                </p>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {fromVersion.languages.map(({language}) => {
                                        const isRemoved = !toVersion.languages.some(l => l.languageId === language.id);
                                        return (
                                            <span key={language.id} className={`px-2 py-1 rounded-md text-sm ${isRemoved ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}`}>
                                                {language.name}
                                            </span>
                                        );
                                    })}
                                    {fromVersion.languages.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {fromVersion.paymentMethods.map(({paymentMethod}) => {
                                        const isRemoved = !toVersion.paymentMethods.some(pm => pm.paymentMethodId === paymentMethod.id);
                                        return (
                                            <span key={paymentMethod.id} className={`px-2 py-1 rounded-md text-sm ${isRemoved ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 line-through' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                                                {paymentMethod.name}
                                            </span>
                                        );
                                    })}
                                    {fromVersion.paymentMethods.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images ({fromVersion.images.length})</h3>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {fromVersion.images.map((image, index) => {
                                        const isRemoved = !toVersion.images.some(img => img.mediumStorageKey === image.mediumStorageKey);
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
                                    {fromVersion.images.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                    )}
                                </div>
                            </div>

                            {fromVersion.comment && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version Comment</h3>
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{fromVersion.comment}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* To Version (New - Added) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border-l-4 border-green-500">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Version {toVersion.version}
                            </h2>
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-md">
                                New - {new Date(toVersion.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {fromVersion.name === toVersion.name && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                                    <p className="mt-1 text-lg text-gray-900 dark:text-white">
                                        {toVersion.name}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</h3>
                                    <p className={`mt-1 text-lg ${fromVersion.age !== toVersion.age ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {fromVersion.age !== toVersion.age && <span className="text-xs mr-1">+</span>}
                                        {toVersion.age} years
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</h3>
                                    <p className={`mt-1 text-lg ${fromVersion.price !== toVersion.price ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-900 dark:text-white'}`}>
                                        {fromVersion.price !== toVersion.price && <span className="text-xs mr-1">+</span>}
                                        {toVersion.price}€
                                    </p>
                                </div>
                            </div>

                            {fromVersion.description === toVersion.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                                    <div className="mt-1">
                                        <p className="text-gray-900 dark:text-white whitespace-pre-line">
                                            {toVersion.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {fromVersion.address === toVersion.address ? (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                                    <p className="mt-1 text-gray-900 dark:text-white">{toVersion.address}</p>
                                    <p className={`text-sm mt-1 ${fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {(fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude) && <span className="text-xs mr-1">+</span>}
                                        Coordinates: {toVersion.latitude}, {toVersion.longitude}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Coordinates</h3>
                                    <p className={`text-sm mt-1 ${fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {(fromVersion.latitude !== toVersion.latitude || fromVersion.longitude !== toVersion.longitude) && <span className="text-xs mr-1">+</span>}
                                        {toVersion.latitude}, {toVersion.longitude}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {toVersion.languages.map(({language}) => {
                                        const isNew = !fromVersion.languages.some(l => l.languageId === language.id);
                                        return (
                                            <span key={language.id} className={`px-2 py-1 rounded-md text-sm ${isNew ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-semibold' : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'}`}>
                                                {isNew && <span className="text-xs mr-1">+</span>}
                                                {language.name}
                                            </span>
                                        );
                                    })}
                                    {toVersion.languages.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No languages selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Methods</h3>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {toVersion.paymentMethods.map(({paymentMethod}) => {
                                        const isNew = !fromVersion.paymentMethods.some(pm => pm.paymentMethodId === paymentMethod.id);
                                        return (
                                            <span key={paymentMethod.id} className={`px-2 py-1 rounded-md text-sm ${isNew ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-semibold' : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'}`}>
                                                {isNew && <span className="text-xs mr-1">+</span>}
                                                {paymentMethod.name}
                                            </span>
                                        );
                                    })}
                                    {toVersion.paymentMethods.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400">No payment methods selected</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Images ({toVersion.images.length})</h3>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {toVersion.images.map((image, index) => {
                                        const isNew = !fromVersion.images.some(img => img.mediumStorageKey === image.mediumStorageKey);
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
                                    {toVersion.images.length === 0 && (
                                        <span className="text-gray-500 dark:text-gray-400 col-span-full">No images uploaded</span>
                                    )}
                                </div>
                            </div>

                            {toVersion.comment && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Version Comment</h3>
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{toVersion.comment}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ProfileImage {
    id: number;
    mediumUrl: string;
    thumbnailUrl?: string | null;
}

interface ProfileCardProps {
    id: number;
    name: string;
    age: number;
    price: number;
    description: string;
    address: string;
    images: ProfileImage[];
    languages: Array<{ language: { id: number; name: string } }>;
    paymentMethods: Array<{ paymentMethod: { id: number; name: string } }>;
    nationalities?: Array<{ nationality: { id: number; name: string } }>;
    ethnicities?: Array<{ ethnicity: { id: number; name: string } }>;
    services?: Array<{ service: { id: number; name: string } }>;
    priority?: boolean;
}

export default function ProfileCard({
                                        id,
                                        name,
                                        age,
                                        price,
                                        description,
                                        address,
                                        images,
                                        languages,
                                        paymentMethods,
                                        nationalities,
                                        ethnicities,
                                        services,
                                        priority = false,
                                    }: ProfileCardProps) {
    const t = useTranslations('ProfileCard');
    const nationalityT = useTranslations('ProfileEntities.Nationalities');
    const ethnicityT = useTranslations('ProfileEntities.Ethnicities');
    const languageT = useTranslations('ProfileEntities.Languages');
    const paymentMethodT = useTranslations('ProfileEntities.PaymentMethods');
    const serviceT = useTranslations('ProfileEntities.Services');

    const imageUrl = images.length > 0 ? images[0].mediumUrl : '/api/placeholder/352/576';
    const profileUrl = `/profile/${id}`;

    // Truncate description
    const truncatedDescription = description.length > 120
        ? `${description.substring(0, 120)}...`
        : description;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1">
            {/* Make image area clickable */}
            <Link href={profileUrl} className="block">
                <div className="aspect-[3/4] relative cursor-pointer">
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                        priority={priority}
                        loading={priority ? "eager" : "lazy"}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{name}</h3>
                                <p className="text-sm text-gray-200">{t('ageYears', { age })}</p>
                            </div>
                            <div className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
                                {price}€
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{truncatedDescription}</p>

                <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('location')}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{address}</p>
                </div>

                {languages.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('languages')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {languages.map(({language}) => (
                                <span
                                    key={language.id}
                                    className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                                >
                                    {languageT(language.name)}
                                </span>
                            ))}
                            {languages.length === 0 && (
                                <span className="text-xs text-gray-500">{t('noLanguages')}</span>
                            )}
                        </div>
                    </div>
                )}

                {paymentMethods.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('paymentMethods')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {paymentMethods.map(({paymentMethod}) => (
                                <span
                                    key={paymentMethod.id}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                                >
                                    {paymentMethodT(paymentMethod.name)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {nationalities && nationalities.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('nationality')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {nationalities.map(({nationality}) => (
                                <span
                                    key={nationality.id}
                                    className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs"
                                >
                                    {nationalityT(nationality.name)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {ethnicities && ethnicities.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('ethnicity')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {ethnicities.map(({ethnicity}) => (
                                <span
                                    key={ethnicity.id}
                                    className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs"
                                >
                                    {ethnicityT(ethnicity.name)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                {services && services.length > 0 && (
                    <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">{t('services')}</h4>
                        <div className="flex flex-wrap gap-1">
                            {services.map(({service}) => (
                                <span
                                    key={service.id}
                                    className="px-2 py-1 bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 rounded text-xs"
                                >
                                    {serviceT(service.name)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <Link
                    href={profileUrl}
                    className="block w-full text-center px-4 py-2 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                    {t('viewProfile')}
                </Link>
            </div>
        </div>
    );
}
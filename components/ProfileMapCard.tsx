'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface ProfileImage {
    id: number;
    mediumUrl: string;
    thumbnailUrl?: string | null;
}

interface ProfileMapCardProps {
    id: number;
    name: string;
    age: number;
    price: number;
    images: ProfileImage[];
    address: string;
}

export default function ProfileMapCard({
                                           id,
                                           name,
                                           age,
                                           price,
                                           images,
                                           address
                                       }: ProfileMapCardProps) {
    const t = useTranslations('ProfileMapCard');
    
    const imageUrl = images.length > 0 ?
        (images[0].thumbnailUrl || images[0].mediumUrl) :
        '/api/placeholder/120/120';

    const profileUrl = `/profile/${id}`;

    return (
        <div className="flex flex-col w-48">
            <div className="flex space-x-2">
                <div className="w-16 h-16 relative overflow-hidden rounded-md">
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized
                    />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900">{name}</h3>
                    <p className="text-xs text-gray-600">{t('ageYears', { age })}</p>
                    <div className="mt-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs inline-block">
                        {price}€
                    </div>
                </div>
            </div>

            <div className="mt-2 text-xs text-gray-600 truncate">
                {address}
            </div>

            <Link
                href={profileUrl}
                className="mt-2 block w-full text-center px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md transition-colors"
            >
                {t('viewProfile')}
            </Link>
        </div>
    );
}
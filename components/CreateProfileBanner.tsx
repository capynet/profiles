'use client';

import Link from 'next/link';

interface CreateProfileBannerProps {
    className?: string;
}

export default function CreateProfileBanner({ className = '' }: CreateProfileBannerProps) {
    return (
        <div className={`bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-lg shadow-md ${className}`}>
            <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-bold mb-1">¡Completa tu perfil para empezar!</h2>
                    <p className="text-white text-opacity-90">
                        Para aparecer en las búsquedas y mostrar tus servicios, necesitas crear un perfil profesional.
                    </p>
                </div>
                <Link
                    href="/profile/create"
                    className="whitespace-nowrap px-6 py-2 bg-white text-indigo-700 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                    Crear Perfil
                </Link>
            </div>
        </div>
    );
}
// components/Header.tsx
'use client';

import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {handleSignOut} from '@/app/auth-actions';
import {toggleProfilePublication} from '@/app/profile/actions';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslations } from 'next-intl';

interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    hasProfile?: boolean;
    profilePublished?: boolean;
}

interface HeaderProps {
    user?: User | null;
}

export default function Header({user}: HeaderProps) {
    const t = useTranslations('Header');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleTogglePublication = async () => {
        setIsToggling(true);
        try {
            await toggleProfilePublication();
            setIsMenuOpen(false);
            // Refresh the page to update the publication status
            window.location.reload();
        } catch (error) {
            console.error('Error toggling publication:', error);
            alert('Failed to toggle profile publication. Please try again.');
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <header className="bg-white shadow-sm dark:bg-gray-900">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo/Brand */}
                    <Link href="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {t('profiles')}
                    </Link>

                    {/* Main Navigation */}
                    {/*<nav className="hidden md:flex items-center space-x-6">*/}
                    {/*    <Link href="/" className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">*/}
                    {/*        {t('home')}*/}
                    {/*    </Link>*/}
                    {/*    <Link href="/search" className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">*/}
                    {/*        {t('search')}*/}
                    {/*    </Link>*/}
                    {/*</nav>*/}

                    {/* User Section */}
                    <div className="flex items-center">
                        {/* Language Switcher */}
                        <div className="mr-4">
                            <LanguageSwitcher />
                        </div>

                        {user && user.role === 'admin' && (
                            <Link
                                href="/admin"
                                className="block mr-4 px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100 dark:text-indigo-400 dark:hover:bg-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('adminDashboard')}
                            </Link>
                        )}

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={toggleMenu}
                                    className="flex items-center space-x-2 focus:outline-none"
                                    aria-expanded={isMenuOpen}
                                    aria-haspopup="true"
                                >
                                    {user.image ? (
                                        <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-indigo-500">
                                            <Image
                                                src={user.image}
                                                alt={user.name || "User"}
                                                width={32}
                                                height={32}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <span className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {user.name || user.email?.split('@')[0]}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-gray-500 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">

                                        <Link
                                            href={user.hasProfile ? "/profile/edit" : "/profile/create"}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {user.hasProfile ? t('editProfile') : `${t('myProfile')} (${t('create')})`}
                                        </Link>

                                        {/* Show publish/unpublish option for users with profiles (non-admin) */}
                                        {user.hasProfile && user.role !== 'admin' && (
                                            <button
                                                onClick={handleTogglePublication}
                                                disabled={isToggling}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
                                            >
                                                {isToggling ? 
                                                    t('updating') : 
                                                    (user.profilePublished ? t('unpublishProfile') : t('publishProfile'))
                                                }
                                            </button>
                                        )}

                                        <div className="border-t border-gray-100 dark:border-gray-700"></div>

                                        <form action={handleSignOut}>
                                            <button
                                                type="submit"
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                                            >
                                                {t('logout')}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('login')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
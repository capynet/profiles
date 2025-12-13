// components/Header.tsx
'use client';

import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {handleSignOut} from '@/app/auth-actions';
import {toggleProfilePublication} from '@/app/profile/actions';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
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
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Detect if we're on a profile page and extract profile ID
    const profileMatch = pathname?.match(/^\/profile\/(\d+)/);
    const currentProfileId = profileMatch ? profileMatch[1] : null;

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
        <header className="bg-card shadow-lg border-b border-border">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo/Brand */}
                    <Link href="/" className="text-xl font-bold text-primary hover:text-primary/90 transition-colors">
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
                        {/* Theme Toggle */}
                        <div className="mr-2">
                            <ThemeToggle />
                        </div>

                        {/* Language Switcher */}
                        <div className="mr-4">
                            <LanguageSwitcher />
                        </div>

                        {user && user.role === 'admin' && (
                            <>
                                <Link
                                    href="/admin"
                                    className="block mr-4 px-4 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t('adminDashboard')}
                                </Link>
                                {currentProfileId && (
                                    <Link
                                        href={`/admin/profiles/${currentProfileId}/edit`}
                                        className="block mr-4 px-4 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                                <Link
                                    href="/admin/entities"
                                    className="block mr-4 px-4 py-2 text-sm text-primary hover:bg-muted rounded-md transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t('manageEntities')}
                                </Link>
                            </>
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
                                        <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-primary">
                                            <Image
                                                src={user.image}
                                                alt={user.name || "User"}
                                                width={32}
                                                height={32}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                        </div>
                                    )}
                                    <span className="hidden sm:inline-block text-sm font-medium text-card-foreground">
                                        {user.name || user.email?.split('@')[0]}
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-muted-foreground transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 py-2 bg-card rounded-md shadow-xl border border-border z-10">

                                        <Link
                                            href={user.hasProfile ? "/profile/edit" : "/profile/create"}
                                            className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            {user.hasProfile ? t('editProfile') : `${t('myProfile')} (${t('create')})`}
                                        </Link>

                                        {/* Show publish/unpublish option for users with profiles (non-admin) */}
                                        {user.hasProfile && user.role !== 'admin' && (
                                            <button
                                                onClick={handleTogglePublication}
                                                disabled={isToggling}
                                                className="block w-full text-left px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                            >
                                                {isToggling ?
                                                    t('updating') :
                                                    (user.profilePublished ? t('unpublishProfile') : t('publishProfile'))
                                                }
                                            </button>
                                        )}

                                        <div className="border-t border-border"></div>

                                        <form action={handleSignOut}>
                                            <button
                                                type="submit"
                                                className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-muted transition-colors"
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
                                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
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
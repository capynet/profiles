// components/Header.tsx
'use client';

import {useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {usePathname} from 'next/navigation';
import {handleSignIn, handleSignOut} from '@/app/auth-actions';
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
                            <div className="hidden md:flex items-center">
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
                            </div>
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

                                        {/* Admin links - only visible on mobile */}
                                        {user.role === 'admin' && (
                                            <>
                                                <div className="md:hidden">
                                                    <Link
                                                        href="/admin"
                                                        className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {t('adminDashboard')}
                                                    </Link>
                                                    {currentProfileId && (
                                                        <Link
                                                            href={`/admin/profiles/${currentProfileId}/edit`}
                                                            className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                                                            onClick={() => setIsMenuOpen(false)}
                                                        >
                                                            Edit Profile
                                                        </Link>
                                                    )}
                                                    <Link
                                                        href="/admin/entities"
                                                        className="block px-4 py-2 text-sm text-card-foreground hover:bg-muted transition-colors"
                                                        onClick={() => setIsMenuOpen(false)}
                                                    >
                                                        {t('manageEntities')}
                                                    </Link>
                                                    <div className="border-t border-border my-2"></div>
                                                </div>
                                            </>
                                        )}

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
                            <form action={handleSignIn}>
                                <button
                                    type="submit"
                                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                                    </svg>
                                    <span>{t('login')}</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
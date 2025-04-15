// app/profile/page.tsx
import {redirect} from 'next/navigation';
import Link from 'next/link';
import {auth} from '@/auth';
import {prisma} from '@/prisma';
import {DataService} from '@/services/dataService';
import ProfilePageClient from './ProfilePageClient';
import CreateProfileBanner from '@/components/CreateProfileBanner';

export const metadata = {
    title: 'Mi Perfil',
    description: 'Visualiza y gestiona tu perfil profesional',
};

export default async function ProfilePage() {
    const session = await auth();

    // Verify user is authenticated
    if (!session) {
        redirect('/login');
    }

    // Get user profile - include even unpublished profiles since this is the user's own profile
    const profiles = await DataService.getProfiles(
        {userId: session.user?.id, isDraft: false}, // Main profile (not drafts)
        true // includeDrafts = true
    );
    const profile = profiles?.[0] || null;

    // Check if there's a draft version of this profile and fetch the full draft data
    let draftProfile = null;
    if (profile) {
        draftProfile = await prisma.profile.findFirst({
            where: {
                originalProfileId: profile.id,
                isDraft: true
            },
            include: {
                languages: {include: {language: true}},
                paymentMethods: {include: {paymentMethod: true}},
                images: {
                    orderBy: {
                        position: 'asc'
                    }
                },
                user: {
                    select: {name: true, email: true}
                }
            }
        });
    }

    // If user has no main profile, check if they have a draft new profile
    let newProfileDraft = null;
    if (!profile) {
        newProfileDraft = await prisma.profile.findFirst({
            where: {
                userId: session.user?.id,
                isDraft: true,
                originalProfileId: null
            },
            include: {
                languages: {include: {language: true}},
                paymentMethods: {include: {paymentMethod: true}},
                images: {
                    orderBy: {
                        position: 'asc'
                    }
                },
                user: {
                    select: {name: true, email: true}
                }
            }
        });
    }

    // Determine which profile to display
    const displayProfile = draftProfile || newProfileDraft || profile;
    const hasNoProfile = !profile && !newProfileDraft;

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Show prominent banner if user has no profile at all */}
            {hasNoProfile && <CreateProfileBanner className="mb-6" />}

            {/* Show warning if profile is not published */}
            {profile && !profile.published && !draftProfile && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Your profile is not published yet</p>
                            <p className="text-xs mt-1">Your profile is private and only visible to you. It needs to be approved and published by an administrator before it becomes visible to the public.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Show info banner if there is a pending draft and we're displaying it */}
            {draftProfile && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">You are viewing your draft changes</p>
                            <p className="text-xs mt-1">These changes are awaiting admin approval. Your current profile remains visible to others until these changes are approved.</p>
                            <p className="mt-2">
                                <Link
                                    href={`/profile/view/${profile.id}`}
                                    className="inline-block text-xs text-blue-600 hover:text-blue-800"
                                >
                                    View published profile
                                </Link>
                                <span className="text-xs text-blue-400 mx-2">•</span>
                                <span className="text-xs text-blue-400">
                                    Last updated: {new Date(draftProfile.updatedAt).toLocaleDateString()}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Show info banner if user has a new profile draft and we're displaying it */}
            {newProfileDraft && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">Your profile is awaiting approval</p>
                            <p className="text-xs mt-1">You are viewing your profile draft. It will be visible to others after administrator approval.</p>
                            <p className="mt-2">
                                <span className="text-xs text-blue-400">
                                    Created: {new Date(newProfileDraft.updatedAt).toLocaleDateString()}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <ProfilePageClient
                profile={displayProfile}
                draftId={draftProfile?.id || newProfileDraft?.id || null}
            />
        </div>
    );
}
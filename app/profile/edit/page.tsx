// app/profile/edit/page.tsx
// Modify the existing file to check for drafts

import {redirect} from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import {DataService} from '@/services/dataService';
import {auth} from '@/auth';
import {prisma} from '@/prisma';

export const metadata = {
    title: 'Edit profile',
    description: 'Edita tu perfil profesional',
};

export default async function EditProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    // First check if there's a draft profile
    const draftProfile = await prisma.profile.findFirst({
        where: {
            userId: session.user.id,
            isDraft: true
        },
        include: {
            languages: true,
            paymentMethods: true,
            images: true,
            nationalities: true,
            ethnicities: true,
            services: true,
        },
    });

    // If a draft exists, redirect to edit the draft instead
    if (draftProfile) {
        redirect(`/profile/edit/${draftProfile.id}`);
    }

    // Otherwise get the original profile
    const profiles = await DataService.getProfiles({userId: session.user.id});
    const profile = profiles[0];

    if (!profile) {
        redirect('/profile/create');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Your Profile</h1>
            <ProfileForm profile={profile} isEditing={true}/>
        </div>
    );
}
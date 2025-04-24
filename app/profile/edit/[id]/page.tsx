// app/profile/edit/[id]/page.tsx
import {redirect} from 'next/navigation';
import ProfileForm from '@/components/ProfileForm';
import {DataService} from '@/services/dataService';
import {auth} from '@/auth';
import {prisma} from '@/prisma';

export const metadata = {
    title: 'Edit Draft',
    description: 'Edit your profile draft',
};

interface EditDraftProfilePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditDraftProfilePage(props: EditDraftProfilePageProps) {
    const params = await props.params;
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    const draftId = parseInt(params.id);

    if (isNaN(draftId)) {
        redirect('/profile');
    }

    // Get the draft profile
    const profile = await prisma.profile.findUnique({
        where: {
            id: draftId,
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

    if (!profile) {
        // If no draft found for this user, redirect to regular edit page
        redirect('/profile/edit');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Edit Your Draft Profile</h1>
            <ProfileForm profile={profile} isEditing={true}/>
        </div>
    );
}
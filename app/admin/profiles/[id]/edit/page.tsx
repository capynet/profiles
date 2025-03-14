// app/admin/profiles/[id]/edit/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma';
import ProfileForm from '@/components/ProfileForm';
import { requireAdmin } from '@/lib/auth-utils';

export const metadata = {
    title: 'Admin - Edit Profile',
    description: 'Edit user profile as administrator',
};

interface AdminEditProfilePageProps {
    params: {
        id: string;
    };
}

export default async function AdminEditProfilePage({ params }: AdminEditProfilePageProps) {
    // Ensure user is an admin
    await requireAdmin();

    const profileId = parseInt(params.id);

    if (isNaN(profileId)) {
        redirect('/admin');
    }

    // Get profile with all needed related data
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: {
            languages: true,
            paymentMethods: true,
            images: true,
            user: {
                select: { name: true, email: true, id: true }
            },
        },
    });

    if (!profile) {
        redirect('/admin');
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Admin - Edit Profile: {profile.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Editing profile for user: {profile.user.name || profile.user.email}
                </p>
            </div>

            <ProfileForm
                profile={profile}
                isEditing={true}
                isAdminMode={true}
            />
        </div>
    );
}
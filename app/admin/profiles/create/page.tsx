// app/admin/profiles/create/page.tsx
import { redirect } from 'next/navigation';
import { prisma } from '@/prisma';
import ProfileForm from '@/components/ProfileForm';
import { requireAdmin } from '@/lib/auth-utils';

export const metadata = {
    title: 'Admin - Create Profile',
    description: 'Create user profile as administrator',
};

export default async function AdminCreateProfilePage({
                                                         searchParams,
                                                     }: {
    searchParams: { userId?: string }
}) {
    // Ensure user is an admin
    await requireAdmin();

    const userId = searchParams.userId;

    if (!userId) {
        redirect('/admin');
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
    });

    if (!user) {
        redirect('/admin');
    }

    // Check if user already has a profile
    const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });

    if (existingProfile) {
        redirect(`/admin/profiles/${existingProfile.id}/edit`);
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    Admin - Create Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Creating profile for user: {user.name || user.email}
                </p>
            </div>

            <ProfileForm
                isAdminMode={true}
                userId={user.id}
            />
        </div>
    );
}
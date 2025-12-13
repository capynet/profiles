// app/admin/profiles/[id]/versions/page.tsx
import {notFound} from 'next/navigation';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import Link from 'next/link';
import ProfileVersionHistory from '@/components/ProfileVersionHistory';

export const metadata = {
    title: 'Versions',
    description: 'View profile version history',
};

interface AdminProfileViewPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function AdminProfileViewPage(props: AdminProfileViewPageProps) {
    const params = await props.params;
    // Ensure user is an admin
    await requireAdmin();

    const profileId = parseInt(params.id);
    if (isNaN(profileId)) {
        notFound();
    }

    // Get basic profile info for version history
    const profile = await prisma.profile.findUnique({
        where: {id: profileId},
        select: {
            id: true,
            currentVersion: true,
            user: {
                select: {name: true, email: true}
            }
        },
    });

    if (!profile) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Versions
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        User: {profile.user.name || profile.user.email}
                    </p>
                </div>

                <Link
                    href="/admin"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                    Back to admin
                </Link>
            </div>

            <ProfileVersionHistory
                profileId={profile.id}
                currentVersion={profile.currentVersion}
            />
        </div>
    );
}
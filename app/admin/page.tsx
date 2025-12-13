// app/admin/page.tsx
import {requireAdmin} from '@/lib/auth-utils';
import {prisma} from '@/prisma';
import AdminUserTable from '@/components/AdminUserTable';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Admin Dashboard',
    description: 'Manage users and profiles',
};

interface AdminDashboardPageProps {
    searchParams: Promise<{
        sortBy?: string;
    }>;
}

export default async function AdminDashboardPage(props: AdminDashboardPageProps) {
    // This ensures only admin users can access this page
    await requireAdmin();

    const searchParams = await props.searchParams;
    const sortBy = searchParams.sortBy || 'updated';

    // Fetch all users with their profiles (including ALL drafts)
    const users = await prisma.user.findMany({
        include: {
            profiles: {
                select: {
                    id: true,
                    name: true,
                    age: true,
                    price: true,
                    isDraft: true,
                    published: true,
                    originalProfileId: true,
                    updatedAt: true
                }
            },
        },
    });

    // Transform data to include both profile and draft information
    const transformedUsers = users.map(user => {
        // Find the main published profile (non-draft)
        const mainProfile = user.profiles.find(p => !p.isDraft) || null;

        // Find pending draft (either new profile or edit of existing)
        const pendingDraft = user.profiles.find(p => p.isDraft) || null;

        return {
            ...user,
            profile: mainProfile,
            draft: pendingDraft
        };
    });

    // Sort the transformed users based on sortBy parameter
    transformedUsers.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'created':
                return b.createdAt.getTime() - a.createdAt.getTime();
            case 'updated':
            default:
                // Sort by profile updatedAt (most recent first)
                const aUpdated = a.profile?.updatedAt?.getTime() || 0;
                const bUpdated = b.profile?.updatedAt?.getTime() || 0;
                return bUpdated - aUpdated;
        }
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Admin Dashboard
            </h1>

            {/* Unified User Management Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        User Management
                    </h2>

                    <AdminUserTable users={transformedUsers} sortBy={sortBy} />
                </div>
            </div>
        </div>
    );
}
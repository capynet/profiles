// app/admin/page.tsx
import {requireAdmin} from '@/lib/auth-utils';
import {prisma} from '@/prisma';
import AdminUserTable from '@/components/AdminUserTable';
import AdminDraftsTable from '@/components/AdminDraftsTable';

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Admin Dashboard',
    description: 'Manage users and profiles',
};

export default async function AdminDashboardPage() {
    // This ensures only admin users can access this page
    await requireAdmin();

    // Fetch all pending profile drafts
    const drafts = await prisma.profile.findMany({
        where: {
            isDraft: true
        },
        include: {
            user: {
                select: { name: true, email: true }
            },
            originalProfile: {
                select: { id: true, name: true }
            }
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });

    // Fetch all users with their profiles
    const users = await prisma.user.findMany({
        include: {
            profiles: {
                select: {
                    id: true,
                    name: true,
                    age: true,
                    price: true,
                    isDraft: true,
                    published: true, // Explicitly include published field
                    originalProfileId: true
                },
                where: {
                    OR: [
                        { isDraft: false },
                        { isDraft: true, originalProfileId: null } // Include drafts without originals (new profiles)
                    ]
                }
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    // Transform data to maintain compatibility with AdminUserTable component
    const transformedUsers = users.map(user => {
        // Find the main profile (non-draft) or the first profile if no main profile exists
        const mainProfile = user.profiles.find(p => !p.isDraft) || user.profiles[0] || null;

        return {
            ...user,
            // Assign the main profile as "profile" (singular) for compatibility
            profile: mainProfile
        };
    });

    console.log("Users with profiles:", transformedUsers.map(u => ({
        email: u.email,
        profile: u.profile ? {
            id: u.profile.id,
            name: u.profile.name,
            published: u.profile.published
        } : null
    })));

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Admin Dashboard
            </h1>

            {/* Pending Drafts Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Pending Profile Drafts
                        {drafts.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-xs rounded-full">
                                {drafts.length}
                            </span>
                        )}
                    </h2>

                    <AdminDraftsTable drafts={drafts} />
                </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        User Management
                    </h2>

                    <AdminUserTable users={transformedUsers}/>
                </div>
            </div>
        </div>
    );
}
// app/admin/page.tsx
import {requireAdmin} from '@/lib/auth-utils';
import {prisma} from '@/prisma';
import AdminUserTable from '@/components/AdminUserTable';

export const metadata = {
    title: 'Admin Dashboard',
    description: 'Manage users and profiles',
};

export default async function AdminDashboardPage() {
    // This ensures only admin users can access this page
    await requireAdmin();

    // Fetch all users with their profiles
    const users = await prisma.user.findMany({
        include: {
            profile: {
                select: {
                    id: true,
                    name: true,
                    age: true,
                    price: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Admin Dashboard
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        User Management
                    </h2>

                    <AdminUserTable users={users}/>
                </div>
            </div>
        </div>
    );
}
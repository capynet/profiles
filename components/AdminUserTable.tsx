'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Profile {
    id: number;
    name: string;
    age: number;
    price: number;
    published: boolean; // Make sure this property exists
    isDraft?: boolean;
    originalProfileId?: number | null;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified: Date | null;
    image: string | null;
    role: string;
    createdAt: Date;
    profile: Profile | null;
    profiles?: Profile[]; // Optional: for accessing all profiles if needed
}

interface AdminUserTableProps {
    users: User[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter users based on search term and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            !searchTerm ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = !filterRole || user.role === filterRole;

        return matchesSearch && matchesRole;
    });

    // Toggle user role between 'user' and 'admin'
    const handleToggleRole = async (userId: string, currentRole: string) => {
        try {
            setIsUpdating(true);
            const newRole = currentRole === 'admin' ? 'user' : 'admin';

            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                throw new Error('Failed to update user role');
            }

            // Show success message
            setStatusMessage({
                type: 'success',
                text: `User role updated to ${newRole} successfully!`
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error updating user role:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to update user role. Please try again.'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle profile deletion
    const handleDeleteProfile = async (profileId: number) => {
        if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
            return;
        }

        try {
            setIsUpdating(true);
            const response = await fetch(`/api/admin/profiles/${profileId}/delete`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete profile');
            }

            setStatusMessage({
                type: 'success',
                text: 'Profile deleted successfully!'
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error deleting profile:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to delete profile. Please try again.'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div>
            {/* Status message */}
            {statusMessage && (
                <div className={`mb-4 p-3 rounded ${
                    statusMessage.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {statusMessage.text}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <select
                        value={filterRole || ''}
                        onChange={(e) => setFilterRole(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Profile
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Published
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 relative">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={user.name || 'User'}
                                                    className="rounded-full"
                                                    fill
                                                    sizes="40px"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                                                    {user.name?.charAt(0) || user.email.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.name || 'No name'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.profile ? (
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.profile.name}
                                                {user.profile.isDraft && (
                                                    <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                                                        Draft
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.profile.age} years • {user.profile.price}€
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            No profile
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {user.profile ? (
                                        <span className="text-lg" title={user.profile.published ? "Published" : "Not Published"}>
                                            {user.profile.published ? "✅" : "❌"}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }`}>
                                      {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-3">
                                    {user.profile ? (
                                        <>
                                            <Link
                                                href={`/admin/profiles/${user.profile.id}/edit`}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            >
                                                Edit Profile
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteProfile(user.profile.id)}
                                                disabled={isUpdating}
                                                className="ml-3 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Delete
                                            </button>
                                        </>
                                    ) : (
                                        <Link
                                            href={`/admin/profiles/create?userId=${user.id}`}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                        >
                                            Create Profile
                                        </Link>
                                    )}

                                    <button
                                        onClick={() => handleToggleRole(user.id, user.role)}
                                        disabled={isUpdating}
                                        className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                No users found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
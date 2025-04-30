'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDateFriendly } from '@/lib/date-utils';
import { useTranslations } from 'next-intl';

interface Profile {
    id: number;
    name: string;
    age: number;
    price: number;
    published: boolean;
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
    profiles?: Profile[];
}

interface AdminUserTableProps {
    users: User[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {
    const t = useTranslations('AdminUserTable');
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingProfileIds, setUpdatingProfileIds] = useState<Record<number, boolean>>({});
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
                text: t('roleUpdated', {role: newRole})
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
                text: t('failedRoleUpdate')
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Toggle profile publication status
    const handleTogglePublished = async (profileId: number, currentlyPublished: boolean) => {
        try {
            // Mark this profile as updating
            setUpdatingProfileIds(prev => ({ ...prev, [profileId]: true }));

            const response = await fetch(`/api/admin/profiles/${profileId}/publish`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ published: !currentlyPublished }),
            });

            if (!response.ok) {
                throw new Error('Failed to update publication status');
            }

            // Show success message
            setStatusMessage({
                type: 'success',
                text: !currentlyPublished ? t('profilePublished') : t('profileUnpublished')
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error updating publication status:', error);
            setStatusMessage({
                type: 'error',
                text: t('failedPublishUpdate')
            });
        } finally {
            // Unmark this profile as updating
            setUpdatingProfileIds(prev => {
                const newState = { ...prev };
                delete newState[profileId];
                return newState;
            });
        }
    };

    // Handle profile deletion
    const handleDeleteProfile = async (profileId: number) => {
        if (!window.confirm(t('deleteConfirmation'))) {
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
                text: t('profileDeleted')
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
                text: t('failedProfileDelete')
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
                        placeholder={t('searchPlaceholder')}
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
                        <option value="">{t('allRoles')}</option>
                        <option value="user">{t('user')}</option>
                        <option value="admin">{t('admin')}</option>
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
                                            {t('noProfile')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {user.profile ? (
                                        <span
                                            className={`text-lg ${!updatingProfileIds[user.profile.id] ? 'cursor-pointer hover:opacity-70' : 'opacity-50'}`}
                                            title={user.profile.published ? t('clickToUnpublish') : t('clickToPublish')}
                                            onClick={() => {
                                                if (!updatingProfileIds[user.profile.id]) {
                                                    handleTogglePublished(user.profile.id, user.profile.published);
                                                }
                                            }}
                                        >
                                            {updatingProfileIds[user.profile.id] ? (
                                                <svg className="animate-spin inline-block h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                user.profile.published ? "✅" : "❌"
                                            )}
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
                                    {formatDateFriendly(user.createdAt)}
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
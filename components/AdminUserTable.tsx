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
    updatedAt?: Date;
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
    draft?: Profile | null;
    profiles?: Profile[];
}

interface AdminUserTableProps {
    users: User[];
}

export default function AdminUserTable({ users }: AdminUserTableProps) {
    const t = useTranslations('AdminUserTable');
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRoles, setFilterRoles] = useState<string[]>(['user']);
    const [showOnlyDrafts, setShowOnlyDrafts] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updatingProfileIds, setUpdatingProfileIds] = useState<Record<number, boolean>>({});
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    // Filter users based on search term, role, and draft status
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            !searchTerm ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = filterRoles.length === 0 || filterRoles.includes(user.role);

        const matchesDraft = !showOnlyDrafts || Boolean(user.draft);

        return matchesSearch && matchesRole && matchesDraft;
    });

    // Handle role filter toggle
    const handleRoleToggle = (role: string) => {
        setFilterRoles(prev => {
            if (prev.includes(role)) {
                return prev.filter(r => r !== role);
            } else {
                return [...prev, role];
            }
        });
    };

    // Handle user selection
    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    // Handle bulk make admin
    const handleBulkMakeAdmin = async () => {
        if (selectedUsers.length === 0) {
            return;
        }

        if (!window.confirm(`Are you sure you want to make ${selectedUsers.length} user(s) administrator(s)? This will grant them full access to the admin panel.`)) {
            return;
        }

        try {
            setIsUpdating(true);

            // Update all selected users
            const promises = selectedUsers.map(userId =>
                fetch(`/api/admin/users/${userId}/role`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ role: 'admin' }),
                })
            );

            await Promise.all(promises);

            setStatusMessage({
                type: 'success',
                text: `Successfully updated ${selectedUsers.length} user(s) to admin`
            });

            setSelectedUsers([]);
            router.refresh();

            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error updating users:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to update users'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle impersonate user
    const handleImpersonate = async (userId: string) => {
        if (!window.confirm('Are you sure you want to impersonate this user? You will be logged in as them.')) {
            return;
        }

        try {
            setIsUpdating(true);

            const response = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error('Failed to impersonate user');
            }

            // Redirect to home page as the impersonated user
            window.location.href = '/';
        } catch (error) {
            console.error('Error impersonating user:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to impersonate user'
            });
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

    // Handle draft approval
    const handleApproveDraft = async (draftId: number) => {
        try {
            setIsUpdating(true);
            const response = await fetch(`/api/admin/profiles/drafts/${draftId}/approve`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to approve draft');
            }

            const data = await response.json();
            const replacements = data.appliedReplacements || [];

            let message = 'Draft approved successfully';
            if (replacements.length > 0) {
                const replacementList = replacements.map((r: any) =>
                    `${r.entityType}: "${r.oldName}" ${r.action === 'replaced' ? `→ "${r.newName}"` : '(removed)'}`
                ).join(', ');
                message += `. Replacements: ${replacementList}`;
            }

            setStatusMessage({
                type: 'success',
                text: message
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 5 seconds (longer if replacements shown)
            setTimeout(() => {
                setStatusMessage(null);
            }, replacements.length > 0 ? 8000 : 3000);
        } catch (error) {
            console.error('Error approving draft:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to approve draft'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // Handle draft rejection
    const handleRejectDraft = async (draftId: number) => {
        if (!window.confirm('Are you sure you want to reject this draft? This action cannot be undone.')) {
            return;
        }

        try {
            setIsUpdating(true);
            const response = await fetch(`/api/admin/profiles/drafts/${draftId}/reject`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to reject draft');
            }

            setStatusMessage({
                type: 'success',
                text: 'Draft rejected successfully'
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error rejecting draft:', error);
            setStatusMessage({
                type: 'error',
                text: 'Failed to reject draft'
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

                <div className="flex items-center gap-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterRoles.includes('user')}
                            onChange={() => handleRoleToggle('user')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Users</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterRoles.includes('admin')}
                            onChange={() => handleRoleToggle('admin')}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Admins</span>
                    </label>
                </div>

                <div>
                    <button
                        onClick={() => setShowOnlyDrafts(!showOnlyDrafts)}
                        className={`px-4 py-2 rounded-md border font-medium transition-colors ${
                            showOnlyDrafts
                                ? 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                        title="Show only users with pending drafts"
                    >
                        📝 Drafts Only
                    </button>
                </div>

                <div>
                    <button
                        onClick={handleBulkMakeAdmin}
                        disabled={selectedUsers.length === 0 || isUpdating}
                        className={`px-4 py-2 rounded-md border font-medium transition-colors ${
                            selectedUsers.length === 0 || isUpdating
                                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                : 'bg-purple-600 text-white border-purple-700 hover:bg-purple-700'
                        }`}
                        title="Make selected users administrators"
                    >
                        ⭐ Make Admin {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-center w-12">
                            <input
                                type="checkbox"
                                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-48">
                            User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-auto">
                            Profile
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Drafts
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Updated
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                                <td className="px-4 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={() => handleSelectUser(user.id)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap w-48">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-8 w-8 relative">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={user.name || 'User'}
                                                    className="rounded-full"
                                                    fill
                                                    sizes="32px"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
                                                    {user.name?.charAt(0) || user.email.charAt(0)}
                                                </div>
                                            )}
                                            {user.role === 'admin' && (
                                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white dark:border-gray-900" title="Admin">
                                                    ★
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-3 min-w-0 flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {user.name || 'No name'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.profile ? (
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-lg ${user.profile && !updatingProfileIds[user.profile.id] ? 'cursor-pointer hover:opacity-70' : 'opacity-50'}`}
                                                title={user.profile.published ? t('clickToUnpublish') : t('clickToPublish')}
                                                onClick={() => {
                                                    if (user.profile && !updatingProfileIds[user.profile.id]) {
                                                        handleTogglePublished(user.profile.id, user.profile.published);
                                                    }
                                                }}
                                            >
                                                {user.profile && updatingProfileIds[user.profile.id] ? (
                                                    <svg className="animate-spin inline-block h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    user.profile.published ? "✅" : "❌"
                                                )}
                                            </span>
                                            <Link
                                                href={`/profile/${user.profile.id}`}
                                                className="text-sm font-medium text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                target="_blank"
                                            >
                                                {user.profile.name}
                                            </Link>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {t('noProfile')}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {user.draft ? (
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleApproveDraft(user.draft!.id)}
                                                disabled={isUpdating}
                                                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 font-medium"
                                                title="Approve draft"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => handleRejectDraft(user.draft!.id)}
                                                disabled={isUpdating}
                                                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 font-medium"
                                                title="Reject draft"
                                            >
                                                ✕
                                            </button>
                                            <Link
                                                href={`/admin/profiles/${user.draft!.id}/versions`}
                                                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium inline-flex items-center"
                                                title="View draft"
                                            >
                                                👁
                                            </Link>
                                        </div>
                                    ) : user.profile ? (
                                        <Link
                                            href={`/admin/profiles/${user.profile.id}/versions`}
                                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                            title="View profile and version history"
                                        >
                                            📊 Versions
                                        </Link>
                                    ) : (
                                        <span className="text-sm text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDateFriendly(user.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.profile?.updatedAt ? formatDateFriendly(user.profile.updatedAt) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex gap-3">
                                        {user.profile ? (
                                            <>
                                                <Link
                                                    href={`/admin/profiles/${user.profile?.id}/edit`}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => user.profile && handleDeleteProfile(user.profile.id)}
                                                    disabled={isUpdating}
                                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
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
                                            onClick={() => handleImpersonate(user.id)}
                                            disabled={isUpdating}
                                            className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                            title="Impersonate user"
                                        >
                                            👤 Impersonate
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
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
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDateFriendly } from '@/lib/date-utils';
import { useTranslations } from 'next-intl';

interface ProfileDraft {
    id: number;
    name: string;
    originalProfileId: number | null;
    updatedAt: Date;
    user: {
        name: string | null;
        email: string;
    };
    originalProfile: {
        id: number;
        name: string;
    } | null
}

interface AdminDraftsTableProps {
    drafts: ProfileDraft[];
}

interface AppliedReplacement {
    entityType: string;
    oldName: string;
    newName: string | null;
    action: 'replaced' | 'removed';
}

export default function AdminDraftsTable({ drafts }: AdminDraftsTableProps) {
    const t = useTranslations('AdminDraftsTable');
    const common = useTranslations('Common');
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [appliedReplacements, setAppliedReplacements] = useState<AppliedReplacement[]>([]);

    const handleApprove = async (draftId: number) => {
        try {
            setIsProcessing(draftId);

            const response = await fetch(`/api/admin/profiles/drafts/${draftId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve draft');
            }

            const data = await response.json();
            const replacements = data.appliedReplacements || [];

            setStatusMessage({
                type: 'success',
                text: t('draftApproved')
            });

            // Show applied replacements if any
            if (replacements.length > 0) {
                setAppliedReplacements(replacements);
            }

            // Refresh the page data
            router.refresh();

            // Clear the messages after 5 seconds
            setTimeout(() => {
                setStatusMessage(null);
                setAppliedReplacements([]);
            }, 5000);
        } catch (error) {
            console.error('Error approving draft:', error);
            setStatusMessage({
                type: 'error',
                text: t('failedToApprove')
            });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (draftId: number) => {
        try {
            setIsProcessing(draftId);

            const response = await fetch(`/api/admin/profiles/drafts/${draftId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject draft');
            }

            setStatusMessage({
                type: 'success',
                text: t('draftRejected')
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
                text: t('failedToReject')
            });
        } finally {
            setIsProcessing(null);
        }
    };

    if (drafts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('noPendingDrafts')}</p>
            </div>
        );
    }

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

            {/* Applied Replacements Callout */}
            {appliedReplacements.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex">
                        <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                Entity Replacements Applied
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                                <p className="mb-2">The following entity values were automatically updated:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    {appliedReplacements.map((replacement, index) => (
                                        <li key={index}>
                                            <strong>{replacement.entityType}:</strong>{' '}
                                            &quot;{replacement.oldName}&quot;{' '}
                                            {replacement.action === 'replaced' ? (
                                                <>was replaced with &quot;{replacement.newName}&quot;</>
                                            ) : (
                                                <>was removed</>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('user')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('profile')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lastUpdated')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('actions')}
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                    {drafts.map((draft) => (
                        <tr key={draft.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {draft.user.name || t('noName')}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {draft.user.email}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {draft.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {draft.originalProfile
                                        ? `${t('draftForOriginalProfile')}: ${draft.originalProfile.name} (#${draft.originalProfile.id})`
                                        : t('newProfileDraft')
                                    }
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDateFriendly(draft.updatedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 space-x-3">
                                <Link
                                    href={`/admin/profiles/${draft.id}/versions`}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                    {t('viewDraft')}
                                </Link>
                                <button
                                    onClick={() => handleApprove(draft.id)}
                                    disabled={isProcessing === draft.id}
                                    className={`text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 ${isProcessing === draft.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing === draft.id ? common('processing') : t('approve')}
                                </button>
                                <button
                                    onClick={() => handleReject(draft.id)}
                                    disabled={isProcessing === draft.id}
                                    className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${isProcessing === draft.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {t('reject')}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
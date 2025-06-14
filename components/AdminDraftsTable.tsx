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

export default function AdminDraftsTable({ drafts }: AdminDraftsTableProps) {
    const t = useTranslations('AdminDraftsTable');
    const common = useTranslations('Common');
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

            setStatusMessage({
                type: 'success',
                text: t('draftApproved')
            });

            // Refresh the page data
            router.refresh();

            // Clear the message after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
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
                                    href={`/admin/profiles/${draft.id}/view`}
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
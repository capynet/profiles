// components/ProfileVersionHistory.tsx
'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ProfileVersion {
    id: number;
    version: number;
    name: string;
    price: number;
    age: number;
    createdBy: string;
    createdAt: string;
    comment: string | null;
    _count?: {
        images: number;
        languages: number;
        paymentMethods: number;
    };
}

interface ProfileVersionHistoryProps {
    profileId: number;
    currentVersion: number;
}

export default function ProfileVersionHistory({ profileId, currentVersion }: ProfileVersionHistoryProps) {
    const [versions, setVersions] = useState<ProfileVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<ProfileVersion | null>(null);
    const [showRollbackModal, setShowRollbackModal] = useState(false);
    const [rollbackComment, setRollbackComment] = useState('');
    const [isRollingBack, setIsRollingBack] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        fetchVersions();
    }, [profileId]);

    const fetchVersions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`/api/admin/profiles/${profileId}/versions`);

            if (!response.ok) {
                throw new Error('Failed to fetch version history');
            }

            const data = await response.json();
            setVersions(data.versions || []);
        } catch (err) {
            console.error('Error fetching versions:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            toast.error('Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    const handleRollbackClick = (version: ProfileVersion) => {
        setSelectedVersion(version);
        setShowRollbackModal(true);
        setRollbackComment(`Rollback to version ${version.version}`);
    };

    const handleConfirmRollback = async () => {
        if (!selectedVersion) return;

        try {
            setIsRollingBack(true);
            const response = await fetch(`/api/admin/profiles/${profileId}/rollback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    versionId: selectedVersion.id,
                    comment: rollbackComment || `Rollback to version ${selectedVersion.version}`,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to rollback');
            }

            toast.success(`Successfully rolled back to version ${selectedVersion.version}`);
            setShowRollbackModal(false);
            setSelectedVersion(null);
            setRollbackComment('');

            // Refresh the page to show updated data
            router.refresh();

            // Refresh versions list
            await fetchVersions();
        } catch (err) {
            console.error('Error rolling back:', err);
            toast.error(err instanceof Error ? err.message : 'Failed to rollback');
        } finally {
            setIsRollingBack(false);
        }
    };

    const handleCancelRollback = () => {
        setShowRollbackModal(false);
        setSelectedVersion(null);
        setRollbackComment('');
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Version History</h2>
                <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Version History</h2>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                    <p className="text-red-800 dark:text-red-200">{error}</p>
                    <button
                        onClick={fetchVersions}
                        className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Version History</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Current: v{currentVersion}
                        </span>
                    </div>

                    {versions.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No version history available
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Version
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Details
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Comment
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {versions.map((version) => {
                                        const isCurrentVersion = version.version === currentVersion;
                                        return (
                                            <tr key={version.id} className={isCurrentVersion ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            v{version.version}
                                                        </span>
                                                        {isCurrentVersion && (
                                                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-md">
                                                                Current
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {formatDate(version.createdAt)}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                                                    {version.name}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    <div className="space-y-1">
                                                        <div>Age: {version.age}, Price: {version.price}€</div>
                                                        {version._count && (
                                                            <div className="text-xs">
                                                                {version._count.images} images, {version._count.languages} languages
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                    {version.comment || '-'}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleRollbackClick(version)}
                                                        disabled={isCurrentVersion}
                                                        className={`px-3 py-1 rounded-md transition-colors ${
                                                            isCurrentVersion
                                                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                                                        }`}
                                                        title={isCurrentVersion ? 'Already at this version' : 'Restore this version'}
                                                    >
                                                        Rollback
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Rollback Confirmation Modal */}
            {mounted && showRollbackModal && selectedVersion && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            handleCancelRollback();
                        }
                    }}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Confirm Rollback
                            </h3>

                            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <strong>Warning:</strong> This will restore the profile to version {selectedVersion.version} from {formatDate(selectedVersion.createdAt)}.
                                </p>
                                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                                    A snapshot of the current state will be created before rollback.
                                </p>
                            </div>

                            <div className="mb-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Version:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">v{selectedVersion.version}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{selectedVersion.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Age:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{selectedVersion.age}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Price:</span>
                                    <span className="text-gray-900 dark:text-white font-medium">{selectedVersion.price}€</span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="rollback-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Comment (optional)
                                </label>
                                <textarea
                                    id="rollback-comment"
                                    value={rollbackComment}
                                    onChange={(e) => setRollbackComment(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    rows={3}
                                    placeholder="Why are you rolling back to this version?"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleCancelRollback}
                                    disabled={isRollingBack}
                                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRollback}
                                    disabled={isRollingBack}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isRollingBack ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Rolling back...
                                        </>
                                    ) : (
                                        'Confirm Rollback'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

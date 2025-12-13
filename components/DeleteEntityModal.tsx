'use client';

import {useState} from 'react';
import Link from 'next/link';

interface DeleteEntityModalProps {
    isOpen: boolean;
    entityName: string;
    entityTypeName: string;
    affectedProfiles: number;
    profiles: Array<{id: number; name: string}>;
    availableReplacements: Array<{id: number; name: string}>;
    onConfirm: (replacementId: number | null) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

export default function DeleteEntityModal({
    isOpen,
    entityName,
    entityTypeName,
    affectedProfiles,
    profiles,
    availableReplacements,
    onConfirm,
    onCancel,
    loading,
}: DeleteEntityModalProps) {
    const [replacementId, setReplacementId] = useState<number | null>(null);
    const [showProfiles, setShowProfiles] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        await onConfirm(replacementId);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Delete {entityTypeName}: "{entityName}"
                        </h3>
                    </div>

                    {/* Warning */}
                    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <div className="flex">
                            <svg
                                className="h-5 w-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    This {entityTypeName.toLowerCase()} is in use
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                    <p>
                                        This entity is currently used by <strong>{affectedProfiles}</strong> active{' '}
                                        {affectedProfiles === 1 ? 'profile' : 'profiles'}.
                                    </p>
                                </div>
                                {profiles.length > 0 && (
                                    <div className="mt-3">
                                        <button
                                            onClick={() => setShowProfiles(!showProfiles)}
                                            className="text-sm text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                                        >
                                            {showProfiles ? 'Hide' : 'Show'} affected profiles
                                        </button>
                                        {showProfiles && (
                                            <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1 max-h-40 overflow-y-auto">
                                                {profiles.map((profile) => (
                                                    <li key={profile.id} className="flex items-center">
                                                        <span className="mr-1">•</span>
                                                        <Link
                                                            href={`/profile/${profile.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:underline font-medium"
                                                        >
                                                            {profile.name}
                                                        </Link>
                                                        <span className="ml-1">(ID: {profile.id})</span>
                                                        <svg
                                                            className="w-3 h-3 ml-1"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Replacement options */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            What would you like to do?
                        </label>
                        <select
                            value={replacementId === null ? '' : replacementId}
                            onChange={(e) =>
                                setReplacementId(e.target.value === '' ? null : parseInt(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            disabled={loading}
                        >
                            <option value="">Remove without replacement (profiles will lose this value)</option>
                            {availableReplacements.length > 0 && (
                                <optgroup label="Replace with:">
                                    {availableReplacements.map((replacement) => (
                                        <option key={replacement.id} value={replacement.id}>
                                            {replacement.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {replacementId === null
                                ? 'All active profiles will have this value removed.'
                                : `All active profiles will have "${entityName}" replaced with the selected value.`}
                        </p>
                    </div>

                    {/* Info box */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Note:</strong> Draft profiles will not be modified immediately. When a draft is
                            approved and becomes active, the replacement will be applied automatically.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AdminProfileActionButtonsProps {
    profileId: number;
    isDraft: boolean;
    hasOriginal: boolean;
}

export default function AdminProfileActionButtons({ profileId, isDraft, hasOriginal }: AdminProfileActionButtonsProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async () => {
        try {
            setIsProcessing(true);

            const response = await fetch(`/api/admin/profiles/drafts/${profileId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to approve draft');
            }

            // Redirect to admin dashboard
            router.push('/admin');
            router.refresh();
        } catch (error) {
            console.error('Error approving draft:', error);
            alert('Failed to approve draft: ' + error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        try {
            setIsProcessing(true);

            const response = await fetch(`/api/admin/profiles/drafts/${profileId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to reject draft');
            }

            // Redirect to admin dashboard
            router.push('/admin');
            router.refresh();
        } catch (error) {
            console.error('Error rejecting draft:', error);
            alert('Failed to reject draft: ' + error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to permanently delete this profile? This action cannot be undone.')) {
            return;
        }

        try {
            setIsProcessing(true);

            const response = await fetch(`/api/admin/profiles/${profileId}/delete`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete profile');
            }

            // Redirect to admin dashboard
            router.push('/admin');
            router.refresh();
        } catch (error) {
            console.error('Error deleting profile:', error);
            alert('Failed to delete profile: ' + error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {isDraft && hasOriginal && (
                <>
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Approve Draft'}
                    </button>

                    <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? 'Processing...' : 'Reject Draft'}
                    </button>
                </>
            )}

            <button
                onClick={handleDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? 'Processing...' : 'Delete Profile'}
            </button>
        </div>
    );
}
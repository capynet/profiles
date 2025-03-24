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
        // Confirm before rejecting
        if (!confirm('Are you sure you want to reject this draft? This action cannot be undone.')) {
            return;
        }

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

    if (!isDraft || !hasOriginal) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
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
        </div>
    );
}
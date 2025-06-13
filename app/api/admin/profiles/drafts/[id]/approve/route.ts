// app/api/admin/profiles/drafts/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DataService } from '@/services/dataService';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();

        // Check if user is authenticated and has admin role
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const draftId = parseInt(params.id);
        if (isNaN(draftId)) {
            return NextResponse.json(
                { error: 'Invalid draft ID' },
                { status: 400 }
            );
        }

        await DataService.approveProfileDraft(draftId);

        // Revalidate relevant paths and cache tags
        revalidatePath('/admin');
        revalidatePath('/profile');
        revalidateTag('profiles');
        revalidateTag('profile-list');
        revalidateTag('profile-drafts');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving draft:', error);
        return NextResponse.json(
            { error: 'Failed to approve draft' },
            { status: 500 }
        );
    }
}
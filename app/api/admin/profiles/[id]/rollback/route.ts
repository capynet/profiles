// app/api/admin/profiles/[id]/rollback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DataService } from '@/services/dataService';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth();

        // Check if user is authenticated and has admin role
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin only' },
                { status: 403 }
            );
        }

        const profileId = parseInt(params.id);
        if (isNaN(profileId)) {
            return NextResponse.json(
                { error: 'Invalid profile ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { versionId, comment } = body;

        if (!versionId || isNaN(parseInt(versionId))) {
            return NextResponse.json(
                { error: 'Invalid version ID' },
                { status: 400 }
            );
        }

        const restoredProfile = await DataService.rollbackToVersion(
            profileId,
            parseInt(versionId),
            session.user.id,
            comment
        );

        // Revalidate relevant paths
        revalidatePath('/admin');
        revalidatePath(`/admin/profiles/${profileId}`);
        revalidateTag('profiles', 'default');
        revalidateTag('profile-list', 'default');

        return NextResponse.json({
            success: true,
            profile: restoredProfile
        });
    } catch (error) {
        console.error('Error rolling back profile:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to rollback profile' },
            { status: 500 }
        );
    }
}

// app/api/admin/profiles/[id]/versions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DataService } from '@/services/dataService';

export async function GET(
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

        const versions = await DataService.getProfileVersions(profileId);

        return NextResponse.json({ versions });
    } catch (error) {
        console.error('Error fetching versions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch versions' },
            { status: 500 }
        );
    }
}

// app/api/admin/profiles/[id]/versions/[versionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DataService } from '@/services/dataService';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string; versionId: string }> }
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

        const versionId = parseInt(params.versionId);
        if (isNaN(versionId)) {
            return NextResponse.json(
                { error: 'Invalid version ID' },
                { status: 400 }
            );
        }

        const version = await DataService.getProfileVersion(versionId);

        if (!version) {
            return NextResponse.json(
                { error: 'Version not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ version });
    } catch (error) {
        console.error('Error fetching version:', error);
        return NextResponse.json(
            { error: 'Failed to fetch version' },
            { status: 500 }
        );
    }
}

// app/api/admin/profiles/[id]/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Check if user is authenticated and has admin role
        if (!session || session.user?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const params = await props.params;
        const profileId = parseInt(params.id);
        if (isNaN(profileId)) {
            return NextResponse.json(
                { error: 'Invalid profile ID' },
                { status: 400 }
            );
        }

        // Get the published state from request body
        const body = await request.json();
        const { published } = body;

        if (typeof published !== 'boolean') {
            return NextResponse.json(
                { error: 'Published state must be a boolean' },
                { status: 400 }
            );
        }

        // Update the profile's published state
        const updatedProfile = await prisma.profile.update({
            where: { id: profileId },
            data: { published }
        });

        // Revalidate paths
        revalidatePath('/admin');
        revalidatePath(`/profile/${profileId}`);

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile publish state:', error);
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        );
    }
}
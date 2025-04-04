// app/api/admin/profiles/drafts/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { ImageService } from '@/services/imageService';
import { revalidatePath } from 'next/cache';

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

        // Get the draft profile with its images to delete them
        const draft = await prisma.profile.findUnique({
            where: { id: draftId },
            include: {
                images: true
            }
        });

        if (!draft) {
            return NextResponse.json(
                { error: 'Draft profile not found' },
                { status: 404 }
            );
        }

        // Delete all images from storage
        for (const image of draft.images) {
            try {
                await ImageService.deleteImage(image.mediumStorageKey);
            } catch (error) {
                console.error(`Failed to delete image ${image.id}:`, error);
                // Continue with other images even if one fails
            }
        }

        // Use a transaction to ensure all related records are deleted
        await prisma.$transaction(async (tx) => {
            // First delete all profile relationships
            await tx.profilePaymentMethod.deleteMany({
                where: { profileId: draftId }
            });

            await tx.profileLanguage.deleteMany({
                where: { profileId: draftId }
            });

            // Then delete profile images
            await tx.profileImage.deleteMany({
                where: { profileId: draftId }
            });

            // Finally delete the profile itself
            await tx.profile.delete({
                where: { id: draftId }
            });
        });

        // Revalidate relevant paths
        revalidatePath('/admin');
        revalidatePath('/profile');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting draft:', error);
        return NextResponse.json(
            { error: 'Failed to reject draft' },
            { status: 500 }
        );
    }
}
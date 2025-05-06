// app/api/admin/profiles/[id]/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';
import { ImageService } from '@/services/imageService';
import { revalidatePath } from 'next/cache';

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

        const profileId = parseInt(params.id);
        if (isNaN(profileId)) {
            return NextResponse.json(
                { error: 'Invalid profile ID' },
                { status: 400 }
            );
        }

        // Get the profile with its images to delete them
        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            include: {
                images: true
            }
        });

        if (!profile) {
            return NextResponse.json(
                { error: 'Profile not found' },
                { status: 404 }
            );
        }

        // Delete all images from storage
        for (const image of profile.images) {
            try {
                await ImageService.deleteImage(image.mediumStorageKey);
            } catch (error) {
                console.error(`Failed to delete image ${image.id}:`, error);
                // Continue with other images even if one fails
            }
        }

        // Use a transaction to ensure all related records are deleted
        await prisma.$transaction(async (tx) => {
            // First, find and delete any drafts related to this profile
            const drafts = await tx.profile.findMany({
                where: {
                    originalProfileId: profileId
                }
            });

            // Delete all relationships for each draft first
            for (const draft of drafts) {
                await tx.profilePaymentMethod.deleteMany({
                    where: { profileId: draft.id }
                });

                await tx.profileLanguage.deleteMany({
                    where: { profileId: draft.id }
                });

                await tx.profileNationality.deleteMany({
                    where: { profileId: draft.id }
                });

                await tx.profileEthnicity.deleteMany({
                    where: { profileId: draft.id }
                });

                await tx.profileService.deleteMany({
                    where: { profileId: draft.id }
                });

                await tx.profileImage.deleteMany({
                    where: { profileId: draft.id }
                });
            }

            // Now delete the draft profiles themselves
            await tx.profile.deleteMany({
                where: {
                    originalProfileId: profileId
                }
            });

            // Delete all profile relationships for the main profile
            await tx.profilePaymentMethod.deleteMany({
                where: { profileId }
            });

            await tx.profileLanguage.deleteMany({
                where: { profileId }
            });

            await tx.profileNationality.deleteMany({
                where: { profileId }
            });

            await tx.profileEthnicity.deleteMany({
                where: { profileId }
            });

            await tx.profileService.deleteMany({
                where: { profileId }
            });

            // Then delete profile images
            await tx.profileImage.deleteMany({
                where: { profileId }
            });

            // Finally delete the profile itself
            await tx.profile.delete({
                where: { id: profileId }
            });
        });

        // Revalidate relevant paths
        revalidatePath('/admin');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json(
            { error: 'Failed to delete profile' },
            { status: 500 }
        );
    }
}
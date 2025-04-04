// services/dataService.ts
import {Prisma, ProfileImage, Profile} from "@prisma/client";
import {prisma} from "@/prisma";
import {ImageService, ProcessedImage} from "./imageService";

// Enhanced interface for processed images with order information
interface ProcessedImageWithOrder extends ProcessedImage {
    order?: number;
}

export const DataService = {
    async getAllLanguages() {
        try {
            return await prisma.language.findMany({
                select: {id: true, name: true},
                orderBy: {name: Prisma.SortOrder.asc}
            });
        } catch (error) {
            console.error('Error fetching languages:', error);
            return [];
        }
    },

    async getAllPaymentMethods() {
        try {
            return await prisma.paymentMethod.findMany({
                select: {id: true, name: true},
                orderBy: {name: Prisma.SortOrder.asc}
            });
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            return [];
        }
    },

    async getProfiles(where?: Prisma.ProfileWhereInput, includeDrafts: boolean = false, userContext?: { userId?: string, isAdmin?: boolean }) {
        try {
            // Base where condition
            const baseWhere: Prisma.ProfileWhereInput = {...where};

            // Handling draft visibility logic
            if (userContext?.userId) {
                if (userContext.isAdmin) {
                    // Admins can see everything by default
                    if (!includeDrafts) {
                        // But if not explicitly including drafts, show only published
                        baseWhere.isDraft = false;
                    }
                } else {
                    // Regular users see:
                    if (includeDrafts) {
                        // Their own drafts + published profiles
                        baseWhere.OR = [
                            {userId: userContext.userId}, // Their own profiles (published or draft)
                            {published: true, isDraft: false} // Published profiles from others
                        ];
                    } else {
                        // Only published profiles (default)
                        baseWhere.published = true;
                        baseWhere.isDraft = false;
                    }
                }
            } else {
                // Unauthenticated users see only published, non-draft profiles
                baseWhere.published = true;
                baseWhere.isDraft = false;
            }

            return await prisma.profile.findMany({
                where: baseWhere,
                include: {
                    languages: {include: {language: true}},
                    paymentMethods: {include: {paymentMethod: true}},
                    user: {select: {name: true, email: true}},
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    },
                    originalProfile: userContext?.isAdmin || (userContext?.userId && baseWhere.userId === userContext.userId)
                        ? {select: {id: true, name: true}}
                        : false,
                    drafts: userContext?.isAdmin || (userContext?.userId && baseWhere.userId === userContext.userId)
                        ? {select: {id: true, updatedAt: true}}
                        : false
                }
            });
        } catch (error) {
            console.error('Error fetching profiles:', error);
            return [];
        }
    },

    async createProfile(data: Prisma.ProfileCreateInput & { processedImages?: ProcessedImage[] }) {
        try {
            if (!data) {
                throw new Error('Profile data cannot be null or undefined');
            }

            // Extract the processedImages field (not part of Prisma type)
            const {processedImages, ...profileData} = data;

            // Use transaction to ensure all operations succeed or fail together
            return await prisma.$transaction(async (tx) => {
                // Extract connect objects to handle them separately
                const {languages, paymentMethods, ...basicProfileData} = profileData;

                // Create profile first without relations
                console.log('Creating profile with basic data (no relations)');
                const profile = await tx.profile.create({
                    data: basicProfileData,
                });

                console.log('Profile created with ID:', profile.id);

                // Now handle language relationships if they exist
                if (languages && 'connect' in languages && Array.isArray(languages.connect) && languages.connect.length > 0) {
                    console.log('Adding languages:', languages.connect.length);

                    for (const lang of languages.connect) {
                        await tx.profileLanguage.create({
                            data: {
                                profileId: profile.id,
                                languageId: lang.id
                            }
                        });
                    }
                }

                // Handle payment method relationships if they exist
                if (paymentMethods && 'connect' in paymentMethods && Array.isArray(paymentMethods.connect) && paymentMethods.connect.length > 0) {
                    console.log('Adding payment methods:', paymentMethods.connect.length);

                    for (const method of paymentMethods.connect) {
                        await tx.profilePaymentMethod.create({
                            data: {
                                profileId: profile.id,
                                paymentMethodId: method.id
                            }
                        });
                    }
                }

                // Handle images if they exist - with position for order
                if (processedImages && processedImages.length > 0) {
                    console.log('Adding images:', processedImages.length);

                    for (let position = 0; position < processedImages.length; position++) {
                        const img = processedImages[position];
                        await tx.profileImage.create({
                            data: {
                                profileId: profile.id,
                                position,
                                // Medium quality (default)
                                mediumUrl: img.mediumUrl,
                                mediumCdnUrl: img.mediumCdnUrl,
                                mediumStorageKey: img.mediumStorageKey,
                                // Thumbnail version
                                thumbnailUrl: img.thumbnailUrl,
                                thumbnailCdnUrl: img.thumbnailCdnUrl,
                                thumbnailStorageKey: img.thumbnailStorageKey,
                                // High quality version
                                highQualityUrl: img.highQualityUrl,
                                highQualityCdnUrl: img.highQualityCdnUrl,
                                highQualityStorageKey: img.highQualityStorageKey
                            }
                        });
                    }
                }

                // Return the complete profile with related data
                return await tx.profile.findUnique({
                    where: {id: profile.id},
                    include: {
                        languages: {include: {language: true}},
                        paymentMethods: {include: {paymentMethod: true}},
                        images: {
                            orderBy: {
                                position: 'asc'
                            }
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    async createProfileDraft(originalProfile: Profile & {
        images: ProfileImage[],
        languages: { languageId: number }[],
        paymentMethods: { paymentMethodId: number }[]
    }, updateData: any) {
        return await prisma.$transaction(async (tx) => {
            // 1. Create a new profile as a draft, linked to the original
            const draftProfile = await tx.profile.create({
                data: {
                    userId: originalProfile.userId,
                    name: updateData.name || originalProfile.name,
                    price: updateData.price !== undefined ? Number(updateData.price) : originalProfile.price,
                    age: updateData.age !== undefined ? Number(updateData.age) : originalProfile.age,
                    description: updateData.description || originalProfile.description,
                    latitude: updateData.latitude !== undefined ? Number(updateData.latitude) : originalProfile.latitude,
                    longitude: updateData.longitude !== undefined ? Number(updateData.longitude) : originalProfile.longitude,
                    address: updateData.address || originalProfile.address,
                    published: false, // Draft is not published
                    isDraft: true,    // Mark as draft
                    originalProfileId: originalProfile.id, // Link to original
                }
            });

            console.log('Created draft profile:', draftProfile.id);

            // 2. Clone language relationships if provided in updateData, otherwise use original
            const languageIds = updateData.languages
                ? updateData.languages instanceof Array
                    ? updateData.languages.map((id: string) => Number(id))
                    : []
                : originalProfile.languages.map(l => l.languageId);

            if (languageIds.length > 0) {
                for (const langId of languageIds) {
                    await tx.profileLanguage.create({
                        data: {
                            profileId: draftProfile.id,
                            languageId: langId
                        }
                    });
                }
            }

            // 3. Clone payment method relationships
            const paymentMethodIds = updateData.paymentMethods
                ? updateData.paymentMethods instanceof Array
                    ? updateData.paymentMethods.map((id: string) => Number(id))
                    : []
                : originalProfile.paymentMethods.map(pm => pm.paymentMethodId);

            if (paymentMethodIds.length > 0) {
                for (const pmId of paymentMethodIds) {
                    await tx.profilePaymentMethod.create({
                        data: {
                            profileId: draftProfile.id,
                            paymentMethodId: pmId
                        }
                    });
                }
            }

            // 4. Handle images - FIXING THE IMAGE HANDLING
            // Process any explicit instruction to remove all images
            const explicitlyRemovingAllImages = updateData.hasOwnProperty('images') &&
                updateData.images === 'explicit' &&
                (!updateData.existingImagesOrder || updateData.existingImagesOrder.length === 0) &&
                (!updateData.processedImages || updateData.processedImages.length === 0);

            // Get new images data
            const processedImages = updateData.processedImages || [];
            const existingImagesOrder = updateData.existingImagesOrder || [];

            // Determine if we should clone original images
            const shouldCloneOriginalImages = !explicitlyRemovingAllImages && originalProfile.images.length > 0;

            let nextPosition = 0;

            // First, clone original images to the draft if needed
            if (shouldCloneOriginalImages) {
                // If we have an explicit order for existing images, use that
                if (existingImagesOrder.length > 0) {
                    // Create a map for looking up original images by storage key
                    const originalImageMap = new Map<string, ProfileImage>();
                    originalProfile.images.forEach(img => {
                        originalImageMap.set(img.mediumStorageKey, img);
                    });

                    // Add only the images specified in existingImagesOrder
                    for (const orderItem of existingImagesOrder) {
                        const originalImage = originalImageMap.get(orderItem.key);
                        if (originalImage) {
                            await tx.profileImage.create({
                                data: {
                                    profileId: draftProfile.id,
                                    position: orderItem.order || nextPosition++,
                                    mediumUrl: originalImage.mediumUrl,
                                    mediumCdnUrl: originalImage.mediumCdnUrl,
                                    mediumStorageKey: originalImage.mediumStorageKey,
                                    thumbnailUrl: originalImage.thumbnailUrl,
                                    thumbnailCdnUrl: originalImage.thumbnailCdnUrl,
                                    thumbnailStorageKey: originalImage.thumbnailStorageKey,
                                    highQualityUrl: originalImage.highQualityUrl,
                                    highQualityCdnUrl: originalImage.highQualityCdnUrl,
                                    highQualityStorageKey: originalImage.highQualityStorageKey
                                }
                            });
                        }
                    }
                } else {
                    // No specific order provided, clone all original images in their current order
                    console.log('Cloning original images to draft');
                    for (const img of originalProfile.images) {
                        await tx.profileImage.create({
                            data: {
                                profileId: draftProfile.id,
                                position: nextPosition++,
                                mediumUrl: img.mediumUrl,
                                mediumCdnUrl: img.mediumCdnUrl,
                                mediumStorageKey: img.mediumStorageKey,
                                thumbnailUrl: img.thumbnailUrl,
                                thumbnailCdnUrl: img.thumbnailCdnUrl,
                                thumbnailStorageKey: img.thumbnailStorageKey,
                                highQualityUrl: img.highQualityUrl,
                                highQualityCdnUrl: img.highQualityCdnUrl,
                                highQualityStorageKey: img.highQualityStorageKey
                            }
                        });
                    }
                }
            }

            // Then, add any new images
            if (processedImages.length > 0) {
                console.log('Adding new images to draft:', processedImages.length);
                for (const img of processedImages) {
                    await tx.profileImage.create({
                        data: {
                            profileId: draftProfile.id,
                            position: img.order !== undefined ? img.order : nextPosition++,
                            mediumUrl: img.mediumUrl,
                            mediumCdnUrl: img.mediumCdnUrl,
                            mediumStorageKey: img.mediumStorageKey,
                            thumbnailUrl: img.thumbnailUrl,
                            thumbnailCdnUrl: img.thumbnailCdnUrl,
                            thumbnailStorageKey: img.thumbnailStorageKey,
                            highQualityUrl: img.highQualityUrl,
                            highQualityCdnUrl: img.highQualityCdnUrl,
                            highQualityStorageKey: img.highQualityStorageKey
                        }
                    });
                }
            }

            // 5. Return the draft profile with all relationships
            return tx.profile.findUnique({
                where: {id: draftProfile.id},
                include: {
                    languages: {include: {language: true}},
                    paymentMethods: {include: {paymentMethod: true}},
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    },
                    originalProfile: true
                }
            });
        });
    },

    async approveProfileDraft(draftId: number) {
        return await prisma.$transaction(async (tx) => {
            // Get the draft profile with all relationships
            const draft = await tx.profile.findUnique({
                where: {id: draftId},
                include: {
                    originalProfile: true,
                    images: true,
                    languages: true,
                    paymentMethods: true
                }
            });

            if (!draft) {
                throw new Error('Draft profile not found');
            }

            if (!draft.isDraft || !draft.originalProfileId) {
                throw new Error('This is not a valid draft profile');
            }

            const originalProfileId = draft.originalProfileId;

            // 1. Get the language and payment method IDs from the draft
            const languageIds = draft.languages.map(l => l.languageId);
            const paymentMethodIds = draft.paymentMethods.map(pm => pm.paymentMethodId);

            // 2. Clear existing relationships on the original profile
            await tx.profileLanguage.deleteMany({
                where: {profileId: originalProfileId}
            });

            await tx.profilePaymentMethod.deleteMany({
                where: {profileId: originalProfileId}
            });

            // Delete original profile images
            const originalImages = await tx.profileImage.findMany({
                where: {profileId: originalProfileId}
            });

            for (const img of originalImages) {
                await ImageService.deleteImage(img.mediumStorageKey);
            }

            await tx.profileImage.deleteMany({
                where: {profileId: originalProfileId}
            });

            // 3. Update the original profile with the draft's data
            const updatedProfile = await tx.profile.update({
                where: {id: originalProfileId},
                data: {
                    name: draft.name,
                    price: draft.price,
                    age: draft.age,
                    description: draft.description,
                    latitude: draft.latitude,
                    longitude: draft.longitude,
                    address: draft.address,
                    // Keep it published
                    updatedAt: new Date()
                }
            });

            // 4. Create new relationships on the original profile
            // Languages
            for (const langId of languageIds) {
                await tx.profileLanguage.create({
                    data: {
                        profileId: originalProfileId,
                        languageId: langId
                    }
                });
            }

            // Payment methods
            for (const pmId of paymentMethodIds) {
                await tx.profilePaymentMethod.create({
                    data: {
                        profileId: originalProfileId,
                        paymentMethodId: pmId
                    }
                });
            }

            // Clone images from draft to original
            for (const img of draft.images) {
                await tx.profileImage.create({
                    data: {
                        profileId: originalProfileId,
                        position: img.position,
                        mediumUrl: img.mediumUrl,
                        mediumCdnUrl: img.mediumCdnUrl,
                        mediumStorageKey: img.mediumStorageKey,
                        thumbnailUrl: img.thumbnailUrl,
                        thumbnailCdnUrl: img.thumbnailCdnUrl,
                        thumbnailStorageKey: img.thumbnailStorageKey,
                        highQualityUrl: img.highQualityUrl,
                        highQualityCdnUrl: img.highQualityCdnUrl,
                        highQualityStorageKey: img.highQualityStorageKey
                    }
                });
            }

            // 5. Delete the draft
            await tx.profile.delete({
                where: {id: draftId}
            });

            return updatedProfile;
        });
    },

    async updateProfile(profileId: number, data: Prisma.ProfileUpdateInput & {
        processedImages?: ProcessedImageWithOrder[],
        existingImagesOrder?: { key: string, order: number }[],
        images?: string | any // Add this to the type definition
    }, userContext?: { userId: string, isAdmin: boolean }) {
        try {
            // Extract the custom fields
            const {processedImages, existingImagesOrder, images, ...profileData} = data;

            // Get the profile to update
            const existingProfile = await prisma.profile.findUnique({
                where: {id: profileId},
                include: {
                    images: true,
                    languages: true,
                    paymentMethods: true,
                    drafts: true
                }
            });

            if (!existingProfile) {
                throw new Error(`Profile with ID ${profileId} not found`);
            }

            // Check if a draft should be created
            // 1. Profile is published
            // 2. User is not an admin
            // 3. This profile is not already a draft
            const shouldCreateDraft = existingProfile.published &&
                !userContext?.isAdmin &&
                !existingProfile.isDraft;

            // If should create draft, check if one already exists
            if (shouldCreateDraft) {
                console.log('Checking for existing draft for profile:', profileId);

                const existingDraft = await prisma.profile.findFirst({
                    where: {
                        originalProfileId: profileId,
                        isDraft: true
                    }
                });

                if (existingDraft) {
                    console.log('Found existing draft, updating it instead:', existingDraft.id);
                    return this.updateProfile(existingDraft.id, data, userContext);
                }

                console.log('Creating new draft for published profile');
                // Create a new draft based on the original
                return this.createProfileDraft(existingProfile, {...data, images});
            }

            // Normal update logic for drafts or when admin is updating
            // Extract language and payment method IDs
            const languageIds = profileData.languages
                ? (profileData.languages as any).connect?.map((item: any) => item.id) || []
                : [];

            const paymentMethodIds = profileData.paymentMethods
                ? (profileData.paymentMethods as any).connect?.map((item: any) => item.id) || []
                : [];

            // Remove these fields as we'll handle them separately
            const {languages, paymentMethods, ...restProfileData} = profileData as any;

            return await prisma.$transaction(async (tx) => {
                const existingProfile = await tx.profile.findUnique({
                    where: {id: profileId},
                    include: {
                        images: true,
                        languages: true,
                        paymentMethods: true
                    }
                });

                if (!existingProfile) {
                    throw new Error(`Profile with ID ${profileId} not found`);
                }

                // Get existing images
                const existingImages = (existingProfile.images || []) as ProfileImage[];

                // Create a map for existing images by storage key for easy lookup
                const existingImageMap = new Map<string, ProfileImage>();
                existingImages.forEach(img => {
                    existingImageMap.set(img.mediumStorageKey, img);
                });

                // Determine which existing images to keep
                const imagesToKeep = existingImagesOrder ?
                    existingImagesOrder.map(item => item.key) :
                    [];

                // Find images to delete (not in imagesToKeep)
                const imagesToDelete = existingImages.filter(img =>
                    !imagesToKeep.includes(img.mediumStorageKey)
                );

                // Delete images from Google Cloud Storage that won't be kept
                for (const img of imagesToDelete) {
                    console.log('Deleting image from storage:', img.mediumStorageKey);
                    await ImageService.deleteImage(img.mediumStorageKey);
                }

                // Delete all existing image records from database
                // We'll recreate them with the correct order
                console.log('Deleting all existing image records to recreate with correct order');
                await tx.profileImage.deleteMany({
                    where: {profileId}
                });

                // First, update the basic profile data
                const updatedProfile = await tx.profile.update({
                    where: {id: profileId},
                    data: restProfileData as Prisma.ProfileUpdateInput
                });

                // Handle language relationships
                // Delete existing language relationships
                await tx.profileLanguage.deleteMany({
                    where: {profileId}
                });

                // Create new language relationships
                if (languageIds.length > 0) {
                    await tx.profileLanguage.createMany({
                        data: languageIds.map((languageId: number) => ({
                            profileId,
                            languageId
                        }))
                    });
                }

                // Handle payment method relationships
                // Delete existing payment method relationships
                await tx.profilePaymentMethod.deleteMany({
                    where: {profileId}
                });

                // Create new payment method relationships
                if (paymentMethodIds.length > 0) {
                    await tx.profilePaymentMethod.createMany({
                        data: paymentMethodIds.map((paymentMethodId: number) => ({
                            profileId,
                            paymentMethodId
                        }))
                    });
                }

                // Prepare an ordered list of all images (existing and new) to create
                const allImagesToCreate: {
                    imageData: ProfileImage | ProcessedImageWithOrder;
                    isNew: boolean;
                    order: number;
                }[] = [];

                // Add existing images with their specified order
                if (existingImagesOrder && existingImagesOrder.length > 0) {
                    existingImagesOrder.forEach(item => {
                        const existingImage = existingImageMap.get(item.key);
                        if (existingImage) {
                            allImagesToCreate.push({
                                imageData: existingImage,
                                isNew: false,
                                order: item.order
                            });
                        }
                    });
                }

                // Add new images with their specified order
                if (processedImages && processedImages.length > 0) {
                    processedImages.forEach(img => {
                        allImagesToCreate.push({
                            imageData: img,
                            isNew: true,
                            order: img.order !== undefined ? img.order : allImagesToCreate.length
                        });
                    });
                }

                // Sort all images by their order
                allImagesToCreate.sort((a, b) => a.order - b.order);

                console.log('Creating images in this order:',
                    allImagesToCreate.map((item, idx) => ({
                        position: idx,
                        isNew: item.isNew,
                        originalOrder: item.order
                    }))
                );

                // Create all image records with the correct position
                for (let position = 0; position < allImagesToCreate.length; position++) {
                    const {imageData, isNew} = allImagesToCreate[position];

                    if (isNew) {
                        // It's a new image
                        const newImg = imageData as ProcessedImageWithOrder;
                        await tx.profileImage.create({
                            data: {
                                profileId,
                                position,
                                // Medium quality (default)
                                mediumUrl: newImg.mediumUrl,
                                mediumCdnUrl: newImg.mediumCdnUrl,
                                mediumStorageKey: newImg.mediumStorageKey,
                                // Thumbnail version
                                thumbnailUrl: newImg.thumbnailUrl,
                                thumbnailCdnUrl: newImg.thumbnailCdnUrl,
                                thumbnailStorageKey: newImg.thumbnailStorageKey,
                                // High quality version
                                highQualityUrl: newImg.highQualityUrl,
                                highQualityCdnUrl: newImg.highQualityCdnUrl,
                                highQualityStorageKey: newImg.highQualityStorageKey
                            }
                        });
                    } else {
                        // It's an existing image
                        const existingImg = imageData as ProfileImage;
                        await tx.profileImage.create({
                            data: {
                                profileId,
                                position,
                                // Medium quality (default)
                                mediumUrl: existingImg.mediumUrl,
                                mediumCdnUrl: existingImg.mediumCdnUrl,
                                mediumStorageKey: existingImg.mediumStorageKey,
                                // Thumbnail version
                                thumbnailUrl: existingImg.thumbnailUrl,
                                thumbnailCdnUrl: existingImg.thumbnailCdnUrl,
                                thumbnailStorageKey: existingImg.thumbnailStorageKey,
                                // High quality version
                                highQualityUrl: existingImg.highQualityUrl,
                                highQualityCdnUrl: existingImg.highQualityCdnUrl,
                                highQualityStorageKey: existingImg.highQualityStorageKey
                            }
                        });
                    }
                }

                // Return the updated profile with all related data
                return tx.profile.findUnique({
                    where: {id: profileId},
                    include: {
                        languages: {include: {language: true}},
                        paymentMethods: {include: {paymentMethod: true}},
                        images: {
                            orderBy: {
                                position: 'asc'
                            }
                        }
                    }
                });
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error occurred';

            console.error('Error updating profile:', errorMessage);
            throw new Error('Failed to update profile');
        }
    },

    async getUsers() {
        try {
            return await prisma.user.findMany();
        } catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
};
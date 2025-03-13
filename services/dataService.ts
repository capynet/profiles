// services/dataService.ts
import {Prisma, ProfileImage} from "@prisma/client";
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

    async getProfiles(where?: Prisma.ProfileWhereInput) {
        try {
            return await prisma.profile.findMany({
                where,
                include: {
                    languages: {include: {language: true}},
                    paymentMethods: {include: {paymentMethod: true}},
                    user: {select: {name: true, email: true}},
                    images: {
                        orderBy: {
                            position: 'asc'
                        }
                    }
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

            // Extract connect objects to handle them separately
            const {languages, paymentMethods, ...basicProfileData} = profileData;

            // Create profile first without relations
            console.log('Creating profile with basic data (no relations)');
            const profile = await prisma.profile.create({
                data: {
                    ...basicProfileData,
                    images: {create: []},
                    languages: {create: []},
                    paymentMethods: {create: []}
                },
            });

            console.log('Profile created with ID:', profile.id);

            // Now handle language relationships if they exist
            if (languages && 'connect' in languages && Array.isArray(languages.connect) && languages.connect.length > 0) {
                console.log('Adding languages:', languages.connect.length);

                for (const lang of languages.connect) {
                    await prisma.profileLanguage.create({
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
                    await prisma.profilePaymentMethod.create({
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
                    await prisma.profileImage.create({
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
            return await prisma.profile.findUnique({
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
        } catch (error) {
            console.error('Error creating profile:', error);
            throw new Error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },

    async updateProfile(profileId: number, data: Prisma.ProfileUpdateInput & {
        processedImages?: ProcessedImageWithOrder[],
        existingImagesOrder?: { key: string, order: number }[]
    }) {
        try {
            // Extract the custom fields (not part of Prisma type)
            const {processedImages, existingImagesOrder, ...profileData} = data;

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
                    where: { profileId }
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
                    const { imageData, isNew } = allImagesToCreate[position];

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
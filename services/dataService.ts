// services/dataService.ts
import {Prisma, ProfileImage} from "@prisma/client";
import {prisma} from "@/prisma";
import {ImageService, ProcessedImage} from "./imageService";

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
        processedImages?: ProcessedImage[],
        imagesToKeep?: string[]
    }) {
        try {
            // Extract the custom fields (not part of Prisma type)
            const {processedImages, imagesToKeep, ...profileData} = data;

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

                // Handle images deletion
                const existingImages = (existingProfile.images || []) as ProfileImage[];
                const imagesToDelete = existingImages.filter(img =>
                    !imagesToKeep || !imagesToKeep.includes(img.mediumStorageKey)
                );

                // Delete images from Google Cloud Storage
                for (const img of imagesToDelete) {
                    await ImageService.deleteImage(img.mediumStorageKey);
                }

                // Delete image records from database for those being deleted
                if (imagesToDelete.length > 0) {
                    await tx.profileImage.deleteMany({
                        where: {
                            profileId,
                            mediumStorageKey: {in: imagesToDelete.map(img => img.mediumStorageKey)}
                        }
                    });
                }

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

                // CAMBIOS PARA MANTENER EL ORDEN DE LAS IMÁGENES

                // Eliminar las imágenes existentes para recrearlas con orden
                if (imagesToKeep && imagesToKeep.length > 0) {
                    await tx.profileImage.deleteMany({
                        where: {
                            profileId,
                            mediumStorageKey: {
                                in: imagesToKeep
                            }
                        }
                    });

                    // Recrear las imágenes existentes con el orden correcto
                    for (let position = 0; position < imagesToKeep.length; position++) {
                        const storageKey = imagesToKeep[position];
                        const existingImage = existingImages.find(img => img.mediumStorageKey === storageKey);

                        if (existingImage) {
                            await tx.profileImage.create({
                                data: {
                                    profileId,
                                    position, // Usar la posición basada en el orden del array
                                    // Medium quality (default)
                                    mediumUrl: existingImage.mediumUrl,
                                    mediumCdnUrl: existingImage.mediumCdnUrl,
                                    mediumStorageKey: existingImage.mediumStorageKey,
                                    // Thumbnail version
                                    thumbnailUrl: existingImage.thumbnailUrl,
                                    thumbnailCdnUrl: existingImage.thumbnailCdnUrl,
                                    thumbnailStorageKey: existingImage.thumbnailStorageKey,
                                    // High quality version
                                    highQualityUrl: existingImage.highQualityUrl,
                                    highQualityCdnUrl: existingImage.highQualityCdnUrl,
                                    highQualityStorageKey: existingImage.highQualityStorageKey
                                }
                            });
                        }
                    }
                }

                // Agregar nuevas imágenes continuando el orden
                if (processedImages && processedImages.length > 0) {
                    let nextPosition = (imagesToKeep?.length || 0);

                    for (const img of processedImages) {
                        await tx.profileImage.create({
                            data: {
                                profileId,
                                position: nextPosition++, // Incrementar la posición para cada imagen
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
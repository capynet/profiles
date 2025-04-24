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
                    nationalities: {include: {nationality: true}},
                    ethnicities: {include: {ethnicity: true}},
                    services: {include: {service: true}},
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

    async createProfile(data: Prisma.ProfileCreateInput & {
        processedImages?: ProcessedImage[],
        nationality?: number,
        ethnicity?: number,
        services?: number[]
    }) {
        try {
            if (!data) {
                throw new Error('Profile data cannot be null or undefined');
            }

            // Extract the custom fields (not part of Prisma type)
            const {processedImages, nationality, ethnicity, services, ...profileData} = data;

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

                // Handle nationality if provided
                if (nationality) {
                    console.log('Adding nationality:', nationality);
                    await tx.profileNationality.create({
                        data: {
                            profileId: profile.id,
                            nationalityId: nationality
                        }
                    });
                }

                // Handle ethnicity if provided
                if (ethnicity) {
                    console.log('Adding ethnicity:', ethnicity);
                    await tx.profileEthnicity.create({
                        data: {
                            profileId: profile.id,
                            ethnicityId: ethnicity
                        }
                    });
                }
                
                // Handle services if provided
                if (services && services.length > 0) {
                    console.log('Adding services:', services.length);
                    for (const serviceId of services) {
                        await tx.profileService.create({
                            data: {
                                profileId: profile.id,
                                serviceId: serviceId
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
                        nationalities: {include: {nationality: true}},
                        ethnicities: {include: {ethnicity: true}},
                        services: {include: {service: true}},
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
        paymentMethods: { paymentMethodId: number }[],
        nationalities?: { nationalityId: number }[],
        ethnicities?: { ethnicityId: number }[],
        services?: { serviceId: number }[]
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

            // 4. Clone or update nationality
            const nationalityId = updateData.nationality
                ? Number(updateData.nationality)
                : (originalProfile.nationalities && originalProfile.nationalities.length > 0)
                    ? originalProfile.nationalities[0].nationalityId
                    : null;

            if (nationalityId) {
                await tx.profileNationality.create({
                    data: {
                        profileId: draftProfile.id,
                        nationalityId: nationalityId
                    }
                });
                console.log(`Added nationality ${nationalityId} to draft profile ${draftProfile.id}`);
            }

            // 5. Clone or update ethnicity
            const ethnicityId = updateData.ethnicity
                ? Number(updateData.ethnicity)
                : (originalProfile.ethnicities && originalProfile.ethnicities.length > 0)
                    ? originalProfile.ethnicities[0].ethnicityId
                    : null;

            if (ethnicityId) {
                await tx.profileEthnicity.create({
                    data: {
                        profileId: draftProfile.id,
                        ethnicityId: ethnicityId
                    }
                });
                console.log(`Added ethnicity ${ethnicityId} to draft profile ${draftProfile.id}`);
            }
            
            // 6. Clone or update services
            const serviceIds = updateData.services 
                ? (updateData.services instanceof Array 
                    ? updateData.services.map((id: string) => Number(id))
                    : [])
                : (originalProfile.services && originalProfile.services.length > 0)
                    ? originalProfile.services.map(s => s.serviceId)
                    : [];
                    
            if (serviceIds.length > 0) {
                for (const serviceId of serviceIds) {
                    await tx.profileService.create({
                        data: {
                            profileId: draftProfile.id,
                            serviceId: serviceId
                        }
                    });
                }
                console.log(`Added ${serviceIds.length} services to draft profile ${draftProfile.id}`);
            }

            // 6. Handle images - FIXING THE IMAGE HANDLING
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

            // 7. Return the draft profile with all relationships
            return tx.profile.findUnique({
                where: {id: draftProfile.id},
                include: {
                    languages: {include: {language: true}},
                    paymentMethods: {include: {paymentMethod: true}},
                    nationalities: {include: {nationality: true}},
                    ethnicities: {include: {ethnicity: true}},
                    services: {include: {service: true}},
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
                    paymentMethods: true,
                    nationalities: true,
                    ethnicities: true
                }
            });

            if (!draft) {
                throw new Error('Draft profile not found');
            }

            // Log the draft details for debugging
            console.log('Approving draft:', {
                id: draft.id,
                isDraft: draft.isDraft,
                originalProfileId: draft.originalProfileId
            });

            // Handle case where profile is not marked as draft
            if (!draft.isDraft) {
                console.warn(`Profile ${draftId} is not marked as a draft. Updating isDraft flag.`);
                await tx.profile.update({
                    where: {id: draftId},
                    data: {isDraft: true}
                });
            }

            // Handle case where profile doesn't have an original profile ID
            if (!draft.originalProfileId) {
                console.warn(`Draft ${draftId} has no original profile. Publishing directly.`);

                // Just publish this profile directly
                const publishedProfile = await tx.profile.update({
                    where: {id: draftId},
                    data: {
                        published: true,
                        isDraft: false
                    }
                });

                return publishedProfile;
            }

            // Regular approval process for standard drafts
            const originalProfileId = draft.originalProfileId;

            // Continue with the rest of the function...
            // Get the language, payment method, nationality, ethnicity, and service IDs from the draft
            const languageIds = draft.languages.map(l => l.languageId);
            const paymentMethodIds = draft.paymentMethods.map(pm => pm.paymentMethodId);
            const nationalityIds = draft.nationalities.map(n => n.nationalityId);
            const ethnicityIds = draft.ethnicities.map(e => e.ethnicityId);
            const serviceIds = draft.services?.map(s => s.serviceId) || [];

            // Clear existing relationships on the original profile
            await tx.profileLanguage.deleteMany({
                where: {profileId: originalProfileId}
            });

            await tx.profilePaymentMethod.deleteMany({
                where: {profileId: originalProfileId}
            });

            await tx.profileNationality.deleteMany({
                where: {profileId: originalProfileId}
            });

            await tx.profileEthnicity.deleteMany({
                where: {profileId: originalProfileId}
            });
            
            await tx.profileService.deleteMany({
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

            // Update the original profile with the draft's data
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

            // Create new language relationships
            for (const langId of languageIds) {
                await tx.profileLanguage.create({
                    data: {
                        profileId: originalProfileId,
                        languageId: langId
                    }
                });
            }

            // Create new payment method relationships
            for (const pmId of paymentMethodIds) {
                await tx.profilePaymentMethod.create({
                    data: {
                        profileId: originalProfileId,
                        paymentMethodId: pmId
                    }
                });
            }

            // Create new nationality relationships
            for (const natId of nationalityIds) {
                await tx.profileNationality.create({
                    data: {
                        profileId: originalProfileId,
                        nationalityId: natId
                    }
                });
            }

            // Create new ethnicity relationships
            for (const ethId of ethnicityIds) {
                await tx.profileEthnicity.create({
                    data: {
                        profileId: originalProfileId,
                        ethnicityId: ethId
                    }
                });
            }
            
            // Create new service relationships
            for (const svcId of serviceIds) {
                await tx.profileService.create({
                    data: {
                        profileId: originalProfileId,
                        serviceId: svcId
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

            // Delete the draft
            await tx.profile.delete({
                where: {id: draftId}
            });

            return updatedProfile;
        });
    },

    async updateProfile(profileId: number, data: Prisma.ProfileUpdateInput & {
        processedImages?: ProcessedImageWithOrder[],
        existingImagesOrder?: { key: string, order: number }[],
        images?: string | any,
        nationality?: number | null,
        ethnicity?: number | null,
        services?: number[]
    }, userContext?: { userId: string, isAdmin: boolean }) {
        try {
            // Extract the custom fields
            const {processedImages, existingImagesOrder, images, nationality, ethnicity, services, ...profileData} = data;

            // Get the profile to update
            const existingProfile = await prisma.profile.findUnique({
                where: {id: profileId},
                include: {
                    images: true,
                    languages: true,
                    paymentMethods: true,
                    nationalities: true,
                    ethnicities: true,
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
            const {languages, paymentMethods, nationalities, ethnicities, ...restProfileData} = profileData as any;

            return await prisma.$transaction(async (tx) => {
                const existingProfile = await tx.profile.findUnique({
                    where: {id: profileId},
                    include: {
                        images: true,
                        languages: true,
                        paymentMethods: true,
                        nationalities: true,
                        ethnicities: true
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

                // Handle nationality relationship
                await tx.profileNationality.deleteMany({
                    where: {profileId}
                });

                if (nationality !== null && nationality !== undefined) {
                    await tx.profileNationality.create({
                        data: {
                            profileId,
                            nationalityId: Number(nationality)
                        }
                    });
                    console.log(`Updated nationality for profile ${profileId} to ${nationality}`);
                }

                // Handle ethnicity relationship
                await tx.profileEthnicity.deleteMany({
                    where: {profileId}
                });

                if (ethnicity !== null && ethnicity !== undefined) {
                    await tx.profileEthnicity.create({
                        data: {
                            profileId,
                            ethnicityId: Number(ethnicity)
                        }
                    });
                    console.log(`Updated ethnicity for profile ${profileId} to ${ethnicity}`);
                }
                
                // Handle services relationship
                await tx.profileService.deleteMany({
                    where: {profileId}
                });
                
                if (services && services.length > 0) {
                    console.log(`Updating services for profile ${profileId}: ${services.join(', ')}`);
                    for (const serviceId of services) {
                        await tx.profileService.create({
                            data: {
                                profileId,
                                serviceId: Number(serviceId)
                            }
                        });
                    }
                    console.log(`Successfully updated services for profile ${profileId}`);
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
                        nationalities: {include: {nationality: true}},
                        ethnicities: {include: {ethnicity: true}},
                        services: {include: {service: true}},
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
    },

    async getAllNationalities() {
        try {
            return await prisma.nationality.findMany({
                select: {id: true, name: true},
                orderBy: {name: Prisma.SortOrder.asc}
            });
        } catch (error) {
            console.error('Error fetching nationalities:', error);
            return [];
        }
    },

    async getAllEthnicities() {
        try {
            return await prisma.ethnicity.findMany({
                select: {id: true, name: true},
                orderBy: {name: Prisma.SortOrder.asc}
            });
        } catch (error) {
            console.error('Error fetching ethnicities:', error);
            return [];
        }
    },
    
    async getAllServices() {
        try {
            return await prisma.service.findMany({
                select: {id: true, name: true},
                orderBy: {name: Prisma.SortOrder.asc}
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            return [];
        }
    }
};
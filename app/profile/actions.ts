// app/profile/actions.ts
'use server';

import {revalidatePath} from 'next/cache';
import {DataService} from '@/services/dataService';
import {ImageService} from '@/services/imageService';
import {auth} from '@/auth';
import {prisma} from '@/prisma';

type ValidationError = {
    path: string[];
    message: string;
    code: string;
};

export type ValidationResult = {
    success: boolean;
    errors?: Record<string, string[]>;
};

interface ServiceError extends Error {
    errors?: ValidationError[];
    message: string;
}

function validateFormData(formData: FormData): ValidationResult {
    const errors: Record<string, string[]> = {};

    // Validate required fields
    const requiredFields = ['name', 'description', 'address'];
    requiredFields.forEach(field => {
        if (!formData.get(field)) {
            errors[field] = [`${field} is required`];
        }
    });

    // Validate price
    const price = formData.get('price');
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
        errors.price = ['Price must be a valid positive number'];
    }

    // Validate age
    const age = formData.get('age');
    if (!age || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        errors.age = ['Age must be between 18 and 100'];
    }

    // Validate coordinates
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');

    if (!latitude || isNaN(Number(latitude))) {
        errors.latitude = ['Latitude must be a valid number'];
    }

    if (!longitude || isNaN(Number(longitude))) {
        errors.longitude = ['Longitude must be a valid number'];
    }

    return {
        success: Object.keys(errors).length === 0,
        errors: Object.keys(errors).length > 0 ? errors : undefined
    };
}

export async function createProfile(formData: FormData): Promise<ValidationResult> {
    console.log('createProfile action started');

    const session = await auth();
    if (!session || !session.user) {
        console.log('No session found, user not authenticated');
        return {
            success: false,
            errors: {auth: ['User not authenticated']}
        };
    }

    // Check if this is an admin creating a profile for another user
    const adminProvidedUserId = formData.get('userId') as string;
    let targetUserId = session.user.id;

    // If an admin is creating a profile for another user
    if (adminProvidedUserId && session.user.role === 'admin' && adminProvidedUserId !== session.user.id) {
        targetUserId = adminProvidedUserId;
    } else {
    }

    // Validate form data
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
        console.log('Form validation failed:', validationResult.errors);
        return validationResult;
    }

    console.log('Form validation passed');

    try {
        // Convert language and payment IDs to numbers
        const languageIds = formData.getAll('languages').map(id => Number(id));
        const paymentMethodIds = formData.getAll('paymentMethods').map(id => Number(id));

        // Get nationality and ethnicity IDs if present (single values)
        const nationalityId = formData.get('nationality') ? Number(formData.get('nationality')) : null;
        const ethnicityId = formData.get('ethnicity') ? Number(formData.get('ethnicity')) : null;

        // Process and upload images
        const imageFiles = formData.getAll('images') as File[];
        const processedImages = [];

        for (const imageFile of imageFiles) {
            // Skip empty file inputs
            if (!(imageFile instanceof File) || imageFile.size === 0) {
                console.log('Skipping empty file input');
                continue;
            }

            // Convert File to Buffer for processing
            const buffer = Buffer.from(await imageFile.arrayBuffer());

            // Process and upload image
            console.log('Uploading image to storage...');
            const imageData = await ImageService.processAndUploadImage(buffer);
            console.log('Image processed, got URLs:', {
                medium: imageData.mediumUrl,
                thumbnail: imageData.thumbnailUrl,
                highQuality: imageData.highQualityUrl
            });

            processedImages.push(imageData);
        }

        // Check if user is admin for controlling published state
        const isAdmin = session.user.role === 'admin';
        const publishedValue = isAdmin ? formData.get('published') === 'true' : false;

        // Set isDraft based on user role - non-admins create drafts by default
        const isDraftValue = !isAdmin;

        // Prepare data for profile creation
        const profileData = {
            userId: targetUserId,
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            published: publishedValue,
            isDraft: isDraftValue, // Add isDraft field
            languages: {
                connect: languageIds.map(id => ({id}))
            },
            paymentMethods: {
                connect: paymentMethodIds.map(id => ({id}))
            },
            // Pass nationality directly as a parameter
            nationality: nationalityId,
            // Pass ethnicity directly as a parameter
            ethnicity: ethnicityId,
            processedImages: processedImages.length > 0 ? processedImages : undefined
        };

        await DataService.createProfile(profileData);

        revalidatePath('/profile');
        revalidatePath('/admin');
        return {success: true};
    } catch (error: unknown) {
        console.error('Error in createProfile action:', error);

        const serviceError = error as ServiceError;

        if (serviceError.message?.includes('Validation error') && serviceError.errors) {
            const errors: Record<string, string[]> = {};

            serviceError.errors.forEach(err => {
                const field = err.path[0];
                if (!errors[field]) {
                    errors[field] = [];
                }
                errors[field].push(err.message);
            });

            return {success: false, errors};
        }

        return {
            success: false,
            errors: {
                form: [`An unexpected error occurred: ${serviceError?.message || 'Unknown error'}`]
            }
        };
    }
}

export async function updateProfile(profileId: number, formData: FormData): Promise<ValidationResult> {
    const session = await auth();

    if (!session || !session.user) {
        return {
            success: false,
            errors: {auth: ['User not authenticated']}
        };
    }

    // Get the profile to check ownership
    const profile = await prisma.profile.findUnique({
        where: {id: profileId},
        select: {userId: true, published: true}
    });

    if (!profile) {
        return {
            success: false,
            errors: {profile: ['Profile not found']}
        };
    }

    // Check if user has permission to edit this profile
    const isOwner = profile.userId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return {
            success: false,
            errors: {auth: ['You do not have permission to edit this profile']}
        };
    }

    // Validate form data
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
        return validationResult;
    }

    try {
        // Log all form data to inspect what we're receiving
        console.log('FORM DATA RECEIVED:', Array.from(formData.entries()).map(([k, v]) => {
            if (v instanceof File) return [k, `File: ${v.name}`];
            return [k, v];
        }));

        // Convert IDs to numbers
        const languageIds = formData.getAll('languages').map(id => Number(id));
        const paymentMethodIds = formData.getAll('paymentMethods').map(id => Number(id));

        // Get nationality and ethnicity IDs if present (single values)
        const nationalityId = formData.get('nationality') ? Number(formData.get('nationality')) : null;
        const ethnicityId = formData.get('ethnicity') ? Number(formData.get('ethnicity')) : null;

        let imageOrderData: { type: string, id: string | number, position: number }[] = [];
        const orderDataRaw = formData.get('imageOrderData');

        if (orderDataRaw) {
            try {
                imageOrderData = JSON.parse(orderDataRaw as string);
            } catch (error) {
                console.error('Error parsing image order data:', error);
            }
        }

        // Get the order of all images (both existing and new)
        // Store the order index with each storage key for existing images
        const existingImagesOrder: { key: string, order: number }[] = [];

        const orderedImageKeys = formData.getAll('existingImages');

        if (imageOrderData.length > 0) {
            const existingImagesInOrder = imageOrderData
                .filter(item => item.type === 'existing')
                .sort((a, b) => a.position - b.position);

            existingImagesInOrder.forEach(item => {
                existingImagesOrder.push({
                    key: item.id as string,
                    order: item.position
                });
            });
        } else {
            // Fallback.
            orderedImageKeys.forEach((key, index) => {
                existingImagesOrder.push({
                    key: key.toString(),
                    order: index
                });
            });
        }

        // Process and upload new images
        const imageFiles = formData.getAll('images') as File[];
        const imagePositions = formData.getAll('imagePositions').map(pos => Number(pos));
        const processedImages = [];

        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            const position = imagePositions[i] !== undefined ? imagePositions[i] : i;

            // Skip empty file inputs
            if (!(imageFile instanceof File) || imageFile.size === 0) continue;

            // Convert File to Buffer for processing
            const buffer = Buffer.from(await imageFile.arrayBuffer());

            // Process and upload image
            const imageData = await ImageService.processAndUploadImage(buffer);

            // Add the position for this new image
            processedImages.push({
                ...imageData,
                order: position
            });
        }

        // Handle published state
        // Only admins can change published status, otherwise keep existing value
        let publishedValue: boolean;

        if (isAdmin) {
            // Admins can change the published status
            publishedValue = formData.get('published') === 'true';
            console.log('Admin setting published value:', publishedValue);
        } else {
            // Non-admins keep the existing value
            publishedValue = profile.published;
        }

        // Prepare data for profile update
        const profileData = {
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            published: publishedValue,
            languages: {
                connect: languageIds.map(id => ({id}))
            },
            paymentMethods: {
                connect: paymentMethodIds.map(id => ({id}))
            },
            // Pass nationality directly as a parameter
            nationality: nationalityId,
            // Pass ethnicity directly as a parameter
            ethnicity: ethnicityId,
            // Pass processed images and images to keep to the service,
            // now with order information
            processedImages: processedImages.length > 0 ? processedImages : undefined,
            existingImagesOrder: existingImagesOrder,
            // Add the images flag to indicate explicit interaction with images
            images: formData.get('images')
        };

        // Pasar el contexto del usuario para que DataService sepa que es un admin
        await DataService.updateProfile(profileId, profileData, {
            userId: session.user.id,
            isAdmin: session.user.role === 'admin'
        });

        // Revalidate multiple paths to ensure fresh data
        revalidatePath('/profile');
        revalidatePath('/profile/edit');
        revalidatePath(`/profile/${profileId}`);
        revalidatePath('/admin');

        return {success: true};
    } catch (error: unknown) {
        console.error('Error updating profile:', error);

        const serviceError = error as ServiceError;

        if (serviceError.message?.includes('Validation error') && serviceError.errors) {
            const errors: Record<string, string[]> = {};

            serviceError.errors.forEach(err => {
                const field = err.path[0];
                if (!errors[field]) {
                    errors[field] = [];
                }
                errors[field].push(err.message);
            });

            return {success: false, errors};
        }

        return {
            success: false,
            errors: {
                form: ['An unexpected error occurred. Please try again.']
            }
        };
    }
}
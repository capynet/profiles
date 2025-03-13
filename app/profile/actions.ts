// app/profile/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { DataService } from '@/services/dataService';
import { ImageService } from '@/services/imageService';
import { auth } from '@/auth';

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
    if (!session  || !session.user) {
        console.log('No session found, user not authenticated');
        return {
            success: false,
            errors: { auth: ['User not authenticated'] }
        };
    }

    console.log('User authenticated:', session.user.id);

    // Validate form data
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
        console.log('Form validation failed:', validationResult.errors);
        return validationResult;
    }

    console.log('Form validation passed');

    try {
        // Log all form data keys to see what's available
        console.log('Form data keys:', Array.from(formData.keys()));
        console.log('FORM DATA RECEIVED:', Object.fromEntries(formData.entries()));

        // Convert language and payment IDs to numbers
        const languageIds = formData.getAll('languages').map(id => Number(id));
        const paymentMethodIds = formData.getAll('paymentMethods').map(id => Number(id));

        console.log('Selected languages:', languageIds);
        console.log('Selected payment methods:', paymentMethodIds);

        // Process and upload images
        const imageFiles = formData.getAll('images') as File[];
        console.log('Image files count:', imageFiles.length);

        // Para verificar si están llegando los archivos correctos
        if (imageFiles.length > 0) {
            console.log('New images details:', imageFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type
            })));
        }

        const processedImages = [];

        for (const imageFile of imageFiles) {
            // Skip empty file inputs
            if (!(imageFile instanceof File) || imageFile.size === 0) {
                console.log('Skipping empty file input');
                continue;
            }

            console.log('Processing image:', imageFile.name, 'size:', imageFile.size);

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

        console.log('Total processed images:', processedImages.length);

        // Prepare data for profile creation
        const profileData = {
            userId: session.user.id,
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            languages: {
                connect: languageIds.map(id => ({ id }))
            },
            paymentMethods: {
                connect: paymentMethodIds.map(id => ({ id }))
            },
            // Pass processed images to the service
            processedImages: processedImages.length > 0 ? processedImages : undefined
        };

        console.log('Profile data prepared:', {
            userId: profileData.userId,
            name: profileData.name,
            price: profileData.price,
            age: profileData.age,
            hasLanguages: languageIds.length > 0,
            hasPaymentMethods: paymentMethodIds.length > 0,
            hasImages: processedImages.length > 0
        });

        console.log('Calling DataService.createProfile...');
        const result = await DataService.createProfile(profileData);
        console.log('Profile created successfully, ID:', result?.id);

        revalidatePath('/profile');
        return { success: true };
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

            return { success: false, errors };
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
    console.log('updateProfile action started for profile ID:', profileId);

    const session = await auth();
    if (!session) {
        return {
            success: false,
            errors: { auth: ['User not authenticated'] }
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

        console.log('Selected languages:', languageIds);
        console.log('Selected payment methods:', paymentMethodIds);

        let imageOrderData: {type: string, id: string | number, position: number}[] = [];
        const orderDataRaw = formData.get('imageOrderData');

        if (orderDataRaw) {
            try {
                imageOrderData = JSON.parse(orderDataRaw as string);
                console.log('Datos de orden de imágenes recibidos:', imageOrderData);
            } catch (error) {
                console.error('Error parsing image order data:', error);
            }
        }

        // Get the order of all images (both existing and new)
        // Store the order index with each storage key for existing images
        const existingImagesOrder: { key: string, order: number }[] = [];

        const orderedImageKeys = formData.getAll('existingImages');
        console.log('Ordered image keys from form (ORDEN REAL):', orderedImageKeys);

        if (imageOrderData.length > 0) {
            const existingImagesInOrder = imageOrderData
                .filter(item => item.type === 'existing')
                .sort((a, b) => a.position - b.position);

            existingImagesInOrder.forEach(item => {
                existingImagesOrder.push({
                    key: item.id as string,
                    order: item.position // Usar la posición absoluta
                });
            });
        } else {
            // Fallback al comportamiento anterior
            orderedImageKeys.forEach((key, index) => {
                existingImagesOrder.push({
                    key: key.toString(),
                    order: index
                });
            });
        }

        console.log('Existing images with order (ESTO ES LO QUE SE PROCESA):', existingImagesOrder);

        // Process and upload new images
        const imageFiles = formData.getAll('images') as File[];
        const imagePositions = formData.getAll('imagePositions').map(pos => Number(pos));

        console.log('New image files count (NUEVAS IMÁGENES):', imageFiles.length);
        console.log('Image positions:', imagePositions);

        if (imageFiles.length > 0) {
            console.log('New images details:', imageFiles.map((file, idx) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                position: imagePositions[idx] || idx
            })));
        }

        const processedImages = [];

        for (let i = 0; i < imageFiles.length; i++) {
            const imageFile = imageFiles[i];
            const position = imagePositions[i] !== undefined ? imagePositions[i] : i;

            // Skip empty file inputs
            if (!(imageFile instanceof File) || imageFile.size === 0) continue;

            console.log(`Processing new image ${i}: ${imageFile.name}, size: ${imageFile.size}, position: ${position}`);

            // Convert File to Buffer for processing
            const buffer = Buffer.from(await imageFile.arrayBuffer());

            // Process and upload image
            const imageData = await ImageService.processAndUploadImage(buffer);
            console.log(`Image ${i} processed, got URLs:`, {
                medium: imageData.mediumUrl,
                thumbnail: imageData.thumbnailUrl,
                highQuality: imageData.highQualityUrl
            });

            // Add the position for this new image
            processedImages.push({
                ...imageData,
                order: position
            });
        }

        console.log('Processed images with order:', processedImages.map(img => ({
            url: img.mediumUrl,
            order: img.order
        })));

        // Prepare data for profile update
        const profileData = {
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            languages: {
                connect: languageIds.map(id => ({ id }))
            },
            paymentMethods: {
                connect: paymentMethodIds.map(id => ({ id }))
            },
            // Pass processed images and images to keep to the service,
            // now with order information
            processedImages: processedImages.length > 0 ? processedImages : undefined,
            existingImagesOrder: existingImagesOrder
        };

        console.log('Profile data prepared for update:', {
            name: profileData.name,
            hasLanguages: languageIds.length > 0,
            hasPaymentMethods: paymentMethodIds.length > 0,
            existingImagesCount: existingImagesOrder.length,
            newImagesCount: processedImages.length
        });

        console.log('Calling DataService.updateProfile...');
        await DataService.updateProfile(profileId, profileData);
        console.log('Profile updated successfully');

        // Revalidate multiple paths to ensure fresh data
        revalidatePath('/profile');
        revalidatePath('/profile/edit');
        revalidatePath(`/profile/${profileId}`);

        return { success: true };
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

            return { success: false, errors };
        }

        return {
            success: false,
            errors: {
                form: ['An unexpected error occurred. Please try again.']
            }
        };
    }
}
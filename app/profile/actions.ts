'use server';

import { revalidatePath } from 'next/cache';
import { DataService } from '@/services/dataService';
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

function validateFormData(formData: FormData): ValidationResult {
    const errors: Record<string, string[]> = {};

    // Validar campos obligatorios
    const requiredFields = ['name', 'description', 'address'];
    requiredFields.forEach(field => {
        if (!formData.get(field)) {
            errors[field] = [`${field} is required`];
        }
    });

    // Validar precio
    const price = formData.get('price');
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
        errors.price = ['Price must be a valid positive number'];
    }

    // Validar edad
    const age = formData.get('age');
    if (!age || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
        errors.age = ['Age must be between 18 and 100'];
    }

    // Validar coordenadas
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
    const session = await auth();
    if (!session) {
        return {
            success: false,
            errors: { auth: ['User not authenticated'] }
        };
    }

    // Validar datos del formulario
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
        return validationResult;
    }

    try {
        // Convertir los IDs de languages y paymentMethods a números
        const languageIds = formData.getAll('languages').map(id => Number(id));
        const paymentMethodIds = formData.getAll('paymentMethods').map(id => Number(id));

        // Preparar datos para la creación del perfil
        const data = {
            userId: session.user.id,
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            image: (formData.get('image') as string) || null,
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            languages: {
                connect: languageIds.map(id => ({ id }))
            },
            paymentMethods: {
                connect: paymentMethodIds.map(id => ({ id }))
            }
        };

        await DataService.createProfile(data);

        revalidatePath('/profile');

        return { success: true };
    } catch (error: any) {
        console.error('Error creating profile:', error);

        if (error.message.includes('Validation error')) {
            const errors: Record<string, string[]> = {};
            const validationErrors = error.errors as ValidationError[];

            validationErrors.forEach(err => {
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

export async function updateProfile(profileId: number, formData: FormData): Promise<ValidationResult> {
    const session = await auth();
    if (!session) {
        return {
            success: false,
            errors: { auth: ['User not authenticated'] }
        };
    }

    // Validar datos del formulario
    const validationResult = validateFormData(formData);
    if (!validationResult.success) {
        return validationResult;
    }

    try {
        // Convertir los IDs de languages y paymentMethods a números
        const languageIds = formData.getAll('languages').map(id => Number(id));
        const paymentMethodIds = formData.getAll('paymentMethods').map(id => Number(id));

        // Preparar datos para la actualización del perfil
        const data = {
            name: formData.get('name') as string,
            price: Number(formData.get('price')),
            age: Number(formData.get('age')),
            image: (formData.get('image') as string) || null,
            description: formData.get('description') as string,
            latitude: Number(formData.get('latitude')),
            longitude: Number(formData.get('longitude')),
            address: formData.get('address') as string,
            languages: {
                // Formato correcto para Prisma
                connect: languageIds.map(id => ({ id }))
            },
            paymentMethods: {
                // Formato correcto para Prisma
                connect: paymentMethodIds.map(id => ({ id }))
            }
        };

        await DataService.updateProfile(profileId, data);

        revalidatePath('/profile');

        return { success: true };
    } catch (error: any) {
        console.error('Error updating profile:', error);

        if (error.message.includes('Validation error')) {
            const errors: Record<string, string[]> = {};
            const validationErrors = error.errors as ValidationError[];

            validationErrors.forEach(err => {
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
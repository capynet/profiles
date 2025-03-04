'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@prisma/client';
import { createProfile, updateProfile } from '@/app/profile/actions';

type Language = {
    id: number;
    name: string;
};

type PaymentMethod = {
    id: number;
    name: string;
};

type ProfileFormWithActionsProps = {
    profile?: Profile & {
        paymentMethods: { paymentMethodId: number }[];
        languages: { languageId: number }[];
    };
    isEditing?: boolean;
};

export default function ProfileFormWithActions({
                                                   profile,
                                                   isEditing = false
                                               }: ProfileFormWithActionsProps) {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [langResponse, pmResponse] = await Promise.all([
                    fetch('/api/languages'),
                    fetch('/api/payment-methods')
                ]);

                if (!langResponse.ok || !pmResponse.ok) {
                    throw new Error('Failed to fetch data');
                }

                const fetchedLanguages = await langResponse.json();
                const fetchedPaymentMethods = await pmResponse.json();

                setLanguages(fetchedLanguages);
                setPaymentMethods(fetchedPaymentMethods);

                // Set default selected values if profile exists
                if (profile) {
                    setSelectedLanguages(profile.languages.map(l => l.languageId));
                    setSelectedPaymentMethods(profile.paymentMethods.map(pm => pm.paymentMethodId));
                }
            } catch (error) {
                console.error('Error fetching form data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [profile]);

    const handleLanguageChange = (languageId: number) => {
        setSelectedLanguages(prev =>
            prev.includes(languageId)
                ? prev.filter(id => id !== languageId)
                : [...prev, languageId]
        );
    };

    const handlePaymentMethodChange = (paymentMethodId: number) => {
        setSelectedPaymentMethods(prev =>
            prev.includes(paymentMethodId)
                ? prev.filter(id => id !== paymentMethodId)
                : [...prev, paymentMethodId]
        );
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setErrors({});

        // Create a new FormData object to add our selected values
        const updatedFormData = new FormData();

        // Copy existing form data
        for (const [key, value] of formData.entries()) {
            if (key !== 'languages' && key !== 'paymentMethods') {
                updatedFormData.append(key, value);
            }
        }

        // Add selected languages - converting to numbers
        selectedLanguages.forEach(languageId => {
            // Asegurarse de que el ID se envía como número
            updatedFormData.append('languages', languageId);
        });

        // Add selected payment methods - converting to numbers
        selectedPaymentMethods.forEach(paymentMethodId => {
            // Asegurarse de que el ID se envía como número
            updatedFormData.append('paymentMethods', paymentMethodId);
        });

        try {
            if (isEditing && profile) {
                const result = await updateProfile(profile.id, updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                }
            } else {
                const result = await createProfile(updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                }
            }
        } catch (error) {
            console.error('Error processing form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900";
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-gray-600">Loading form data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-8 py-6 bg-indigo-50 border-b border-indigo-100">
                <h1 className="text-2xl font-bold text-indigo-800">
                    {isEditing ? 'Editing your profile' : 'Creating your profile'}
                </h1>
            </div>

            <form action={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={profile?.name || ''}
                            className={inputClassName}
                            placeholder="Ex: John Doe"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600 font-medium">{errors.name[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">€</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                defaultValue={profile?.price || 0}
                                className={`${inputClassName} pl-7`}
                                placeholder="0.00"
                            />
                        </div>
                        {errors.price && <p className="mt-1 text-sm text-red-600 font-medium">{errors.price[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Age</label>
                        <input
                            type="number"
                            name="age"
                            defaultValue={profile?.age || 18}
                            className={inputClassName}
                            min="18"
                            max="100"
                        />
                        {errors.age && <p className="mt-1 text-sm text-red-600 font-medium">{errors.age[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Image (URL)</label>
                        <input
                            type="text"
                            name="image"
                            defaultValue={profile?.image || ''}
                            className={inputClassName}
                            placeholder="https://example.com/image.jpg"
                        />
                        {errors.image && <p className="mt-1 text-sm text-red-600 font-medium">{errors.image[0]}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={4}
                            name="description"
                            defaultValue={profile?.description || ''}
                            className={`${inputClassName} resize-none`}
                            placeholder="Describe your experience, specialties and services you offer..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600 font-medium">{errors.description[0]}</p>}
                    </div>

                    <div className="pt-4 md:col-span-2">
                        <div className="flex items-center">
                            <div className="flex-grow h-px bg-gray-200"></div>
                            <span className="px-3 text-sm font-medium text-gray-500">Location</span>
                            <div className="flex-grow h-px bg-gray-200"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Latitude</label>
                        <input
                            type="number"
                            step="any"
                            name="latitude"
                            defaultValue={profile?.latitude || 0}
                            className={inputClassName}
                            placeholder="40.4168"
                        />
                        {errors.latitude && <p className="mt-1 text-sm text-red-600 font-medium">{errors.latitude[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Longitude</label>
                        <input
                            type="number"
                            step="any"
                            name="longitude"
                            defaultValue={profile?.longitude || 0}
                            className={inputClassName}
                            placeholder="-3.7038"
                        />
                        {errors.longitude && <p className="mt-1 text-sm text-red-600 font-medium">{errors.longitude[0]}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                            type="text"
                            name="address"
                            defaultValue={profile?.address || ''}
                            className={inputClassName}
                            placeholder="Street, number, postal code, city"
                        />
                        {errors.address && <p className="mt-1 text-sm text-red-600 font-medium">{errors.address[0]}</p>}
                    </div>

                    <div className="pt-4 md:col-span-2">
                        <div className="flex items-center">
                            <div className="flex-grow h-px bg-gray-200"></div>
                            <span className="px-3 text-sm font-medium text-gray-500">Additional Information</span>
                            <div className="flex-grow h-px bg-gray-200"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md">
                            {paymentMethods.length > 0 ? (
                                paymentMethods.map(method => (
                                    <div key={method.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`payment-method-${method.id}`}
                                            checked={selectedPaymentMethods.includes(method.id)}
                                            onChange={() => handlePaymentMethodChange(method.id)}
                                            className={checkboxClassName}
                                        />
                                        <label htmlFor={`payment-method-${method.id}`} className="ml-2 text-sm text-gray-700">
                                            {method.name}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 col-span-2 py-2">No payment methods available</div>
                            )}
                        </div>
                        {errors.paymentMethods && <p className="mt-1 text-sm text-red-600 font-medium">{errors.paymentMethods[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md">
                            {languages.length > 0 ? (
                                languages.map(language => (
                                    <div key={language.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`language-${language.id}`}
                                            checked={selectedLanguages.includes(language.id)}
                                            onChange={() => handleLanguageChange(language.id)}
                                            className={checkboxClassName}
                                        />
                                        <label htmlFor={`language-${language.id}`} className="ml-2 text-sm text-gray-700">
                                            {language.name}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 col-span-2 py-2">No languages available</div>
                            )}
                        </div>
                        {errors.languages && <p className="mt-1 text-sm text-red-600 font-medium">{errors.languages[0]}</p>}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            isEditing ? 'Update' : 'Create'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
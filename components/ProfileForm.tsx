'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import Image from 'next/image';
import {Profile, ProfileImage} from '@prisma/client';
import {createProfile, updateProfile} from '@/app/profile/actions';

type ProfileWithRelations = Profile & {
    paymentMethods: { paymentMethodId: number }[];
    languages: { languageId: number }[];
    images: ProfileImage[];
};

type ProfileFormProps = {
    profile?: ProfileWithRelations;
    isEditing?: boolean;
};

export default function ProfileForm({profile, isEditing = false}: ProfileFormProps) {
    const [languages, setLanguages] = useState<{ id: number; name: string }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Image state
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ProfileImage[]>([]);

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
                    setExistingImages(profile.images || []);
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

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const newFiles = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...newFiles]);

        // Create preview URLs for the selected files
        newFiles.forEach(file => {
            const fileUrl = URL.createObjectURL(file);
            setPreviewUrls(prev => [...prev, fileUrl]);
        });
    };

    // Remove a selected file
    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => {
            const updatedFiles = [...prev];
            updatedFiles.splice(index, 1);
            return updatedFiles;
        });

        setPreviewUrls(prev => {
            const updatedUrls = [...prev];
            URL.revokeObjectURL(updatedUrls[index]); // Free up memory
            updatedUrls.splice(index, 1);
            return updatedUrls;
        });
    };

    // Remove an existing image
    const removeExistingImage = (imageId: number) => {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setErrors({});

        // Create a new FormData object to add our selected values
        const updatedFormData = new FormData();

        // Copy existing form data
        for (const [key, value] of formData.entries()) {
            if (key !== 'languages' && key !== 'paymentMethods' && key !== 'images') {
                updatedFormData.append(key, value);
            }
        }

        // Add selected languages
        selectedLanguages.forEach(languageId => {
            updatedFormData.append('languages', languageId.toString());
        });

        // Add selected payment methods
        selectedPaymentMethods.forEach(paymentMethodId => {
            updatedFormData.append('paymentMethods', paymentMethodId.toString());
        });

        // Add image files
        selectedFiles.forEach(file => {
            updatedFormData.append('images', file);
        });

        // Add existing images storage keys
        existingImages.forEach(image => {
            updatedFormData.append('existingImages', image.mediumStorageKey);
        });

        try {
            if (isEditing && profile) {
                const result = await updateProfile(profile.id, updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                } else {
                    router.push('/profile');
                }
            } else {
                const result = await createProfile(updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                } else {
                    router.push('/profile');
                }
            }
        } catch (error) {
            console.error('Error processing form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Loading form data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <form action={handleSubmit} className="p-6">
                <div className="md:col-span-2 mt-4">
                    <button
                        type="button"
                        onClick={() => {
                            // Rellenar campos básicos
                            const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                            const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement;
                            const ageInput = document.querySelector('input[name="age"]') as HTMLInputElement;
                            const descriptionInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
                            const latitudeInput = document.querySelector('input[name="latitude"]') as HTMLInputElement;
                            const longitudeInput = document.querySelector('input[name="longitude"]') as HTMLInputElement;
                            const addressInput = document.querySelector('input[name="address"]') as HTMLInputElement;

                            if (nameInput) nameInput.value = 'Test User';
                            if (priceInput) priceInput.value = '50.00';
                            if (ageInput) ageInput.value = '30';
                            if (descriptionInput) descriptionInput.value = 'This is a test profile description with some sample text for testing purposes.';
                            if (latitudeInput) latitudeInput.value = '40.4168';
                            if (longitudeInput) longitudeInput.value = '-3.7038';
                            if (addressInput) addressInput.value = '123 Test Street, 28001, Madrid';

                            // Seleccionar algunos Payment methods y lenguajes aleatoriamente
                            if (paymentMethods.length > 0) {
                                const randomPaymentMethods = paymentMethods
                                    .slice(0, Math.min(2, paymentMethods.length))
                                    .map(pm => pm.id);
                                setSelectedPaymentMethods(randomPaymentMethods);
                            }

                            if (languages.length > 0) {
                                const randomLanguages = languages
                                    .slice(0, Math.min(3, languages.length))
                                    .map(lang => lang.id);
                                setSelectedLanguages(randomLanguages);
                            }
                        }}
                        className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 mb-6"
                    >
                        Fill Test Data
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Age</label>
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

                    {/* Multiple image upload field */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Images</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className={inputClassName}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Images will be converted to WebP, resized to 352x576px (9:16 ratio), and stored in Google Cloud Storage.
                        </p>
                        {errors.images && <p className="mt-1 text-sm text-red-600 font-medium">{errors.images[0]}</p>}
                    </div>

                    {/* Preview of selected files */}
                    {previewUrls.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Images Preview</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {previewUrls.map((url, index) => (
                                    <div key={`new-${index}`} className="relative aspect-[9/16] w-28 rounded-md overflow-hidden">
                                        <div className="h-full w-full relative">
                                            <Image
                                                src={url}
                                                alt={`New image ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 112px"
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSelectedFile(index)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-10"
                                            aria-label="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Display existing images */}
                    {existingImages.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Images</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                                {existingImages.map((image) => (
                                    <div key={`existing-${image.id}`} className="relative aspect-[9/16] w-28 rounded-md overflow-hidden">
                                        <div className="h-full w-full relative">
                                            <Image
                                                src={image.mediumUrl}
                                                alt={`Profile image ${image.id}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 112px"
                                                className="object-cover"
                                                priority
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(image.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-10"
                                            aria-label="Remove image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
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
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                            <span className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Location</span>
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Latitude</label>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Longitude</label>
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
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
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                            <span className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</span>
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Methods</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
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
                                        <label htmlFor={`payment-method-${method.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            {method.name}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">No payment methods available</div>
                            )}
                        </div>
                        {errors.paymentMethods && <p className="mt-1 text-sm text-red-600 font-medium">{errors.paymentMethods[0]}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Languages</label>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-md">
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
                                        <label htmlFor={`language-${language.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                            {language.name}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2 py-2">No languages available</div>
                            )}
                        </div>
                        {errors.languages && <p className="mt-1 text-sm text-red-600 font-medium">{errors.languages[0]}</p>}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
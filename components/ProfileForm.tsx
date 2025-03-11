'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Profile, ProfileImage } from '@prisma/client';
import { createProfile, updateProfile } from '@/app/profile/actions';
import ImageCropModal from './ImageCropModal';
import SortableImageGallery from './SortableImageGallery';

// Define interfaces outside the component
interface ImageToProcess {
    id: string;
    file: File;
    url: string;
    processed: boolean;
}

type ProfileWithRelations = Profile & {
    paymentMethods: { paymentMethodId: number }[];
    languages: { languageId: number }[];
    images: ProfileImage[];
};

type ProfileFormProps = {
    profile?: ProfileWithRelations;
    isEditing?: boolean;
};

export default function ProfileForm({ profile, isEditing = false }: ProfileFormProps) {
    const router = useRouter();

    // Form data states
    const [languages, setLanguages] = useState<{ id: number; name: string }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ id: number; name: string }[]>([]);
    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);

    // UI control states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [cropModalOpen, setCropModalOpen] = useState(false);

    // Image states
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<ProfileImage[]>([]);
    const [imagesToProcess, setImagesToProcess] = useState<ImageToProcess[]>([]);

    // Image ordering states
    const [newImageItems, setNewImageItems] = useState<{id: string, url: string}[]>([]);
    const [existingImageItems, setExistingImageItems] = useState<{id: number, url: string}[]>([]);

    // Initialize form data on load
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

    // Initialize existingImageItems from existingImages
    useEffect(() => {
        if (existingImages.length > 0) {
            const items = existingImages.map(img => ({
                id: img.id,
                url: img.mediumUrl
            }));
            setExistingImageItems(items);
        } else {
            setExistingImageItems([]);
        }
    }, [existingImages]);

    // Initialize newImageItems from previewUrls
    useEffect(() => {
        if (previewUrls.length > 0) {
            const items = previewUrls.map((url, index) => ({
                id: `new-${index}`,
                url: url
            }));
            setNewImageItems(items);
        } else {
            setNewImageItems([]);
        }
    }, [previewUrls]);

    // Form input handlers
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

    // Image handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const newFiles = Array.from(e.target.files);

        // Create image processing objects with unique IDs
        const newImagesToProcess = newFiles.map(file => ({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            url: URL.createObjectURL(file),
            processed: false
        }));

        // Replace the list of images to process with only the new images
        // This ensures only new images appear in the crop modal
        // while preserving previously cropped images in selectedFiles and previewUrls
        setImagesToProcess(newImagesToProcess);

        // Open the crop modal
        setCropModalOpen(true);
    };

    // Handle crop completion for a specific image
    const handleCropComplete = useCallback((croppedBlob: Blob, imageId: string) => {
        // Create a File from the cropped Blob
        const croppedFile = new File(
            [croppedBlob],
            `cropped-image-${Date.now()}.jpg`,
            { type: 'image/jpeg' }
        );

        // Add the cropped file to selectedFiles (maintaining previously selected files)
        setSelectedFiles(prev => [...prev, croppedFile]);

        // Create preview URL for the cropped image
        const previewUrl = URL.createObjectURL(croppedBlob);
        setPreviewUrls(prev => [...prev, previewUrl]);

        // Mark this image as processed
        setImagesToProcess(prev =>
            prev.map(img =>
                img.id === imageId
                    ? { ...img, processed: true }
                    : img
            )
        );
    }, []);

    // Handle closing the crop modal
    const handleCloseCropModal = useCallback(() => {
        // Check if there are any unprocessed images
        const hasUnprocessedImages = imagesToProcess.some(img => !img.processed);

        if (hasUnprocessedImages) {
            // Confirm before closing if there are unprocessed images
            if (window.confirm('You have unprocessed images. Are you sure you want to close?')) {
                // Close modal and clean up
                cleanupAndCloseCropModal();
            }
        } else {
            // If all images are processed, just close
            cleanupAndCloseCropModal();
        }

        // We want to keep processed images in the form,
        // so we only clear the imagesToProcess list for the next batch
        setImagesToProcess([]);
    }, [imagesToProcess]);

    // Helper function to clean up URLs and close modal
    const cleanupAndCloseCropModal = () => {
        // Clean up object URLs only for the images in the modal (not affecting preview URLs)
        imagesToProcess.forEach(img => {
            // Only revoke URLs for images that weren't processed, as processed images
            // already have their URLs stored in the previewUrls array
            if (!img.processed) {
                URL.revokeObjectURL(img.url);
            }
        });

        // Close modal
        setCropModalOpen(false);
    };

    // Image removal handlers
    const removeNewImage = (id: string) => {
        const indexToRemove = newImageItems.findIndex(item => item.id === id);
        if (indexToRemove === -1) return;

        // Find the corresponding URL to revoke
        const urlToRevoke = previewUrls[indexToRemove];

        // Update arrays
        setSelectedFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(indexToRemove, 1);
            return newFiles;
        });

        setPreviewUrls(prev => {
            const newUrls = [...prev];
            URL.revokeObjectURL(urlToRevoke); // Free up memory
            newUrls.splice(indexToRemove, 1);
            return newUrls;
        });
    };

    const removeExistingImage = (id: number) => {
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };

    // Image reordering handlers
    const handleNewImagesReorder = (reorderedImages: {id: string, url: string}[]) => {
        // Create new arrays based on the reordered IDs
        const newPreviewUrls: string[] = [];
        const newSelectedFiles: File[] = [];

        reorderedImages.forEach(item => {
            const originalIndex = parseInt(item.id.replace('new-', ''));
            if (!isNaN(originalIndex) && originalIndex >= 0 && originalIndex < previewUrls.length) {
                newPreviewUrls.push(previewUrls[originalIndex]);
                newSelectedFiles.push(selectedFiles[originalIndex]);
            }
        });

        // Update the state
        setPreviewUrls(newPreviewUrls);
        setSelectedFiles(newSelectedFiles);
        setNewImageItems(reorderedImages);
    };

    const handleExistingImagesReorder = (reorderedImages: {id: number, url: string}[]) => {
        // Create a new array of ProfileImage objects in the new order
        const newExistingImages: ProfileImage[] = [];

        reorderedImages.forEach(item => {
            const originalImage = existingImages.find(img => img.id === item.id);
            if (originalImage) {
                newExistingImages.push(originalImage);
            }
        });

        // Update the state
        setExistingImages(newExistingImages);
        setExistingImageItems(reorderedImages);
    };

    // Form submission handler
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

        // Add cropped image files
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

    // Helper function to fill test data
    const fillTestData = () => {
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

        // Select random payment methods and languages
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
    };

    // Define CSS classes
    const inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    const checkboxClassName = "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded";

    // Render loading state
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

    // Main form render
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <form action={handleSubmit} className="p-6">
                {/* Test data button */}
                <div className="md:col-span-2 mt-4 mb-6">
                    <button
                        type="button"
                        onClick={fillTestData}
                        className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800"
                    >
                        Fill Test Data
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic information fields */}
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

                    {/* Image upload field */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Images</label>
                        <div
                            className="relative"
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const dropzone = e.currentTarget.querySelector('.dropzone');
                                if (dropzone) {
                                    dropzone.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
                                    dropzone.classList.add('scale-[1.02]');
                                }
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const dropzone = e.currentTarget.querySelector('.dropzone');
                                if (dropzone) {
                                    dropzone.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
                                    dropzone.classList.remove('scale-[1.02]');
                                }
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const dropzone = e.currentTarget.querySelector('.dropzone');
                                if (dropzone) {
                                    dropzone.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
                                    dropzone.classList.remove('scale-[1.02]');
                                }

                                // Process dropped files
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    const files = Array.from(e.dataTransfer.files);
                                    // Filter for only image files
                                    const imageFiles = files.filter(file => file.type.startsWith('image/'));

                                    if (imageFiles.length > 0) {
                                        // Create image processing objects with unique IDs
                                        const newImagesToProcess = imageFiles.map(file => ({
                                            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                            file,
                                            url: URL.createObjectURL(file),
                                            processed: false
                                        }));

                                        // Add to the modal for processing
                                        setImagesToProcess(newImagesToProcess);
                                        setCropModalOpen(true);
                                    }
                                }
                            }}
                        >
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                aria-label="Choose profile images"
                            />
                            <div className="dropzone w-full px-4 py-8 flex flex-col items-center justify-center space-y-3 text-sm font-medium rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform active:scale-[0.98] active:bg-indigo-50 dark:active:bg-indigo-900/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div className="text-center">
                                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    PNG, JPG, GIF up to 10MB
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Images will be cropped to a 9:16 ratio, converted to WebP, and stored in Google Cloud Storage.
                        </p>
                        {errors.images && <p className="mt-1 text-sm text-red-600 font-medium">{errors.images[0]}</p>}
                    </div>

                    {/* New images gallery */}
                    {newImageItems.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                New Images Preview <span className="text-xs text-gray-500 dark:text-gray-400">(drag to reorder, first image is main)</span>
                            </label>
                            <SortableImageGallery
                                images={newImageItems}
                                onReorder={handleNewImagesReorder}
                                onRemove={removeNewImage}
                            />
                        </div>
                    )}

                    {/* Existing images gallery */}
                    {existingImageItems.length > 0 && (
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Current Images <span className="text-xs text-gray-500 dark:text-gray-400">(drag to reorder, first image is main)</span>
                            </label>
                            <SortableImageGallery
                                images={existingImageItems}
                                onReorder={handleExistingImagesReorder}
                                onRemove={removeExistingImage}
                            />
                        </div>
                    )}

                    {/* Description field */}
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

                    {/* Location section */}
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

                    {/* Additional Info section */}
                    <div className="pt-4 md:col-span-2">
                        <div className="flex items-center">
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                            <span className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Additional Information</span>
                            <div className="flex-grow h-px bg-gray-200 dark:bg-gray-600"></div>
                        </div>
                    </div>

                    {/* Payment Methods */}
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

                    {/* Languages */}
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

                {/* Form actions */}
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

                {/* Crop Modal */}
                {cropModalOpen && imagesToProcess.length > 0 && (
                    <ImageCropModal
                        imagesToProcess={imagesToProcess}
                        onCropComplete={handleCropComplete}
                        onClose={handleCloseCropModal}
                        aspectRatio={9/16}
                    />
                )}
            </form>
        </div>
    );
}
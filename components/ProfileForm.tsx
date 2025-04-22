// components/ProfileForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, ProfileImage } from '@prisma/client';
import { createProfile, updateProfile } from '@/app/profile/actions';
import ImageCropModal from './ImageCropModal';
import ProfileImageManager from './ProfileImageManager';
import LanguageSelector from './LanguageSelector';
import PaymentMethodSelector from './PaymentMethodSelector';
import NationalitySelector from './NationalitySelector';
import EthnicitySelector from './EthnicitySelector';
import AdminControls from './AdminControls';
import { useProfileImages } from '@/hooks/useProfileImages';

// Define interfaces outside the component
type ProfileWithRelations = Profile & {
    paymentMethods: { paymentMethodId: number }[];
    languages: { languageId: number }[];
    nationalities?: { nationalityId: number }[];
    ethnicities?: { ethnicityId: number }[];
    images: ProfileImage[];
    isDraft?: boolean;
    originalProfileId?: number | null;
    user?: {
        name: string | null;
        email: string;
        id: string;
    };
};

type ProfileFormProps = {
    profile?: ProfileWithRelations;
    isEditing?: boolean;
    isAdminMode?: boolean;
    userId?: string; // For admin creating profiles for specific users
};

export default function ProfileForm({profile, isEditing = false, isAdminMode = false, userId}: ProfileFormProps) {
    const router = useRouter();

    // Form data states - controlled inputs
    const [name, setName] = useState(profile?.name || '');
    const [price, setPrice] = useState(profile?.price?.toString() || '0');
    const [age, setAge] = useState(profile?.age?.toString() || '18');
    const [description, setDescription] = useState(profile?.description || '');
    const [latitude, setLatitude] = useState(profile?.latitude?.toString() || '0');
    const [longitude, setLongitude] = useState(profile?.longitude?.toString() || '0');
    const [address, setAddress] = useState(profile?.address || '');

    const [selectedLanguages, setSelectedLanguages] = useState<number[]>([]);
    const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<number[]>([]);
    const [selectedNationality, setSelectedNationality] = useState<number | null>(null);
    const [selectedEthnicity, setSelectedEthnicity] = useState<number | null>(null);
    const [isPublished, setIsPublished] = useState<boolean>(false);

    // UI control states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // Use our custom image handling hook
    const {
        images,
        imagesToCrop,
        showCropModal,
        handleAddFiles,
        handleCropComplete,
        handleRemoveImage,
        handleReorderImages,
        handleCloseCropModal,
        prepareImagesForSubmission
    } = useProfileImages(profile?.images);

    // Detect if we're editing a published profile (which will create a draft)
    const isEditingPublished = isEditing && profile && profile.published && !profile.isDraft && !isAdminMode;

    // Initialize form data on load
    useEffect(() => {
        setIsLoading(true);
        try {
            // Set default selected values if profile exists
            if (profile) {
                setName(profile.name || '');
                setPrice(profile.price?.toString() || '0');
                setAge(profile.age?.toString() || '18');
                setDescription(profile.description || '');
                setLatitude(profile.latitude?.toString() || '0');
                setLongitude(profile.longitude?.toString() || '0');
                setAddress(profile.address || '');
                setSelectedLanguages(profile.languages.map(l => l.languageId));
                setSelectedPaymentMethods(profile.paymentMethods.map(pm => pm.paymentMethodId));
                setIsPublished(profile.published || false);

                // Set nationality if available (first one in the array)
                if (profile.nationalities && profile.nationalities.length > 0) {
                    setSelectedNationality(profile.nationalities[0].nationalityId);
                }

                // Set ethnicity if available (first one in the array)
                if (profile.ethnicities && profile.ethnicities.length > 0) {
                    setSelectedEthnicity(profile.ethnicities[0].ethnicityId);
                }
            }
        } catch (error) {
            console.error('Error initializing form data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [profile]);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setErrors({});

        try {
            // Create a new FormData object
            const updatedFormData = new FormData();

            // If in admin mode and creating a profile for a specific user, add the userId
            if (isAdminMode && userId && !isEditing) {
                updatedFormData.append('userId', userId);
            }

            // Add basic form fields using state values
            updatedFormData.append('name', name);
            updatedFormData.append('price', price);
            updatedFormData.append('age', age);
            updatedFormData.append('description', description);
            updatedFormData.append('latitude', latitude);
            updatedFormData.append('longitude', longitude);
            updatedFormData.append('address', address);

            if (selectedNationality) {
                updatedFormData.append('nationality', selectedNationality.toString());
            }

            if (selectedEthnicity) {
                updatedFormData.append('ethnicity', selectedEthnicity.toString());
            }

            // Add published state if admin
            if (isAdminMode) {
                updatedFormData.append('published', isPublished.toString());
            }

            // Add language and payment method IDs
            selectedLanguages.forEach(id => {
                updatedFormData.append('languages', id.toString());
            });

            selectedPaymentMethods.forEach(id => {
                updatedFormData.append('paymentMethods', id.toString());
            });

            // Add image information
            const { existingImages, newImages, imageOrderData } = prepareImagesForSubmission();

            // Add image order data
            updatedFormData.append('imageOrderData', JSON.stringify(imageOrderData));
            updatedFormData.append('images', 'explicit'); // Indicate explicit interaction with images

            // Add existing images
            existingImages.forEach(img => {
                updatedFormData.append('existingImages', img.key);
            });

            // Add new images
            newImages.forEach(img => {
                updatedFormData.append('images', img.file);
                updatedFormData.append('imagePositions', img.order.toString());
            });

            // Submit the form
            if (isEditing && profile) {
                const result = await updateProfile(profile.id, updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                } else {
                    // Redirect to appropriate page based on mode
                    window.location.href = isAdminMode ? '/admin' : '/profile';
                }
            } else {
                const result = await createProfile(updatedFormData);
                if (result && !result.success) {
                    setErrors(result.errors || {});
                } else {
                    // Redirect to appropriate page based on mode
                    window.location.href = isAdminMode
                        ? '/admin'
                        : '/profile';
                }
            }
        } catch (error) {
            console.error('Error processing form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Define CSS classes
    const inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

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
                {/* Admin mode indicator */}
                {isAdminMode && (
                    <div className="mb-6 p-3 bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-800 rounded-md">
                        <p className="text-purple-800 dark:text-purple-300 text-sm font-medium">
                            {isEditing
                                ? `Admin Mode: Editing profile #${profile?.id} for user ${profile?.user?.name || profile?.user?.email}`
                                : `Admin Mode: Creating profile for user ID: ${userId}`
                            }
                        </p>
                    </div>
                )}

                {/* Draft indicator for published profiles being edited */}
                {isEditingPublished && (
                    <div className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium">
                            Your changes will create a draft that requires administrator approval before becoming public.
                            Your current published profile will remain visible until your changes are approved.
                        </p>
                    </div>
                )}

                {/* Draft indicator if editing an existing draft */}
                {isEditing && profile && profile.isDraft && !isAdminMode && (
                    <div className="mb-6 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md">
                        <p className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                            You are editing a draft version of your profile. Your changes will need to be approved before becoming public.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic information fields - now controlled */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
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
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
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
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className={inputClassName}
                            min="18"
                            max="100"
                        />
                        {errors.age && <p className="mt-1 text-sm text-red-600 font-medium">{errors.age[0]}</p>}
                    </div>

                    {/* Image management component */}
                    <div className="md:col-span-2">
                        <ProfileImageManager
                            images={images}
                            onAddFiles={handleAddFiles}
                            onRemoveImage={handleRemoveImage}
                            onReorderImages={handleReorderImages}
                        />
                        {errors.images && <p className="mt-1 text-sm text-red-600 font-medium">{errors.images[0]}</p>}
                    </div>

                    {/* Description field - now controlled */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea
                            rows={4}
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className={`${inputClassName} resize-none`}
                            placeholder="Describe your experience, specialties and services you offer..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-600 font-medium">{errors.description[0]}</p>}
                    </div>

                    {/* Location section - now controlled */}
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
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
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
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
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
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
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

                    {/* Payment Methods Selector */}
                    <div>
                        <PaymentMethodSelector
                            selectedPaymentMethods={selectedPaymentMethods}
                            onChange={setSelectedPaymentMethods}
                            error={errors.paymentMethods?.[0]}
                        />
                    </div>

                    {/* Languages Selector */}
                    <div>
                        <LanguageSelector
                            selectedLanguages={selectedLanguages}
                            onChange={setSelectedLanguages}
                            error={errors.languages?.[0]}
                        />
                    </div>

                    {/* Nationality Selector */}
                    <div>
                        <NationalitySelector
                            selectedNationality={selectedNationality}
                            onChange={setSelectedNationality}
                            error={errors.nationality?.[0]}
                        />
                    </div>

                    {/* Ethnicity Selector */}
                    <div>
                        <EthnicitySelector
                            selectedEthnicity={selectedEthnicity}
                            onChange={setSelectedEthnicity}
                            error={errors.ethnicity?.[0]}
                        />
                    </div>
                </div>

                {/* Admin Controls Component */}
                {isAdminMode && (
                    <AdminControls
                        isPublished={isPublished}
                        onPublishedChange={setIsPublished}
                        profileId={profile?.id}
                        profileName={profile?.name}
                        userName={profile?.user?.name}
                        userEmail={profile?.user?.email}
                    />
                )}

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
                {showCropModal && imagesToCrop.length > 0 && (
                    <ImageCropModal
                        imagesToProcess={imagesToCrop}
                        onCropComplete={handleCropComplete}
                        onClose={handleCloseCropModal}
                        aspectRatio={9 / 16}
                    />
                )}
            </form>
        </div>
    );
}
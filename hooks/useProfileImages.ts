// hooks/useProfileImages.ts
import { useState, useEffect, useCallback } from 'react';
import {
    getImageDimensions,
    calculateAspectRatio,
    validateImageAspectRatio,
    centerCropImage,
    getCroppedFileName
} from '@/utils/imageUtils';
import { toast } from 'sonner';

interface ExistingImage {
    id: number;
    mediumUrl: string;
    mediumStorageKey: string;
    [key: string]: any;
}

interface ImageToProcess {
    id: string;
    file: File;
    url: string;
    processed: boolean;
}

interface UnifiedImage {
    id: string | number;
    url: string;
    isExisting: boolean;
    file?: File;
    storageKey?: string;
    isPrimary?: boolean;
    // NEW: Aspect ratio validation fields
    aspectRatio?: number;
    width?: number;
    height?: number;
    requiresCrop?: boolean;
    cropReason?: string;
    canAutoCrop?: boolean;
}

export function useProfileImages(existingImages: ExistingImage[] = []) {
    // Main state for all images (unified model)
    const [images, setImages] = useState<UnifiedImage[]>([]);
    // State for images that need cropping
    const [imagesToCrop, setImagesToCrop] = useState<ImageToProcess[]>([]);
    // Modal visibility
    const [showCropModal, setShowCropModal] = useState(false);

    // Initialize from existing images
    useEffect(() => {
        if (existingImages?.length > 0) {
            const initialImages = existingImages.map((img, index) => ({
                id: img.id,
                url: img.mediumUrl,
                isExisting: true,
                storageKey: img.mediumStorageKey,
                isPrimary: index === 0
            }));

            setImages(initialImages);
        }
    }, [existingImages]);

    // Mark first image as primary whenever images change
    useEffect(() => {
        if (images.length > 0) {
            const updatedImages = images.map((img, index) => ({
                ...img,
                isPrimary: index === 0
            }));

            // Only update if there's an actual change to avoid infinite loop
            const primaryChanged = images.some((img, index) =>
                img.isPrimary !== (index === 0)
            );

            if (primaryChanged) {
                setImages(updatedImages);
            }
        }
    }, [images]);

    // Handle adding files - NOW adds directly with validation (no mandatory crop)
    const handleAddFiles = useCallback(async (files: File[]) => {
        if (!files || files.length === 0) return;

        try {
            // Process each file to get dimensions and validation
            const processedFiles = await Promise.all(
                Array.from(files).map(async (file) => {
                    const id = `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const url = URL.createObjectURL(file);

                    try {
                        // Get image dimensions
                        const { width, height } = await getImageDimensions(file);
                        const aspectRatio = calculateAspectRatio(width, height);

                        // Validate aspect ratio (9:16 target)
                        const TARGET_RATIO = 9 / 16;
                        const validation = validateImageAspectRatio(aspectRatio, TARGET_RATIO, 0.01);

                        return {
                            id,
                            file,
                            url,
                            isExisting: false,
                            isPrimary: false, // Will be set by effect
                            aspectRatio,
                            width,
                            height,
                            requiresCrop: validation.requiresCrop,
                            cropReason: validation.reason,
                            canAutoCrop: validation.canAutoCrop
                        };
                    } catch (error) {
                        console.error('Error processing image:', error);
                        // Add image anyway but mark as needing manual crop
                        return {
                            id,
                            file,
                            url,
                            isExisting: false,
                            isPrimary: false,
                            requiresCrop: true,
                            cropReason: 'Could not validate image - manual crop recommended',
                            canAutoCrop: false
                        };
                    }
                })
            );

            // Add ALL images directly to gallery
            setImages(prev => [...prev, ...processedFiles]);

            // Show success toast
            const validImages = processedFiles.filter(img => !img.requiresCrop).length;
            const invalidImages = processedFiles.filter(img => img.requiresCrop).length;

            if (invalidImages > 0) {
                toast.warning(
                    `${processedFiles.length} image(s) added. ${invalidImages} need(s) cropping.`,
                    {
                        description: 'Check warnings below to crop images with aspect ratio issues.'
                    }
                );
            } else {
                toast.success(`${processedFiles.length} image(s) added successfully`);
            }
        } catch (error) {
            console.error('Error adding files:', error);
            toast.error('Failed to add images. Please try again.');
        }
    }, []);

    // NEW: Handle auto-crop (center crop)
    const handleAutoCrop = useCallback(async (imageId: string | number) => {
        const image = images.find(img => img.id === imageId);
        if (!image || !image.file) {
            toast.error('Cannot auto-crop: image not found');
            return;
        }

        if (!image.canAutoCrop) {
            toast.error('This image cannot be auto-cropped. Please use manual crop instead.');
            return;
        }

        try {
            // Perform center crop
            const croppedBlob = await centerCropImage(image.file, 9 / 16);
            const croppedFile = new File(
                [croppedBlob],
                getCroppedFileName(image.file.name),
                { type: 'image/jpeg' }
            );
            const previewUrl = URL.createObjectURL(croppedBlob);

            // Revoke old URL
            URL.revokeObjectURL(image.url);

            // Update image in array
            setImages(prev => prev.map(img =>
                img.id === imageId
                    ? {
                        ...img,
                        file: croppedFile,
                        url: previewUrl,
                        requiresCrop: false,
                        cropReason: undefined,
                        canAutoCrop: false
                    }
                    : img
            ));

            toast.success('Image auto-cropped successfully');
        } catch (error) {
            console.error('Auto-crop error:', error);
            toast.error('Failed to auto-crop image. Please try manual crop.');
        }
    }, [images]);

    // NEW: Handle manual crop (open modal for specific image)
    const handleManualCrop = useCallback((imageId: string | number) => {
        const image = images.find(img => img.id === imageId);
        if (!image || !image.file) {
            toast.error('Cannot crop: image not found');
            return;
        }

        // Set up single image for cropping
        setImagesToCrop([{
            id: String(imageId),
            file: image.file,
            url: image.url,
            processed: false
        }]);
        setShowCropModal(true);
    }, [images]);

    // Handle crop completion (from modal)
    const handleCropComplete = useCallback((croppedBlob: Blob, imageId: string) => {
        // Create file from blob
        const croppedFile = new File(
            [croppedBlob],
            `cropped-${imageId}.jpg`,
            { type: 'image/jpeg' }
        );

        // Create preview URL
        const previewUrl = URL.createObjectURL(croppedBlob);

        // Mark image as processed in crop queue
        setImagesToCrop(prev => prev.map(img =>
            img.id === imageId ? { ...img, processed: true } : img
        ));

        // Check if image already exists in images array (manual crop of existing)
        const existingImageIndex = images.findIndex(img => String(img.id) === imageId);

        if (existingImageIndex !== -1) {
            // Update existing image (manual crop)
            setImages(prev => prev.map(img =>
                String(img.id) === imageId
                    ? {
                        ...img,
                        file: croppedFile,
                        url: previewUrl,
                        requiresCrop: false,
                        cropReason: undefined,
                        canAutoCrop: false
                    }
                    : img
            ));
            toast.success('Image cropped successfully');
        } else {
            // Add new image (old flow compatibility)
            setImages(prev => [...prev, {
                id: imageId,
                file: croppedFile,
                url: previewUrl,
                isExisting: false,
                isPrimary: prev.length === 0
            }]);
            toast.success('Image added successfully');
        }
    }, [images]);

    // Handle image removal
    const handleRemoveImage = useCallback((imageId: string | number) => {
        setImages(prev => {
            // Find the image to remove
            const imageToRemove = prev.find(img => img.id === imageId);

            // If it's a new image with a URL, revoke the object URL
            if (imageToRemove && !imageToRemove.isExisting) {
                URL.revokeObjectURL(imageToRemove.url);
            }

            // Return the filtered list
            return prev.filter(img => img.id !== imageId);
        });
    }, []);

    // Handle image reordering
    const handleReorderImages = useCallback((reorderedImages: UnifiedImage[]) => {
        // Update the primary flag
        const updatedImages = reorderedImages.map((img, index) => ({
            ...img,
            isPrimary: index === 0
        }));

        setImages(updatedImages);
    }, []);

    // Handle closing the crop modal
    const handleCloseCropModal = useCallback(() => {
        // Check if any unprocessed images
        const hasUnprocessedImages = imagesToCrop.some(img => !img.processed);

        if (hasUnprocessedImages) {
            // Confirm before closing if there are unprocessed images
            if (window.confirm('You have unprocessed images. Are you sure you want to close?')) {
                // Clean up URLs for unprocessed images
                imagesToCrop.forEach(img => {
                    if (!img.processed) {
                        URL.revokeObjectURL(img.url);
                    }
                });
                setShowCropModal(false);
                setImagesToCrop([]);
            }
        } else {
            // If all images are processed, just close
            setShowCropModal(false);
            setImagesToCrop([]);
        }
    }, [imagesToCrop]);

    // Function to prepare images for form submission
    const prepareImagesForSubmission = useCallback(() => {
        // Separate existing and new images
        const existingImages = images
            .filter(img => img.isExisting)
            .map((img, idx) => ({
                key: img.storageKey as string,
                order: idx
            }));

        const newImages = images
            .filter(img => !img.isExisting)
            .map((img, idx) => ({
                file: img.file as File,
                order: existingImages.length + idx
            }));

        // Create image order data for complete ordering
        const imageOrderData = [
            ...existingImages.map((img, idx) => ({
                type: 'existing',
                id: img.key,
                position: idx
            })),
            ...newImages.map((img, idx) => ({
                type: 'new',
                id: idx.toString(),
                position: existingImages.length + idx
            }))
        ];

        return {
            existingImages,
            newImages,
            imageOrderData
        };
    }, [images]);

    return {
        images,
        imagesToCrop,
        showCropModal,
        handleAddFiles,
        handleCropComplete,
        handleRemoveImage,
        handleReorderImages,
        handleCloseCropModal,
        prepareImagesForSubmission,
        // NEW exports
        handleAutoCrop,
        handleManualCrop
    };
}
// hooks/useProfileImages.ts
import { useState, useEffect, useCallback } from 'react';

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

    // Handle adding files for cropping
    const handleAddFiles = useCallback((files: File[]) => {
        if (!files || files.length === 0) return;

        const newImagesToCrop = Array.from(files).map(file => ({
            id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            url: URL.createObjectURL(file),
            processed: false
        }));

        setImagesToCrop(newImagesToCrop);
        setShowCropModal(true);
    }, []);

    // Handle crop completion
    const handleCropComplete = useCallback((croppedBlob: Blob, imageId: string) => {
        // Create file from blob
        const croppedFile = new File(
            [croppedBlob],
            `cropped-${imageId}.jpg`,
            { type: 'image/jpeg' }
        );

        // Create preview URL
        const previewUrl = URL.createObjectURL(croppedBlob);

        // Update images to crop as processed
        setImagesToCrop(prev => prev.map(img =>
            img.id === imageId ? { ...img, processed: true } : img
        ));

        // Add to images list
        setImages(prev => [...prev, {
            id: imageId,
            file: croppedFile,
            url: previewUrl,
            isExisting: false,
            isPrimary: prev.length === 0 // Primary if it's the first image
        }]);
    }, []);

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
        prepareImagesForSubmission
    };
}
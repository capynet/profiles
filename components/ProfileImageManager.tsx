// components/ProfileImageManager.tsx
'use client';

import { useDropzone } from 'react-dropzone';
import SortableImageGallery from './SortableImageGallery';
import ImageCropWarnings from './ImageCropWarnings';
import clsx from 'clsx';

interface Image {
    id: string | number;
    url: string;
    isPrimary?: boolean;
    isExisting: boolean;
    requiresCrop?: boolean;
    cropReason?: string;
    canAutoCrop?: boolean;
}

interface ProfileImageManagerProps {
    images: Image[];
    onAddFiles: (files: File[]) => void;
    onRemoveImage: (id: string | number) => void;
    onReorderImages: (newOrder: Image[]) => void;
    onAutoCrop: (imageId: string | number) => void;
    onManualCrop: (imageId: string | number) => void;
}

export default function ProfileImageManager({
                                                images,
                                                onAddFiles,
                                                onRemoveImage,
                                                onReorderImages,
                                                onAutoCrop,
                                                onManualCrop
                                            }: ProfileImageManagerProps) {
    // Setup react-dropzone
    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
        },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: true,
        onDrop: (acceptedFiles) => onAddFiles(acceptedFiles)
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile Images
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {images.length === 0 ? 'No images uploaded' : `${images.length} images (first is primary)`}
                </span>
            </div>

            {/* File Upload Area - Using react-dropzone */}
            <div {...getRootProps()}>
                <input {...getInputProps()} aria-label="Choose profile images" />

                <div className={clsx(
                    'w-full px-4 py-8 flex flex-col items-center justify-center space-y-3 text-sm font-medium rounded-md border-2 border-dashed transition-all transform cursor-pointer',
                    isDragActive && !isDragReject && 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 scale-[1.02]',
                    isDragReject && 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
                    !isDragActive && 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
                    'active:scale-[0.98] active:bg-indigo-50 dark:active:bg-indigo-900/20'
                )}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <div className="text-center text-gray-700 dark:text-gray-300">
                        {isDragActive ? (
                            isDragReject ? (
                                <span className="text-red-600 dark:text-red-400">Invalid file type</span>
                            ) : (
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium">Drop images here...</span>
                            )
                        ) : (
                            <>
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG, GIF up to 10MB
                    </p>
                </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
                Images will be validated for 9:16 aspect ratio. You can crop them if needed, or they'll be cropped automatically on the server.
            </p>

            {/* Sortable Image Gallery */}
            {images.length > 0 && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Images <span className="text-xs text-gray-500 dark:text-gray-400">(drag to reorder, first image is main)</span>
                    </label>
                    <SortableImageGallery
                        images={images}
                        onReorder={onReorderImages}
                        onRemove={onRemoveImage}
                    />

                    {/* Crop Warnings - NEW */}
                    <ImageCropWarnings
                        images={images}
                        onAutoCrop={onAutoCrop}
                        onManualCrop={onManualCrop}
                    />
                </div>
            )}
        </div>
    );
}
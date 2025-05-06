// components/ProfileImageManager.tsx
import { useRef } from 'react';
import SortableImageGallery from './SortableImageGallery';

interface Image {
    id: string | number;
    url: string;
    isPrimary?: boolean;
    isExisting: boolean;
}

interface ProfileImageManagerProps {
    images: Image[];
    onAddFiles: (files: File[]) => void;
    onRemoveImage: (id: string | number) => void;
    onReorderImages: (newOrder: Image[]) => void;
}

export default function ProfileImageManager({
                                                images,
                                                onAddFiles,
                                                onRemoveImage,
                                                onReorderImages
                                            }: ProfileImageManagerProps) {
    // File input ref for programmatic opening
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddFiles(Array.from(e.target.files));
            // Reset file input for future selections
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle file drop
    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Reset drag effect classes
        const dropzone = e.currentTarget.querySelector('.dropzone');
        if (dropzone) {
            dropzone.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
            dropzone.classList.remove('scale-[1.02]');
        }

        // Process dropped files
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const imageFiles = Array.from(e.dataTransfer.files)
                .filter(file => file.type.startsWith('image/'));

            if (imageFiles.length > 0) {
                onAddFiles(imageFiles);
            }
        }
    };

    // Handle drag over for styling
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const dropzone = e.currentTarget.querySelector('.dropzone');
        if (dropzone) {
            dropzone.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
            dropzone.classList.add('scale-[1.02]');
        }
    };

    // Handle drag leave for styling
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const dropzone = e.currentTarget.querySelector('.dropzone');
        if (dropzone) {
            dropzone.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-300', 'dark:border-indigo-700');
            dropzone.classList.remove('scale-[1.02]');
        }
    };

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

            {/* File Upload Area */}
            <div
                className="relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleFileDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelection}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    aria-label="Choose profile images"
                />

                <div className="dropzone w-full px-4 py-8 flex flex-col items-center justify-center space-y-3 text-sm font-medium rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform active:scale-[0.98] active:bg-indigo-50 dark:active:bg-indigo-900/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
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
                </div>
            )}
        </div>
    );
}
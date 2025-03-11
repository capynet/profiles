'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageItem {
    id: string | number;
    url: string;
    isPrimary?: boolean;
    isNew?: boolean;
}

interface SortableImageGalleryProps {
    images: ImageItem[];
    onReorder: (newOrder: ImageItem[]) => void;
    onRemove: (id: string | number) => void;
    className?: string;
}

export default function SortableImageGallery({
                                                 images,
                                                 onReorder,
                                                 onRemove,
                                                 className = ''
                                             }: SortableImageGalleryProps) {
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [localImages, setLocalImages] = useState<ImageItem[]>([]);

    // Initialize local state from props
    useEffect(() => {
        setLocalImages(images);
    }, [images]);

    // Update the first image to be primary
    useEffect(() => {
        if (localImages.length > 0) {
            const updatedImages = localImages.map((img, index) => ({
                ...img,
                isPrimary: index === 0
            }));
            setLocalImages(updatedImages);
            onReorder(updatedImages);
        }
    }, [localImages.length]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        // Set the dragged item index
        setDraggingIndex(index);

        // Set the drag image (optional, for better UX)
        if (e.dataTransfer.setDragImage && e.currentTarget instanceof HTMLElement) {
            const rect = e.currentTarget.getBoundingClientRect();
            e.dataTransfer.setDragImage(
                e.currentTarget,
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        }

        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';

        // Store the index of the dragged item
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggingIndex === null || draggingIndex === index) return;

        // Reorder the items in the local state
        const items = [...localImages];
        const draggedItem = items[draggingIndex];

        // Remove the dragged item
        items.splice(draggingIndex, 1);

        // Insert the dragged item at the new position
        items.splice(index, 0, draggedItem);

        // Update the local state and dragging index
        setLocalImages(items);
        setDraggingIndex(index);
    };

    const handleDragEnd = () => {
        setDraggingIndex(null);
        onReorder(localImages);
    };

    return (
        <div className={`grid grid-cols-3 md:grid-cols-5 gap-4 ${className}`}>
            {localImages.map((image, index) => (
                <div
                    key={image.id}
                    className={`relative aspect-[9/16] w-28 rounded-md overflow-hidden 
            ${index === draggingIndex ? 'opacity-50' : 'opacity-100'} 
            ${image.isPrimary ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="h-full w-full relative">
                        <Image
                            src={image.url}
                            alt={`Image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 112px"
                            className="object-cover"
                            priority={index === 0}
                        />
                    </div>

                    {/* Primary image badge */}
                    {image.isPrimary && (
                        <div className="absolute top-1 left-1 bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm">
                            Main
                        </div>
                    )}

                    {/* New image badge */}
                    {image.isNew && (
                        <div className="absolute top-1 left-1 bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-sm" style={{ left: image.isPrimary ? '3.5rem' : '1rem' }}>
                            New
                        </div>
                    )}

                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={() => onRemove(image.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10"
                        aria-label="Remove image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                    </button>

                    {/* Drag handle indicator */}
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white p-1 rounded cursor-move">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                    </div>
                </div>
            ))}
        </div>
    );
}
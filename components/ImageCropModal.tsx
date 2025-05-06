// components/ImageCropModal.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface ImageToProcess {
    id: string;
    file: File;
    url: string;
    processed: boolean;
}

interface ImageCropModalProps {
    imagesToProcess: ImageToProcess[];
    onCropComplete: (croppedBlob: Blob, imageId: string) => void;
    onClose: () => void;
    aspectRatio?: number;
}

export default function ImageCropModal({
                                           imagesToProcess,
                                           onCropComplete,
                                           onClose,
                                           aspectRatio = 9 / 16
                                       }: ImageCropModalProps) {
    const t = useTranslations('ImageCropModal');
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [mounted, setMounted] = useState(false);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

    // Set mounted to true on client-side and select first unprocessed image by default
    useEffect(() => {
        setMounted(true);

        // Find the first unprocessed image
        const firstUnprocessedImage = imagesToProcess.find(img => !img.processed);
        if (firstUnprocessedImage) {
            setSelectedImageId(firstUnprocessedImage.id);
        }
    }, [imagesToProcess]);

    const onCropChange = (crop: Point) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropCompleteHandler = useCallback((_: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // Select a different image to crop
    const selectImage = (imageId: string) => {
        setSelectedImageId(imageId);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    // Function to create an image from a canvas
    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new window.Image(); // Use window.Image instead of Image to avoid confusion with Next.js Image
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', error => reject(error));
            image.src = url;
        });

    // Function to get cropped image
    const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        // Set canvas dimensions to match the cropped area
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image onto the canvas
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert canvas to blob
        return new Promise((resolve) => {
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    throw new Error('Canvas to Blob conversion failed');
                }
            }, 'image/jpeg', 0.95);
        });
    };

    // Handle the crop confirmation for the current selected image
    const handleCrop = async () => {
        if (!selectedImageId || !croppedAreaPixels) return;

        const selectedImage = imagesToProcess.find(img => img.id === selectedImageId);
        if (!selectedImage) return;

        try {
            const croppedImage = await getCroppedImg(selectedImage.url, croppedAreaPixels);
            onCropComplete(croppedImage, selectedImageId);

            // Find next unprocessed image
            const nextUnprocessedImage = imagesToProcess.find(img => !img.processed && img.id !== selectedImageId);
            if (nextUnprocessedImage) {
                setSelectedImageId(nextUnprocessedImage.id);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            }
        } catch (error) {
            console.error('Error cropping image:', error);
        }
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Check if all images have been processed
    const allImagesProcessed = imagesToProcess.every(img => img.processed);

    // Get the currently selected image
    const selectedImage = imagesToProcess.find(img => img.id === selectedImageId);

    // For SSR compatibility
    if (!mounted) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('title')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Image thumbnails sidebar */}
                    <div className="w-full md:w-32 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-96">
                        {imagesToProcess.map((img) => (
                            <div
                                key={img.id}
                                onClick={() => selectImage(img.id)}
                                className={`relative cursor-pointer rounded-md overflow-hidden shrink-0 w-16 h-16 md:w-24 md:h-24 border-2 ${
                                    selectedImageId === img.id
                                        ? 'border-indigo-600 dark:border-indigo-500'
                                        : img.processed
                                            ? 'border-green-500 dark:border-green-400'
                                            : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                <Image
                                    src={img.url}
                                    alt={`Image ${img.id}`}
                                    fill
                                    sizes="(max-width: 768px) 64px, 96px"
                                    className="object-cover"
                                />
                                {img.processed && (
                                    <div className="absolute inset-0 bg-green-500 bg-opacity-30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Cropper and controls */}
                    <div className="flex-1">
                        {selectedImage && !selectedImage.processed ? (
                            <>
                                <div className="relative h-96 w-full mb-4">
                                    <Cropper
                                        image={selectedImage.url}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={aspectRatio}
                                        onCropChange={onCropChange}
                                        onZoomChange={onZoomChange}
                                        onCropComplete={onCropCompleteHandler}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="zoom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('zoom')}
                                    </label>
                                    <input
                                        id="zoom"
                                        type="range"
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                                {allImagesProcessed ? (
                                    <div className="text-center p-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="mt-2 text-lg font-medium text-gray-900 dark:text-white">{t('allProcessed')}</p>
                                        <p className="text-gray-500 dark:text-gray-400">{t('clickDone')}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400">{t('selectImage')}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        {allImagesProcessed ? t('done') : t('cancel')}
                    </button>

                    {selectedImage && !selectedImage.processed && (
                        <button
                            onClick={handleCrop}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        >
                            {t('cropSave')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
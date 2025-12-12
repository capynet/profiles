'use client';

import { useTranslations } from 'next-intl';

interface UnifiedImage {
  id: string | number;
  url: string;
  isExisting: boolean;
  file?: File;
  storageKey?: string;
  isPrimary?: boolean;
  aspectRatio?: number;
  width?: number;
  height?: number;
  requiresCrop?: boolean;
  cropReason?: string;
  canAutoCrop?: boolean;
}

interface ImageCropWarningsProps {
  images: UnifiedImage[];
  onAutoCrop: (imageId: string | number) => void;
  onManualCrop: (imageId: string | number) => void;
}

export default function ImageCropWarnings({
  images,
  onAutoCrop,
  onManualCrop
}: ImageCropWarningsProps) {
  const t = useTranslations('ImageCropWarnings');

  // Filter images that require cropping
  const incompatibleImages = images.filter(img => img.requiresCrop);

  if (incompatibleImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <div className="flex items-start">
        {/* Warning Icon */}
        <svg
          className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>

        {/* Warning Content */}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {t('title')}
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p className="mb-3">{t('description')}</p>

            {/* List of incompatible images */}
            <ul className="space-y-2">
              {incompatibleImages.map((img, index) => {
                const imageIndex = images.indexOf(img) + 1;

                return (
                  <li
                    key={img.id}
                    className="flex items-center justify-between gap-4 p-2 bg-white/50 dark:bg-black/10 rounded"
                  >
                    <span className="flex-1 text-yellow-900 dark:text-yellow-100">
                      {t('imageLabel', { index: imageIndex })}: {img.cropReason}
                    </span>

                    <div className="flex gap-2 flex-shrink-0">
                      {/* Auto-crop button - only show if canAutoCrop is true */}
                      {img.canAutoCrop && (
                        <button
                          onClick={() => onAutoCrop(img.id)}
                          className="px-3 py-1 text-xs font-medium bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                          type="button"
                        >
                          {t('autoCrop')}
                        </button>
                      )}

                      {/* Manual crop button - always available */}
                      <button
                        onClick={() => onManualCrop(img.id)}
                        className="px-3 py-1 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        type="button"
                      >
                        {t('manualCrop')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

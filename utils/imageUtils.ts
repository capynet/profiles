/**
 * Image utility functions for validation and processing
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface AspectRatioValidation {
  isValid: boolean;
  requiresCrop: boolean;
  reason: string;
  canAutoCrop: boolean;
}

/**
 * Load an image from a File object and return dimensions
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Validate image aspect ratio against target ratio (9:16 for portrait)
 */
export function validateImageAspectRatio(
  aspectRatio: number,
  targetRatio: number = 9 / 16, // 0.5625
  tolerance: number = 0.01
): AspectRatioValidation {
  // Check if aspect ratio is within tolerance
  if (Math.abs(aspectRatio - targetRatio) <= tolerance) {
    return {
      isValid: true,
      requiresCrop: false,
      reason: '',
      canAutoCrop: false
    };
  }

  // Image is too narrow (taller than 9:16)
  // Example: 9:20 ratio = 0.45 which is < 0.5625
  if (aspectRatio < targetRatio) {
    return {
      isValid: false,
      requiresCrop: true,
      reason: 'Image is too narrow - manual crop recommended',
      canAutoCrop: false // Cannot auto-crop narrower images
    };
  }

  // Image is too wide (wider than 9:16)
  // Example: 16:9 ratio = 1.77 which is > 0.5625
  return {
    isValid: false,
    requiresCrop: true,
    reason: 'Image is too wide - can be auto-cropped',
    canAutoCrop: true
  };
}

/**
 * Create an HTMLImageElement from a File
 */
export function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Center crop an image to a target aspect ratio
 * Uses canvas to perform client-side cropping
 */
export async function centerCropImage(
  file: File,
  targetAspectRatio: number = 9 / 16
): Promise<Blob> {
  // Load the image
  const img = await createImageFromFile(file);
  const { width, height } = img;
  const currentRatio = width / height;

  // Calculate crop dimensions
  let cropWidth: number;
  let cropHeight: number;
  let cropX: number;
  let cropY: number;

  if (currentRatio > targetAspectRatio) {
    // Image is too wide - crop width (horizontal sides)
    cropHeight = height;
    cropWidth = height * targetAspectRatio;
    cropX = (width - cropWidth) / 2; // Center horizontally
    cropY = 0;
  } else {
    // Image is too tall - crop height (top/bottom)
    cropWidth = width;
    cropHeight = width / targetAspectRatio;
    cropX = 0;
    cropY = (height - cropHeight) / 2; // Center vertically
  }

  // Create canvas and draw cropped image
  const canvas = document.createElement('canvas');
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw the cropped portion of the image
  ctx.drawImage(
    img,
    cropX, cropY, cropWidth, cropHeight, // Source rectangle
    0, 0, cropWidth, cropHeight            // Destination rectangle
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      'image/jpeg',
      0.95 // Quality
    );
  });
}

/**
 * Get a descriptive name for the cropped file
 */
export function getCroppedFileName(originalFileName: string): string {
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  return `${nameWithoutExt}-cropped.jpg`;
}

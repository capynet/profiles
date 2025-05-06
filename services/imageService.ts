import {SaveOptions, Storage} from '@google-cloud/storage';
import sharp from 'sharp';
import {v4 as uuidv4} from 'uuid';
import fs from 'fs';

export interface ProcessedImage {
    // Medium (standard)
    mediumUrl: string;
    mediumCdnUrl: string;
    mediumStorageKey: string;

    // Thumbnail
    thumbnailUrl: string;
    thumbnailCdnUrl: string;
    thumbnailStorageKey: string;

    // High quality
    highQualityUrl: string;
    highQualityCdnUrl: string;
    highQualityStorageKey: string;
}

// Configuration for watermark
interface WatermarkConfig {
    enabled: boolean;
    type: 'text' | 'image';
    text?: string;
    textSize?: number;
    textColor?: string;
    textFont?: string;
    imagePath?: string;
    opacity: number;
    position: sharp.Gravity;
    padding: number;
    versions: string[];
}

// Initialize Google Cloud Storage
const credentials = JSON.parse(process.env.GOOGLE_CLOUD_KEY_JSON || '{}');

const storage = new Storage({
    credentials,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || '');
// @todo implement CDN.
const cdnBaseUrl = false;

// Parse watermark configuration from environment variables
const getWatermarkConfig = (): WatermarkConfig => {
    return {
        enabled: process.env.APP_WATERMARK_ENABLED === 'true',
        type: (process.env.APP_WATERMARK_TYPE || 'text') as 'text' | 'image',
        text: process.env.APP_WATERMARK_TEXT,
        textSize: process.env.APP_WATERMARK_TEXT_SIZE ? parseInt(process.env.APP_WATERMARK_TEXT_SIZE) : 24,
        textColor: process.env.APP_WATERMARK_TEXT_COLOR || 'rgba(255,255,255,0.7)',
        textFont: process.env.APP_WATERMARK_TEXT_FONT || 'Arial',
        imagePath: process.env.APP_WATERMARK_IMAGE_PATH,
        opacity: process.env.APP_WATERMARK_OPACITY ? parseFloat(process.env.APP_WATERMARK_OPACITY) : 0.7,
        position: (process.env.APP_WATERMARK_POSITION || 'southeast') as sharp.Gravity,
        padding: process.env.APP_WATERMARK_PADDING ? parseInt(process.env.APP_WATERMARK_PADDING) : 10,
        versions: (process.env.APP_WATERMARK_VERSIONS || 'highQuality').split(',')
    };
};

// Cached watermark config
let watermarkConfig: WatermarkConfig | null = null;

export const ImageService = {
    /**
     * Process an image and upload it to Google Cloud Storage
     * Creates three versions: thumbnail, medium, and high quality
     * Optionally adds watermark based on configuration
     */
    async processAndUploadImage(file: Buffer): Promise<ProcessedImage> {
        try {
            // Initialize watermark config if not already done
            if (!watermarkConfig) {
                watermarkConfig = getWatermarkConfig();
            }

            // Generate a unique base filename
            const uniqueId = uuidv4();
            const baseDir = process.env.APP_PROFILE_PIC_DIR;

            // Define the three versions
            // @todo extract to .env?
            const versions = [
                {
                    name: 'thumbnail',
                    width: 176,
                    height: 288,
                    quality: 70,
                    suffix: '_thumb'
                },
                {
                    name: 'medium',
                    width: 352,
                    height: 576,
                    quality: 80,
                    suffix: ''
                },
                {
                    name: 'highQuality',
                    width: 704,
                    height: 1152,
                    quality: 90,
                    suffix: '_large'
                }
            ];

            // Process and upload each version.
            const results = await Promise.all(versions.map(async (version) => {
                try {
                    // Should this version have a watermark?
                    const applyWatermark = watermarkConfig?.enabled &&
                        watermarkConfig.versions.includes(version.name);

                    let imageProcessor = sharp(file)
                        .resize(version.width, version.height, {
                            fit: 'cover',
                            position: 'center',
                        });

                    // Apply watermark if configured
                    if (applyWatermark) {
                        imageProcessor = await this.applyWatermark(imageProcessor,
                            watermarkConfig as WatermarkConfig,
                            { width: version.width, height: version.height });
                    }

                    // Complete processing
                    const processedImage = await imageProcessor
                        .webp({quality: version.quality})
                        .toBuffer();

                    // Generate filename.
                    const filename = `${uniqueId}${version.suffix}.webp`;
                    const storageKey = `${baseDir}/${filename}`;

                    // Upload to Google Cloud Storage.
                    const fileUpload = bucket.file(storageKey);
                    await fileUpload.save(processedImage, {
                        contentType: 'image/webp'
                    } as SaveOptions);

                    // Get the public URL
                    const url = `https://storage.googleapis.com/${bucket.name}/${storageKey}`;

                    // Generate CDN URL if base URL is provided
                    const cdnUrl = cdnBaseUrl ? `${cdnBaseUrl}/${storageKey}` : url;

                    console.log(`Processed ${version.name}: URL=${url}, StorageKey=${storageKey}`);

                    return {
                        version: version.name,
                        url,
                        cdnUrl,
                        storageKey
                    };
                } catch (error) {
                    console.error(`Error processing ${version.name} version:`, error);
                    throw error;
                }
            }));

            const thumbnail = results.find(r => r.version === 'thumbnail');
            const medium = results.find(r => r.version === 'medium');
            const highQuality = results.find(r => r.version === 'highQuality');

            if (!thumbnail || !medium || !highQuality) {
                throw new Error('Missing processed image versions');
            }

            console.log("Processed URLs:", {
                medium: medium.url,
                thumbnail: thumbnail.url,
                highQuality: highQuality.url
            });

            return {
                // Medium (standard)
                mediumUrl: medium.url,
                mediumCdnUrl: medium.cdnUrl || medium.url,
                mediumStorageKey: medium.storageKey,

                // Thumbnail
                thumbnailUrl: thumbnail.url,
                thumbnailCdnUrl: thumbnail.cdnUrl || thumbnail.url,
                thumbnailStorageKey: thumbnail.storageKey,

                // High quality
                highQualityUrl: highQuality.url,
                highQualityCdnUrl: highQuality.cdnUrl || highQuality.url,
                highQualityStorageKey: highQuality.storageKey
            };
        } catch (error) {
            console.error('Error processing and uploading image:', error);
            throw new Error('Failed to process and upload image');
        }
    },

    /**
     * Apply watermark to an image based on configuration
     * Requires the dimensions of the resized image to create a properly sized watermark
     */
    async applyWatermark(
        imageProcessor: sharp.Sharp,
        config: WatermarkConfig,
        dimensions: { width: number, height: number }
    ): Promise<sharp.Sharp> {
        try {
            if (config.type === 'text' && config.text) {
                console.log(`Applying text watermark at position ${config.position}`);

                const fontSize = config.textSize || 24;
                const approximateCharWidth = fontSize * 0.6;
                const textWidth = config.text.length * approximateCharWidth;
                const textHeight = fontSize;

                const safeMargin = config.padding + textWidth / 2;

                let x, y;

                if (config.position === sharp.gravity.west || config.position === sharp.gravity.northwest || config.position === sharp.gravity.southwest) {
                    x = Math.max(safeMargin, config.padding + textWidth / 2);
                } else if (config.position === sharp.gravity.east || config.position === sharp.gravity.northeast || config.position === sharp.gravity.southeast) {
                    x = dimensions.width - Math.max(safeMargin, config.padding + textWidth / 2);
                } else {
                    // center, north, south
                    x = dimensions.width / 2;
                }

                if (config.position === sharp.gravity.north || config.position === sharp.gravity.northeast || config.position === sharp.gravity.northwest) {
                    y = config.padding + textHeight;
                } else if (config.position === sharp.gravity.south || config.position === sharp.gravity.southeast || config.position === sharp.gravity.southwest) {
                    y = dimensions.height - config.padding;
                } else {
                    // center, east, west
                    y = dimensions.height / 2;
                }

                const svgText = `
            <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
                <style>
                    .text {
                        fill: ${config.textColor};
                        font-family: ${config.textFont}, sans-serif;
                        font-size: ${fontSize}px;
                        text-anchor: middle;
                        dominant-baseline: middle;
                    }
                </style>
                <text x="${x}" y="${y}" class="text">${config.text}</text>
            </svg>`;

                return imageProcessor.composite([{
                    input: Buffer.from(svgText),
                    gravity: 'northwest'
                }]);
            } else if (config.type === 'image' && config.imagePath) {
                if (!fs.existsSync(config.imagePath)) {
                    console.warn(`Watermark image not found: ${config.imagePath}`);
                    return imageProcessor;
                }

                return imageProcessor.composite([{
                    input: config.imagePath,
                    gravity: config.position
                }]);
            }

            return imageProcessor;
        } catch (error) {
            console.error('Error applying watermark:', error);
            return imageProcessor;
        }
    },

    /**
     * Delete all versions of an image from Google Cloud Storage
     */
    async deleteImage(mediumStorageKey: string): Promise<void> {
        try {
            // Extract the base name without the directory prefix
            const parts = mediumStorageKey.split('/');
            const filename = parts[parts.length - 1];
            const fileBase = filename.replace('.webp', '');
            const dirPrefix = parts.slice(0, -1).join('/');

            // Create storage keys for all three versions
            const storageKeys = [
                mediumStorageKey, // Medium
                `${dirPrefix}/${fileBase}_thumb.webp`, // Thumbnail
                `${dirPrefix}/${fileBase}_large.webp` // High quality
            ];

            // Delete all versions
            await Promise.all(storageKeys.map(key =>
                bucket.file(key).delete().catch(err => {
                    console.warn(`Failed to delete image ${key}:`, err);
                })
            ));

            console.log(`Successfully deleted images with base: ${mediumStorageKey}`);
        } catch (error) {
            console.error(`Error deleting images with base ${mediumStorageKey}:`, error);
            throw new Error(`Failed to delete images with base: ${mediumStorageKey}`);
        }
    },
};
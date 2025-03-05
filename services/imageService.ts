import {SaveOptions, Storage} from '@google-cloud/storage';
import sharp from 'sharp';
import {v4 as uuidv4} from 'uuid';

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

// Initialize Google Cloud Storage
// @todo extract?
const storage = new Storage({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
});

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);
const cdnBaseUrl = process.env.GOOGLE_CLOUD_CDN_BASE_URL;

export const ImageService = {
    /**
     * Process an image and upload it to Google Cloud Storage
     * Creates three versions: thumbnail, medium, and high quality
     */
    async processAndUploadImage(file: Buffer): Promise<ProcessedImage> {
        try {
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

                const processedImage = await sharp(file)
                    .resize(version.width, version.height, {
                        fit: 'cover',
                        position: 'center',
                    })
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

                return {
                    version: version.name,
                    url,
                    cdnUrl,
                    storageKey
                };
            }));

            // Build the result object
            const thumbnail = results.find(r => r.version === 'thumbnail')!;
            const medium = results.find(r => r.version === 'medium')!;
            const highQuality = results.find(r => r.version === 'highQuality')!;

            return {
                // Medium (standard)
                mediumUrl: medium.url,
                mediumCdnUrl: medium.cdnUrl,
                mediumStorageKey: medium.storageKey,

                // Thumbnail
                thumbnailUrl: thumbnail.url,
                thumbnailCdnUrl: thumbnail.cdnUrl,
                thumbnailStorageKey: thumbnail.storageKey,

                // High quality
                highQualityUrl: highQuality.url,
                highQualityCdnUrl: highQuality.cdnUrl,
                highQualityStorageKey: highQuality.storageKey
            };
        } catch (error) {
            console.error('Error processing and uploading image:', error);
            throw new Error('Failed to process and upload image');
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
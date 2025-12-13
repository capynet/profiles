import type {NextConfig} from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
    experimental: {
        authInterrupts: true,
        serverActions: {
            bodySizeLimit: '10mb',
            allowedOrigins: ['*'],
        },
        optimizePackageImports: ['@react-google-maps/api'],
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: '*.googleusercontent.com',
            }
        ],
        formats: ['image/webp', 'image/avif'],
        minimumCacheTTL: 31536000, // Cache images for 1 year (in seconds)
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.optimization.splitChunks.cacheGroups = {
                ...config.optimization.splitChunks.cacheGroups,
                googlemaps: {
                    test: /[\\/]node_modules[\\/]@react-google-maps[\\/]/,
                    name: 'googlemaps',
                    chunks: 'all',
                    priority: 10,
                },
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 5,
                }
            };
        }
        return config;
    },
    reactStrictMode: true
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl(nextConfig);
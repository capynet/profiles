import type {NextConfig} from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    experimental: {
        authInterrupts: true,
        serverActions: {
            bodySizeLimit: '10mb',
            allowedOrigins: ['*'],
        },
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
    },
    compress: true,
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
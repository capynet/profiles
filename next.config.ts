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
    },
    reactStrictMode: true
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
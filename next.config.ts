import type {NextConfig} from "next";

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

export default nextConfig;
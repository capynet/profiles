import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
            allowedOrigins: ['*'],
        },
    },
    images: {
        domains: ['localhost', 'example.com'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    reactStrictMode: true,
    swcMinify: true,
};

export default nextConfig;
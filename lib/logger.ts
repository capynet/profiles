// lib/logger.ts
import pino from 'pino';

// Create base logger
// Use JSON logging to avoid pino-pretty worker issues in Next.js dev mode
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
        level: (label) => {
            return { level: label };
        },
    },
    base: {
        env: process.env.NODE_ENV || 'development',
    },
});

// Helper for API routes
export function createApiLogger(route: string, method: string) {
    return logger.child({
        type: 'api',
        route,
        method,
    });
}

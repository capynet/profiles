// lib/logger.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

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

// Helper to create a child logger with context
export function createLogger(context: Record<string, any>) {
    return logger.child(context);
}

// Helper for API routes
export function createApiLogger(route: string, method: string) {
    return logger.child({
        type: 'api',
        route,
        method,
    });
}

// Helper for server actions
export function createActionLogger(action: string) {
    return logger.child({
        type: 'action',
        action,
    });
}

export default logger;

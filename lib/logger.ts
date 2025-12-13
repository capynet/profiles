// lib/logger.ts
import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Create base logger
// In development, we use a simpler approach to avoid worker issues with Next.js
export const logger = isDevelopment
    ? pino({
          level: process.env.LOG_LEVEL || 'info',
          transport: {
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss',
                  ignore: 'pid,hostname',
                  singleLine: false,
              },
          },
      })
    : pino({
          level: process.env.LOG_LEVEL || 'info',
          formatters: {
              level: (label) => {
                  return { level: label };
              },
          },
          base: {
              env: process.env.NODE_ENV,
              revision: process.env.VERCEL_GIT_COMMIT_SHA,
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

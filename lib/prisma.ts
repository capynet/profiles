import { PrismaClient } from '@prisma/client';

// Previene múltiples instancias de Prisma Client en desarrollo
declare global {
    var prisma: PrismaClient | undefined;
}

// Configuración de Prisma Client optimizado para Vercel y Neon
const prismaClientSingleton = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        // Configuración para manejar conexiones en Vercel Serverless
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        // Extender el timeout de conexión para el cold start de Neon
        connectionTimeout: 20_000, // 20 segundos
    });
};

// Usar globalThis para mantener una única instancia en desarrollo
// En producción (Vercel), cada función serverless recibe una nueva instancia
const prisma = globalThis.prisma ?? prismaClientSingleton();

// Asignar a globalThis.prisma solo en desarrollo
if (process.env.NODE_ENV === 'development') globalThis.prisma = prisma;

export default prisma;
# Sistema de Logging

Este proyecto usa [Pino](https://getpino.io/) para logging estructurado, compatible con desarrollo local y Vercel.

## Características

- 🎨 **Pretty print en desarrollo**: Logs con colores y formato legible
- 📊 **JSON estructurado en producción**: Fácil de parsear en Vercel
- 🔍 **Contexto automático**: Incluye environment, git commit, timestamps
- 🚀 **Alto rendimiento**: Pino es uno de los loggers más rápidos de Node.js

## Uso Básico

```typescript
import logger from '@/lib/logger';

// Logs simples
logger.info('User logged in');
logger.warn('Rate limit approaching');
logger.error('Database connection failed');

// Logs con contexto
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ error: err.message, stack: err.stack }, 'Failed to process request');
```

## API Routes

Para API routes, usa `createApiLogger`:

```typescript
import { createApiLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    const log = createApiLogger('/api/users', 'POST');

    try {
        log.info({ userId: user.id }, 'Creating user');
        // ... tu código
        log.info({ userId: newUser.id }, 'User created successfully');

        return NextResponse.json(newUser);
    } catch (error) {
        log.error({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to create user');

        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
```

## Server Actions

Para Server Actions, usa `createActionLogger`:

```typescript
import { createActionLogger } from '@/lib/logger';

export async function updateProfile(data: ProfileData) {
    const log = createActionLogger('updateProfile');

    log.info({ profileId: data.id }, 'Updating profile');

    try {
        // ... tu código
        log.info({ profileId: result.id }, 'Profile updated');
        return result;
    } catch (error) {
        log.error({ error }, 'Update failed');
        throw error;
    }
}
```

## Loggers con Contexto Personalizado

```typescript
import { createLogger } from '@/lib/logger';

const paymentLogger = createLogger({
    service: 'payment',
    provider: 'stripe'
});

paymentLogger.info({ amount: 100 }, 'Processing payment');
// Output: { service: 'payment', provider: 'stripe', amount: 100, msg: 'Processing payment' }
```

## Niveles de Log

- **trace**: Información muy detallada de debugging
- **debug**: Información de debugging
- **info**: Eventos informativos normales
- **warn**: Advertencias que no son errores
- **error**: Errores que requieren atención
- **fatal**: Errores críticos que causan shutdown

Por defecto usa `info`. Puedes cambiar el nivel con la variable de entorno:

```bash
# .env.local
LOG_LEVEL=debug
```

## Visualización en Vercel

En Vercel, los logs aparecen automáticamente en:
1. **Runtime Logs**: Logs en tiempo real durante requests
2. **Function Logs**: Por cada función serverless

Vercel parsea automáticamente los logs JSON de Pino y los muestra con formato.

## Mejores Prácticas

### ✅ Hacer

```typescript
// Incluir contexto útil
log.info({ userId, action: 'purchase', amount }, 'Purchase completed');

// Loggear errores con stack trace
log.error({
    error: err.message,
    stack: err.stack,
    userId
}, 'Failed to process purchase');

// Usar el nivel apropiado
log.warn({ remaining: 10 }, 'API quota almost exhausted');
```

### ❌ Evitar

```typescript
// NO incluir datos sensibles
log.info({ password: user.password }, 'User login'); // ❌

// NO usar console.log
console.log('Something happened'); // ❌ Usar logger.info

// NO loggear en loops sin throttling
for (const item of items) {
    log.info({ item }, 'Processing'); // ❌ Demasiados logs
}
```

## Datos Sensibles

**NUNCA** loggees:
- Contraseñas
- Tokens de autenticación
- Números de tarjeta de crédito
- Claves API
- Información personal identificable (PII) sin enmascarar

## Performance

Pino es extremadamente rápido porque:
- Serialización JSON asíncrona
- Escritura no bloqueante
- Mínimo overhead en producción

En desarrollo con pretty-printing hay un pequeño overhead, pero es negligible.

## Ejemplo Completo

```typescript
import { createApiLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const log = createApiLogger('/api/admin/entities/[type]/[id]', 'DELETE');

    try {
        const { id } = await params;
        const entityId = parseInt(id);

        log.info({ entityId }, 'Attempting to delete entity');

        // Verificar si está en uso
        const usage = await checkUsage(entityId);

        if (usage.inUse) {
            log.info({
                entityId,
                affectedProfiles: usage.count
            }, 'Entity in use, requesting replacement');

            return NextResponse.json({
                inUse: true,
                affectedProfiles: usage.count
            }, { status: 409 });
        }

        // Eliminar
        await deleteEntity(entityId);

        log.info({
            entityId,
            entityName: usage.name
        }, 'Entity deleted successfully');

        return NextResponse.json({ success: true });

    } catch (error) {
        log.error({
            entityId: params.id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to delete entity');

        return NextResponse.json(
            { error: 'Failed to delete entity' },
            { status: 500 }
        );
    }
}
```

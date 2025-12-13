// app/api/admin/entities/[type]/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import {createApiLogger} from '@/lib/logger';
import {auth} from '@/auth';

type EntityType = 'language' | 'service' | 'paymentMethod' | 'nationality' | 'ethnicity';

// Map entity types to Prisma models
const getModel = (type: EntityType) => {
    switch (type) {
        case 'language': return prisma.language;
        case 'service': return prisma.service;
        case 'paymentMethod': return prisma.paymentMethod;
        case 'nationality': return prisma.nationality;
        case 'ethnicity': return prisma.ethnicity;
        default: return null;
    }
};

// Validate entity type
function isValidEntityType(type: string): type is EntityType {
    return ['language', 'service', 'paymentMethod', 'nationality', 'ethnicity'].includes(type);
}

// POST - Create new entity
export async function POST(
    request: NextRequest,
    {params}: {params: Promise<{type: string}>}
) {
    const log = createApiLogger('/api/admin/entities/[type]', 'POST');

    try {
        await requireAdmin();
        const session = await auth();

        const {type} = await params;

        log.info({type, userId: session?.user?.id}, 'Attempting to create entity');

        if (!isValidEntityType(type)) {
            log.warn({type}, 'Invalid entity type');
            return NextResponse.json({error: 'Invalid entity type'}, {status: 400});
        }

        const body = await request.json();
        const {name} = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            log.warn({type, name}, 'Invalid name provided');
            return NextResponse.json({error: 'Name is required'}, {status: 400});
        }

        let entity: {id: number; name: string} | null = null;

        switch (type) {
            case 'language':
                const existingLang = await prisma.language.findFirst({
                    where: {name: name.trim()},
                });
                if (existingLang) {
                    log.warn({type, name: name.trim(), existingId: existingLang.id}, 'Entity with this name already exists');
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.language.create({
                    data: {name: name.trim()},
                });
                break;

            case 'service':
                const existingService = await prisma.service.findFirst({
                    where: {name: name.trim()},
                });
                if (existingService) {
                    log.warn({type, name: name.trim(), existingId: existingService.id}, 'Entity with this name already exists');
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.service.create({
                    data: {name: name.trim()},
                });
                break;

            case 'paymentMethod':
                const existingPM = await prisma.paymentMethod.findFirst({
                    where: {name: name.trim()},
                });
                if (existingPM) {
                    log.warn({type, name: name.trim(), existingId: existingPM.id}, 'Entity with this name already exists');
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.paymentMethod.create({
                    data: {name: name.trim()},
                });
                break;

            case 'nationality':
                const existingNat = await prisma.nationality.findFirst({
                    where: {name: name.trim()},
                });
                if (existingNat) {
                    log.warn({type, name: name.trim(), existingId: existingNat.id}, 'Entity with this name already exists');
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.nationality.create({
                    data: {name: name.trim()},
                });
                break;

            case 'ethnicity':
                const existingEth = await prisma.ethnicity.findFirst({
                    where: {name: name.trim()},
                });
                if (existingEth) {
                    log.warn({type, name: name.trim(), existingId: existingEth.id}, 'Entity with this name already exists');
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.ethnicity.create({
                    data: {name: name.trim()},
                });
                break;
        }

        log.info({type, entityId: entity?.id, entityName: entity?.name}, 'Entity created successfully');

        return NextResponse.json(entity, {status: 201});
    } catch (error) {
        log.error({
            type: await params.then(p => p.type),
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to create entity');

        return NextResponse.json({error: 'Failed to create entity'}, {status: 500});
    }
}

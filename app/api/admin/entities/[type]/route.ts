// app/api/admin/entities/[type]/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';

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
    try {
        await requireAdmin();

        const {type} = await params;
        if (!isValidEntityType(type)) {
            return NextResponse.json({error: 'Invalid entity type'}, {status: 400});
        }

        const body = await request.json();
        const {name} = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({error: 'Name is required'}, {status: 400});
        }

        let entity: {id: number; name: string} | null = null;

        switch (type) {
            case 'language':
                const existingLang = await prisma.language.findFirst({
                    where: {name: name.trim()},
                });
                if (existingLang) {
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
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.ethnicity.create({
                    data: {name: name.trim()},
                });
                break;
        }

        return NextResponse.json(entity, {status: 201});
    } catch (error) {
        console.error('Error creating entity:', error);
        return NextResponse.json({error: 'Failed to create entity'}, {status: 500});
    }
}

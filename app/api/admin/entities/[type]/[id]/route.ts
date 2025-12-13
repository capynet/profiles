// app/api/admin/entities/[type]/[id]/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {prisma} from '@/prisma';
import {requireAdmin} from '@/lib/auth-utils';
import {auth} from '@/auth';
import {createApiLogger} from '@/lib/logger';

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

// Map entity types to their profile relation names
const getProfileRelation = (type: EntityType) => {
    switch (type) {
        case 'language': return 'languages';
        case 'service': return 'services';
        case 'paymentMethod': return 'paymentMethods';
        case 'nationality': return 'nationalities';
        case 'ethnicity': return 'ethnicities';
    }
};

// Map entity types to their join table names for direct queries
const getJoinTableName = (type: EntityType): string => {
    switch (type) {
        case 'language': return 'profileLanguage';
        case 'service': return 'profileService';
        case 'paymentMethod': return 'profilePaymentMethod';
        case 'nationality': return 'profileNationality';
        case 'ethnicity': return 'profileEthnicity';
    }
};

// Map entity types to capitalized form for EntityReplacement
const getEntityTypeName = (type: EntityType): string => {
    switch (type) {
        case 'language': return 'Language';
        case 'service': return 'Service';
        case 'paymentMethod': return 'PaymentMethod';
        case 'nationality': return 'Nationality';
        case 'ethnicity': return 'Ethnicity';
    }
};

// Validate entity type
function isValidEntityType(type: string): type is EntityType {
    return ['language', 'service', 'paymentMethod', 'nationality', 'ethnicity'].includes(type);
}

// PUT - Update entity name
export async function PUT(
    request: NextRequest,
    {params}: {params: Promise<{type: string; id: string}>}
) {
    try {
        await requireAdmin();

        const {type, id} = await params;
        const entityId = parseInt(id);

        if (!isValidEntityType(type) || isNaN(entityId)) {
            return NextResponse.json({error: 'Invalid parameters'}, {status: 400});
        }

        const body = await request.json();
        const {name} = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json({error: 'Name is required'}, {status: 400});
        }

        let entity: {id: number; name: string} | null = null;

        switch (type) {
            case 'language':
                // Check for duplicate
                const existingLang = await prisma.language.findFirst({
                    where: {name: name.trim(), id: {not: entityId}},
                });
                if (existingLang) {
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.language.update({
                    where: {id: entityId},
                    data: {name: name.trim()},
                });
                break;

            case 'service':
                const existingService = await prisma.service.findFirst({
                    where: {name: name.trim(), id: {not: entityId}},
                });
                if (existingService) {
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.service.update({
                    where: {id: entityId},
                    data: {name: name.trim()},
                });
                break;

            case 'paymentMethod':
                const existingPM = await prisma.paymentMethod.findFirst({
                    where: {name: name.trim(), id: {not: entityId}},
                });
                if (existingPM) {
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.paymentMethod.update({
                    where: {id: entityId},
                    data: {name: name.trim()},
                });
                break;

            case 'nationality':
                const existingNat = await prisma.nationality.findFirst({
                    where: {name: name.trim(), id: {not: entityId}},
                });
                if (existingNat) {
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.nationality.update({
                    where: {id: entityId},
                    data: {name: name.trim()},
                });
                break;

            case 'ethnicity':
                const existingEth = await prisma.ethnicity.findFirst({
                    where: {name: name.trim(), id: {not: entityId}},
                });
                if (existingEth) {
                    return NextResponse.json({error: 'An entity with this name already exists'}, {status: 409});
                }
                entity = await prisma.ethnicity.update({
                    where: {id: entityId},
                    data: {name: name.trim()},
                });
                break;
        }

        return NextResponse.json(entity);
    } catch (error) {
        console.error('Error updating entity:', error);
        return NextResponse.json({error: 'Failed to update entity'}, {status: 500});
    }
}

// DELETE - Delete entity (with usage check and replacement support)
export async function DELETE(
    request: NextRequest,
    {params}: {params: Promise<{type: string; id: string}>}
) {
    const log = createApiLogger('/api/admin/entities/[type]/[id]', 'DELETE');

    try {
        await requireAdmin();
        const session = await auth();

        const {type, id} = await params;
        const entityId = parseInt(id);

        log.info({type, entityId, userId: session?.user?.id}, 'Attempting to delete entity');

        if (!isValidEntityType(type) || isNaN(entityId)) {
            return NextResponse.json({error: 'Invalid parameters'}, {status: 400});
        }

        // Get entity info before deletion
        let entity: {id: number; name: string} | null = null;

        switch (type) {
            case 'language':
                entity = await prisma.language.findUnique({where: {id: entityId}});
                break;
            case 'service':
                entity = await prisma.service.findUnique({where: {id: entityId}});
                break;
            case 'paymentMethod':
                entity = await prisma.paymentMethod.findUnique({where: {id: entityId}});
                break;
            case 'nationality':
                entity = await prisma.nationality.findUnique({where: {id: entityId}});
                break;
            case 'ethnicity':
                entity = await prisma.ethnicity.findUnique({where: {id: entityId}});
                break;
        }

        if (!entity) {
            return NextResponse.json({error: 'Entity not found'}, {status: 404});
        }

        // Check if entity is used in any active profiles
        let profilesUsing: Array<{id: number; name: string}> = [];

        switch (type) {
            case 'language':
                profilesUsing = await prisma.profile.findMany({
                    where: {
                        published: true,
                        isDraft: false,
                        languages: { some: { languageId: entityId } },
                    },
                    select: {id: true, name: true},
                });
                break;
            case 'service':
                profilesUsing = await prisma.profile.findMany({
                    where: {
                        published: true,
                        isDraft: false,
                        services: { some: { serviceId: entityId } },
                    },
                    select: {id: true, name: true},
                });
                break;
            case 'paymentMethod':
                profilesUsing = await prisma.profile.findMany({
                    where: {
                        published: true,
                        isDraft: false,
                        paymentMethods: { some: { paymentMethodId: entityId } },
                    },
                    select: {id: true, name: true},
                });
                break;
            case 'nationality':
                profilesUsing = await prisma.profile.findMany({
                    where: {
                        published: true,
                        isDraft: false,
                        nationalities: { some: { nationalityId: entityId } },
                    },
                    select: {id: true, name: true},
                });
                break;
            case 'ethnicity':
                profilesUsing = await prisma.profile.findMany({
                    where: {
                        published: true,
                        isDraft: false,
                        ethnicities: { some: { ethnicityId: entityId } },
                    },
                    select: {id: true, name: true},
                });
                break;
        }

        // Parse replacement info from request
        const body = await request.json().catch(() => ({}));
        const {replacementId} = body;

        if (profilesUsing.length > 0 && replacementId === undefined) {
            // Entity is in use and no replacement specified - ask for replacement
            log.info({
                type,
                entityId,
                affectedProfiles: profilesUsing.length,
            }, 'Entity is in use, requesting replacement decision');

            return NextResponse.json({
                error: 'Entity is in use by active profiles',
                inUse: true,
                affectedProfiles: profilesUsing.length,
                profiles: profilesUsing,
            }, {status: 409});
        }

        // If we reach here, either no profiles use it, or a replacement was specified
        const replacementEntityId = replacementId ? parseInt(replacementId) : null;

        // Validate replacement if provided and get its name
        let replacementEntityName: string | null = null;
        if (replacementEntityId !== null) {
            if (isNaN(replacementEntityId)) {
                return NextResponse.json({error: 'Invalid replacement ID'}, {status: 400});
            }

            let replacementEntity: {id: number; name: string} | null = null;

            switch (type) {
                case 'language':
                    replacementEntity = await prisma.language.findUnique({where: {id: replacementEntityId}});
                    break;
                case 'service':
                    replacementEntity = await prisma.service.findUnique({where: {id: replacementEntityId}});
                    break;
                case 'paymentMethod':
                    replacementEntity = await prisma.paymentMethod.findUnique({where: {id: replacementEntityId}});
                    break;
                case 'nationality':
                    replacementEntity = await prisma.nationality.findUnique({where: {id: replacementEntityId}});
                    break;
                case 'ethnicity':
                    replacementEntity = await prisma.ethnicity.findUnique({where: {id: replacementEntityId}});
                    break;
            }

            if (!replacementEntity) {
                return NextResponse.json({error: 'Replacement entity not found'}, {status: 404});
            }

            replacementEntityName = replacementEntity.name;
        }

        // Start transaction
        await prisma.$transaction(async (tx) => {
            // Record the replacement/deletion
            await tx.entityReplacement.create({
                data: {
                    entityType: getEntityTypeName(type),
                    oldEntityId: entityId,
                    newEntityId: replacementEntityId,
                    oldEntityName: entity.name,
                    newEntityName: replacementEntityName,
                    createdBy: session?.user?.id || 'unknown',
                },
            });

            // Apply replacement to active profiles
            if (profilesUsing.length > 0) {
                for (const profile of profilesUsing) {
                    switch (type) {
                        case 'language':
                            // Delete old relation
                            await tx.profileLanguage.deleteMany({
                                where: {
                                    profileId: profile.id,
                                    languageId: entityId,
                                },
                            });

                            // Add new relation if replacement specified
                            if (replacementEntityId !== null) {
                                const existing = await tx.profileLanguage.findUnique({
                                    where: {
                                        profileId_languageId: {
                                            profileId: profile.id,
                                            languageId: replacementEntityId,
                                        },
                                    },
                                });

                                if (!existing) {
                                    await tx.profileLanguage.create({
                                        data: {
                                            profileId: profile.id,
                                            languageId: replacementEntityId,
                                        },
                                    });
                                }
                            }
                            break;

                        case 'service':
                            await tx.profileService.deleteMany({
                                where: {
                                    profileId: profile.id,
                                    serviceId: entityId,
                                },
                            });

                            if (replacementEntityId !== null) {
                                const existing = await tx.profileService.findUnique({
                                    where: {
                                        profileId_serviceId: {
                                            profileId: profile.id,
                                            serviceId: replacementEntityId,
                                        },
                                    },
                                });

                                if (!existing) {
                                    await tx.profileService.create({
                                        data: {
                                            profileId: profile.id,
                                            serviceId: replacementEntityId,
                                        },
                                    });
                                }
                            }
                            break;

                        case 'paymentMethod':
                            await tx.profilePaymentMethod.deleteMany({
                                where: {
                                    profileId: profile.id,
                                    paymentMethodId: entityId,
                                },
                            });

                            if (replacementEntityId !== null) {
                                const existing = await tx.profilePaymentMethod.findUnique({
                                    where: {
                                        profileId_paymentMethodId: {
                                            profileId: profile.id,
                                            paymentMethodId: replacementEntityId,
                                        },
                                    },
                                });

                                if (!existing) {
                                    await tx.profilePaymentMethod.create({
                                        data: {
                                            profileId: profile.id,
                                            paymentMethodId: replacementEntityId,
                                        },
                                    });
                                }
                            }
                            break;

                        case 'nationality':
                            await tx.profileNationality.deleteMany({
                                where: {
                                    profileId: profile.id,
                                    nationalityId: entityId,
                                },
                            });

                            if (replacementEntityId !== null) {
                                const existing = await tx.profileNationality.findUnique({
                                    where: {
                                        profileId_nationalityId: {
                                            profileId: profile.id,
                                            nationalityId: replacementEntityId,
                                        },
                                    },
                                });

                                if (!existing) {
                                    await tx.profileNationality.create({
                                        data: {
                                            profileId: profile.id,
                                            nationalityId: replacementEntityId,
                                        },
                                    });
                                }
                            }
                            break;

                        case 'ethnicity':
                            await tx.profileEthnicity.deleteMany({
                                where: {
                                    profileId: profile.id,
                                    ethnicityId: entityId,
                                },
                            });

                            if (replacementEntityId !== null) {
                                const existing = await tx.profileEthnicity.findUnique({
                                    where: {
                                        profileId_ethnicityId: {
                                            profileId: profile.id,
                                            ethnicityId: replacementEntityId,
                                        },
                                    },
                                });

                                if (!existing) {
                                    await tx.profileEthnicity.create({
                                        data: {
                                            profileId: profile.id,
                                            ethnicityId: replacementEntityId,
                                        },
                                    });
                                }
                            }
                            break;
                    }
                }
            }

            // Delete relations in profile VERSION tables (historical data)
            // This is necessary because these tables also have foreign keys to the entities
            switch (type) {
                case 'language':
                    await tx.profileVersionLanguage.deleteMany({
                        where: {languageId: entityId},
                    });
                    break;
                case 'service':
                    await tx.profileVersionService.deleteMany({
                        where: {serviceId: entityId},
                    });
                    break;
                case 'paymentMethod':
                    await tx.profileVersionPaymentMethod.deleteMany({
                        where: {paymentMethodId: entityId},
                    });
                    break;
                case 'nationality':
                    await tx.profileVersionNationality.deleteMany({
                        where: {nationalityId: entityId},
                    });
                    break;
                case 'ethnicity':
                    await tx.profileVersionEthnicity.deleteMany({
                        where: {ethnicityId: entityId},
                    });
                    break;
            }

            // Finally, delete the entity itself
            switch (type) {
                case 'language':
                    await tx.language.delete({where: {id: entityId}});
                    break;
                case 'service':
                    await tx.service.delete({where: {id: entityId}});
                    break;
                case 'paymentMethod':
                    await tx.paymentMethod.delete({where: {id: entityId}});
                    break;
                case 'nationality':
                    await tx.nationality.delete({where: {id: entityId}});
                    break;
                case 'ethnicity':
                    await tx.ethnicity.delete({where: {id: entityId}});
                    break;
            }
        });

        log.info({
            type,
            entityId,
            entityName: entity.name,
            replacementId: replacementEntityId,
            replacementName: replacementEntityName,
            affectedProfiles: profilesUsing.length,
        }, 'Entity deleted successfully');

        return NextResponse.json({
            success: true,
            replacedInProfiles: profilesUsing.length,
        });
    } catch (error) {
        log.error({
            type,
            entityId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to delete entity');

        return NextResponse.json({error: 'Failed to delete entity'}, {status: 500});
    }
}

// lib/entity-replacement.ts
import {prisma} from '@/prisma';
import {PrismaClient} from '@prisma/client';

type EntityType = 'Language' | 'Service' | 'PaymentMethod' | 'Nationality' | 'Ethnicity';

interface AppliedReplacement {
    entityType: string;
    oldName: string;
    newName: string | null;
    action: 'replaced' | 'removed';
}

/**
 * Get all entity IDs currently used by a profile
 */
async function getProfileEntityIds(profileId: number, tx: any) {
    const profile = await tx.profile.findUnique({
        where: {id: profileId},
        include: {
            languages: {select: {languageId: true}},
            services: {select: {serviceId: true}},
            paymentMethods: {select: {paymentMethodId: true}},
            nationalities: {select: {nationalityId: true}},
            ethnicities: {select: {ethnicityId: true}},
        },
    });

    if (!profile) {
        throw new Error(`Profile ${profileId} not found`);
    }

    return {
        languages: profile.languages.map((l: any) => l.languageId),
        services: profile.services.map((s: any) => s.serviceId),
        paymentMethods: profile.paymentMethods.map((p: any) => p.paymentMethodId),
        nationalities: profile.nationalities.map((n: any) => n.nationalityId),
        ethnicities: profile.ethnicities.map((e: any) => e.ethnicityId),
    };
}

/**
 * Get join table name for an entity type
 */
function getJoinTableName(entityType: EntityType): string {
    switch (entityType) {
        case 'Language':
            return 'profileLanguage';
        case 'Service':
            return 'profileService';
        case 'PaymentMethod':
            return 'profilePaymentMethod';
        case 'Nationality':
            return 'profileNationality';
        case 'Ethnicity':
            return 'profileEthnicity';
    }
}

/**
 * Get foreign key column name for an entity type
 */
function getForeignKeyColumn(entityType: EntityType): string {
    switch (entityType) {
        case 'Language':
            return 'languageId';
        case 'Service':
            return 'serviceId';
        case 'PaymentMethod':
            return 'paymentMethodId';
        case 'Nationality':
            return 'nationalityId';
        case 'Ethnicity':
            return 'ethnicityId';
    }
}

/**
 * Apply entity replacements to a profile when it becomes active
 * Returns a list of replacements that were applied
 */
export async function applyEntityReplacements(
    profileId: number,
    tx: any = prisma
): Promise<AppliedReplacement[]> {
    const appliedReplacements: AppliedReplacement[] = [];

    // Get current entity IDs for this profile
    const currentEntityIds = await getProfileEntityIds(profileId, tx);

    // Get all replacements
    const replacements = await tx.entityReplacement.findMany({
        orderBy: {createdAt: 'asc'},
    });

    for (const replacement of replacements) {
        const entityType = replacement.entityType as EntityType;
        const joinTableName = getJoinTableName(entityType);
        const foreignKeyColumn = getForeignKeyColumn(entityType);

        // Check if profile uses the old entity
        let usesOldEntity = false;
        switch (entityType) {
            case 'Language':
                usesOldEntity = currentEntityIds.languages.includes(replacement.oldEntityId);
                break;
            case 'Service':
                usesOldEntity = currentEntityIds.services.includes(replacement.oldEntityId);
                break;
            case 'PaymentMethod':
                usesOldEntity = currentEntityIds.paymentMethods.includes(replacement.oldEntityId);
                break;
            case 'Nationality':
                usesOldEntity = currentEntityIds.nationalities.includes(replacement.oldEntityId);
                break;
            case 'Ethnicity':
                usesOldEntity = currentEntityIds.ethnicities.includes(replacement.oldEntityId);
                break;
        }

        if (!usesOldEntity) {
            continue; // This profile doesn't use this old entity, skip
        }

        // Delete old relation
        await (tx as any)[joinTableName].deleteMany({
            where: {
                profileId: profileId,
                [foreignKeyColumn]: replacement.oldEntityId,
            },
        });

        // If there's a replacement, add it
        if (replacement.newEntityId !== null) {
            // Check if replacement already exists
            const existingReplacement = await (tx as any)[joinTableName].findFirst({
                where: {
                    profileId: profileId,
                    [foreignKeyColumn]: replacement.newEntityId,
                },
            });

            // Only create if doesn't already exist
            if (!existingReplacement) {
                await (tx as any)[joinTableName].create({
                    data: {
                        profileId: profileId,
                        [foreignKeyColumn]: replacement.newEntityId,
                    },
                });
            }

            appliedReplacements.push({
                entityType: replacement.entityType,
                oldName: replacement.oldEntityName,
                newName: replacement.newEntityName,
                action: 'replaced',
            });
        } else {
            // No replacement, just removed
            appliedReplacements.push({
                entityType: replacement.entityType,
                oldName: replacement.oldEntityName,
                newName: null,
                action: 'removed',
            });
        }
    }

    return appliedReplacements;
}

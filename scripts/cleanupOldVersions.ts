// scripts/cleanupOldVersions.ts
// Cleans up old versions keeping only the latest N versions per profile

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

const MAX_VERSIONS_PER_PROFILE = parseInt(process.env.PROFILE_VERSION_MAX_COUNT || '20');

async function main() {
    console.log(`🧹 Starting version cleanup (keeping last ${MAX_VERSIONS_PER_PROFILE} versions per profile)...\n`);

    // Get all profiles that have versions
    const profilesWithVersions = await prisma.profile.findMany({
        where: {
            versions: {
                some: {}
            }
        },
        include: {
            versions: {
                orderBy: { version: 'desc' },
                select: { id: true, version: true, createdAt: true }
            }
        }
    });

    console.log(`Found ${profilesWithVersions.length} profiles with version history\n`);

    let totalDeleted = 0;
    let profilesProcessed = 0;

    for (const profile of profilesWithVersions) {
        const versionCount = profile.versions.length;

        if (versionCount <= MAX_VERSIONS_PER_PROFILE) {
            console.log(`✓ Profile ${profile.id} - ${versionCount} versions (within limit, skipping)`);
            continue;
        }

        // Get versions to delete (oldest ones beyond the limit)
        const versionsToDelete = profile.versions.slice(MAX_VERSIONS_PER_PROFILE);

        console.log(`📦 Profile ${profile.id} - ${versionCount} versions, deleting ${versionsToDelete.length} oldest:`);

        let deleted = 0;
        for (const version of versionsToDelete) {
            try {
                // Delete version relationships
                await prisma.profileVersionLanguage.deleteMany({
                    where: { versionId: version.id }
                });
                await prisma.profileVersionPaymentMethod.deleteMany({
                    where: { versionId: version.id }
                });
                await prisma.profileVersionNationality.deleteMany({
                    where: { versionId: version.id }
                });
                await prisma.profileVersionEthnicity.deleteMany({
                    where: { versionId: version.id }
                });
                await prisma.profileVersionService.deleteMany({
                    where: { versionId: version.id }
                });
                await prisma.profileVersionImage.deleteMany({
                    where: { versionId: version.id }
                });

                // Delete the version itself
                await prisma.profileVersion.delete({
                    where: { id: version.id }
                });

                deleted++;
                console.log(`  ✓ Deleted version ${version.version} (${version.createdAt.toISOString().split('T')[0]})`);
            } catch (error) {
                console.error(`  ❌ Failed to delete version ${version.version}:`, error);
            }
        }

        totalDeleted += deleted;
        profilesProcessed++;
        console.log();
    }

    console.log(`📊 Cleanup Summary:`);
    console.log(`  Profiles processed: ${profilesProcessed}`);
    console.log(`  Versions deleted:   ${totalDeleted}`);
    console.log(`  Retention policy:   Keep last ${MAX_VERSIONS_PER_PROFILE} versions`);
}

main()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

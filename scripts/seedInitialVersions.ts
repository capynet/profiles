// scripts/seedInitialVersions.ts
// Creates initial baseline versions for all existing published profiles

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔄 Starting initial version seeding...\n');

    // Get all published, non-draft profiles
    const profiles = await prisma.profile.findMany({
        where: {
            isDraft: false,
            published: true
        },
        include: {
            images: { orderBy: { position: 'asc' } },
            languages: true,
            paymentMethods: true,
            nationalities: true,
            ethnicities: true,
            services: true
        }
    });

    console.log(`Found ${profiles.length} published profiles to version\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const profile of profiles) {
        try {
            // Check if version already exists
            const existingVersion = await prisma.profileVersion.findFirst({
                where: { profileId: profile.id }
            });

            if (existingVersion) {
                console.log(`⏭️  Profile ${profile.id} (${profile.name}) - Already has versions, skipping`);
                skipped++;
                continue;
            }

            // Create initial version
            const version = await prisma.profileVersion.create({
                data: {
                    profileId: profile.id,
                    version: 1,
                    name: profile.name,
                    price: profile.price,
                    age: profile.age,
                    description: profile.description,
                    latitude: profile.latitude,
                    longitude: profile.longitude,
                    address: profile.address,
                    phone: profile.phone,
                    hasWhatsapp: profile.hasWhatsapp,
                    hasTelegram: profile.hasTelegram,
                    published: profile.published,
                    createdBy: profile.userId,
                    comment: 'Initial baseline version (migration)'
                }
            });

            // Create image snapshots
            for (const img of profile.images) {
                await prisma.profileVersionImage.create({
                    data: {
                        versionId: version.id,
                        position: img.position,
                        mediumUrl: img.mediumUrl,
                        mediumCdnUrl: img.mediumCdnUrl,
                        mediumStorageKey: img.mediumStorageKey,
                        thumbnailUrl: img.thumbnailUrl,
                        thumbnailCdnUrl: img.thumbnailCdnUrl,
                        thumbnailStorageKey: img.thumbnailStorageKey,
                        highQualityUrl: img.highQualityUrl,
                        highQualityCdnUrl: img.highQualityCdnUrl,
                        highQualityStorageKey: img.highQualityStorageKey
                    }
                });
            }

            // Create relationship snapshots
            for (const lang of profile.languages) {
                await prisma.profileVersionLanguage.create({
                    data: {
                        versionId: version.id,
                        languageId: lang.languageId
                    }
                });
            }

            for (const pm of profile.paymentMethods) {
                await prisma.profileVersionPaymentMethod.create({
                    data: {
                        versionId: version.id,
                        paymentMethodId: pm.paymentMethodId
                    }
                });
            }

            for (const nat of profile.nationalities) {
                await prisma.profileVersionNationality.create({
                    data: {
                        versionId: version.id,
                        nationalityId: nat.nationalityId
                    }
                });
            }

            for (const eth of profile.ethnicities) {
                await prisma.profileVersionEthnicity.create({
                    data: {
                        versionId: version.id,
                        ethnicityId: eth.ethnicityId
                    }
                });
            }

            for (const svc of profile.services) {
                await prisma.profileVersionService.create({
                    data: {
                        versionId: version.id,
                        serviceId: svc.serviceId
                    }
                });
            }

            console.log(`✓ Profile ${profile.id} (${profile.name}) - Created v1 with ${profile.images.length} images`);
            created++;
        } catch (error) {
            console.error(`❌ Profile ${profile.id} - Error:`, error);
            errors++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✓ Created:  ${created}`);
    console.log(`  ⏭️  Skipped:  ${skipped}`);
    console.log(`  ❌ Errors:   ${errors}`);
    console.log(`  📦 Total:    ${profiles.length}`);
}

main()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

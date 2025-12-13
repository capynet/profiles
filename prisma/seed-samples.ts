// prisma/seed-samples.ts
import 'dotenv/config'
import {PrismaClient} from '@prisma/client'
import {PrismaPg} from '@prisma/adapter-pg'
import seedProfiles from './seeders/profiles'
import {logger} from '@/lib/logger'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({adapter})

async function main() {
    logger.info('Starting seed-samples script');
    await seedProfiles(prisma)
    logger.info('Seed-samples script completed successfully');
}

main()
    .catch((e) => {
        logger.error({error: e.message, stack: e.stack}, 'Error seeding');
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
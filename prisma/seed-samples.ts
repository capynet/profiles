// prisma/seed-samples.ts
import 'dotenv/config'
import {PrismaClient} from '@prisma/client'
import {PrismaPg} from '@prisma/adapter-pg'
import seedProfiles from './seeders/profiles'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({adapter})

async function main() {
    await seedProfiles(prisma)
}

main()
    .catch((e) => {
        console.error('Error seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
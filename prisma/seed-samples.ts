// prisma/seed.ts
import {PrismaClient} from '@prisma/client'
import seedProfiles from './seeders/profiles'

const prisma = new PrismaClient()

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
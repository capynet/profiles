// prisma/seed.ts
import {PrismaClient} from '@prisma/client'
import seedLanguages from './seeders/languages'
import seedPaymentMethods from './seeders/paymentMethods'
import seedNationalities from './seeders/nationalities'
import seedEthnicities from './seeders/ethnicities'

const prisma = new PrismaClient()

async function main() {
    // Run seeders in order
    await seedLanguages(prisma)
    await seedPaymentMethods(prisma)
    await seedNationalities(prisma)
    await seedEthnicities(prisma)
}

main()
    .catch((e) => {
        console.error('Error seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
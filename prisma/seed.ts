// prisma/seed.ts
import 'dotenv/config'
import {PrismaClient} from '@prisma/client'
import {PrismaPg} from '@prisma/adapter-pg'
import seedLanguages from './seeders/languages'
import seedPaymentMethods from './seeders/paymentMethods'
import seedNationalities from './seeders/nationalities'
import seedEthnicities from './seeders/ethnicities'
import seedServices from './seeders/services'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})
const prisma = new PrismaClient({adapter})

async function main() {
    // Run seeders in order
    await seedLanguages(prisma)
    await seedPaymentMethods(prisma)
    await seedNationalities(prisma)
    await seedEthnicities(prisma)
    await seedServices(prisma)
}

main()
    .catch((e) => {
        console.error('Error seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
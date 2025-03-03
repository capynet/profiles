import {PrismaClient} from '@prisma/client'
import seedLanguages from './seeders/languages'
import seedPaymentMethods from './seeders/paymentMethods'
import seedProfiles from './seeders/profiles'

const prisma = new PrismaClient()

async function main() {
    // Ejecutar seeders en orden
    await seedLanguages(prisma)
    await seedPaymentMethods(prisma)
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
// prisma/seeders/ethnicities.ts
import { PrismaClient } from '@prisma/client'

const ethnicities = [
    { name: 'N/A' },
    { name: 'African' },
    { name: 'Asian' },
    { name: 'Eastern European (Slavic)' },
    { name: 'Latina' },
    { name: 'European' }
]

export default async function seedEthnicities(prisma: PrismaClient) {
    console.log('Migrating ethnicities...')

    for (const ethnicity of ethnicities) {
        await prisma.ethnicity.upsert({
            where: { name: ethnicity.name },
            update: {},
            create: { name: ethnicity.name }
        })
    }

    console.log('✅ Ethnicities init finished')
}
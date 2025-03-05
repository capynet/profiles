import { PrismaClient } from '@prisma/client'

const languages = [
    { name: 'English' },
    { name: 'Spanish' },
    { name: 'French' },
    { name: 'Germany' },
    { name: 'Italian' }
]

export default async function seedLanguages(prisma: PrismaClient) {
    console.log('Migrating languages...')

    for (const language of languages) {
        await prisma.language.upsert({
            where: { name: language.name },
            update: {},
            create: { name: language.name }
        })
    }

    console.log('✅ Languages init finished')
}
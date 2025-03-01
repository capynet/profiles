import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const languages = [
        {name: 'English'},
        {name: 'Spanish'},
        {name: 'French'},
        {name: 'Germany'},
        {name: 'Italian'}
    ]

    const paymentMethods = [
        {name: 'Cash'},
        {name: 'Card'},
        {name: 'Bizum'}
    ]

    console.log('Migrating languages...')
    for (const language of languages) {
        await prisma.language.upsert({
            where: {name: language.name},
            update: {},
            create: {name: language.name}
        })
    }
    console.log('✅ Languages init finished')

    console.log('Migrating payment methods...')
    for (const method of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: {name: method.name},
            update: {},
            create: {name: method.name}
        })
    }
    console.log('✅ Payment method  init finished')
}

main()
    .catch((e) => {
        console.error('Error seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
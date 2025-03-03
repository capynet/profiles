import { PrismaClient } from '@prisma/client'

const paymentMethods = [
    { name: 'Cash' },
    { name: 'Card' },
    { name: 'Bizum' }
]

export default async function seedPaymentMethods(prisma: PrismaClient) {
    console.log('Migrating payment methods...')

    for (const method of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: { name: method.name },
            update: {},
            create: { name: method.name }
        })
    }

    console.log('✅ Payment method init finished')
}
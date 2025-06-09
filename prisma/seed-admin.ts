import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'capy.net@gmail.com'
    const adminName = 'Admin'

    console.log(`Creating admin user with email: ${adminEmail}`)

    const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
    })

    if (existingUser) {
        console.log('Admin user already exists, updating role to admin...')
        await prisma.user.update({
            where: { email: adminEmail },
            data: { 
                name: adminName,
                role: 'admin' 
            }
        })
        console.log('Admin user updated successfully')
    } else {
        const adminUser = await prisma.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                role: 'admin'
            }
        })
        console.log('Admin user created successfully:', adminUser)
    }
}

main()
    .catch((e) => {
        console.error('Error creating admin user:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
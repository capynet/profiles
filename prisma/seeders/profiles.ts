import {PrismaClient} from '@prisma/client'
import fs from 'fs'
import path from 'path'

export default async function seedProfiles(prisma: PrismaClient) {
    console.log('Loading users and profiles...')

    const sampleDataPath = path.join(__dirname, './data-sample.json')
    const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf8'))

    for (const data of sampleData) {
        await createUserAndProfile(prisma, data)
    }

    console.log('✅ Users and profiles loaded successfully')
}

async function createUserAndProfile(prisma: PrismaClient, data: any) {
    const user = await prisma.user.upsert({
        where: {email: data.user.email},
        update: {
            name: data.user.name,
            image: data.user.image,
            emailVerified: data.user.emailVerified ? new Date(data.user.emailVerified) : null,
            updatedAt: new Date()
        },
        create: {
            email: data.user.email,
            name: data.user.name,
            image: data.user.image,
            emailVerified: data.user.emailVerified ? new Date(data.user.emailVerified) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    })

    const profile = await prisma.profile.upsert({
        where: {userId: user.id},
        update: {
            name: data.profile.name,
            price: data.profile.price,
            age: data.profile.age,
            image: data.profile.image,
            description: data.profile.description,
            latitude: data.profile.location[0],
            longitude: data.profile.location[1],
            address: data.profile.address,
            updatedAt: new Date(data.profile.updatedAt || new Date())
        },
        create: {
            userId: user.id,
            name: data.profile.name,
            price: data.profile.price,
            age: data.profile.age,
            image: data.profile.image,
            description: data.profile.description,
            latitude: data.profile.location[0],
            longitude: data.profile.location[1],
            address: data.profile.address,
            updatedAt: new Date(data.profile.updatedAt || new Date()),
            createdAt: new Date()
        }
    })

    // Asociar idiomas
    await associateLanguages(prisma, profile.id, data.profile.languages || [])

    // Asociar métodos de pago
    await associatePaymentMethods(prisma, profile.id, data.profile.paymentMethods || [])
}

async function createProfileWithRelations(prisma: PrismaClient, profileData: any) {
    // Crear usuario para el perfil
    const userEmail = `${profileData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`

    const user = await prisma.user.upsert({
        where: {email: userEmail},
        update: {},
        create: {
            email: userEmail,
            name: profileData.name
        }
    })

    // Crear perfil
    const profile = await prisma.profile.upsert({
        where: {userId: user.id},
        update: {
            name: profileData.name,
            price: profileData.price,
            age: profileData.age,
            image: profileData.image,
            description: profileData.description,
            latitude: profileData.location[0],
            longitude: profileData.location[1],
            address: profileData.address,
            updatedAt: new Date(profileData.updatedAt || new Date())
        },
        create: {
            userId: user.id,
            name: profileData.name,
            price: profileData.price,
            age: profileData.age,
            image: profileData.image,
            description: profileData.description,
            latitude: profileData.location[0],
            longitude: profileData.location[1],
            address: profileData.address,
            updatedAt: new Date(profileData.updatedAt || new Date()),
            createdAt: new Date()
        }
    })

    await associateLanguages(prisma, profile.id, profileData.languages || [])

    await associatePaymentMethods(prisma, profile.id, profileData.paymentMethods || [])
}

async function associateLanguages(prisma: PrismaClient, profileId: number, languageIds: number[]) {
    for (const langId of languageIds) {
        await prisma.profileLanguage.upsert({
            where: {
                profileId_languageId: {
                    profileId: profileId,
                    languageId: langId
                }
            },
            update: {},
            create: {
                profileId: profileId,
                languageId: langId
            }
        })
    }
}

async function associatePaymentMethods(prisma: PrismaClient, profileId: number, methodIds: number[]) {
    for (const methodId of methodIds) {
        await prisma.profilePaymentMethod.upsert({
            where: {
                profileId_paymentMethodId: {
                    profileId: profileId,
                    paymentMethodId: methodId
                }
            },
            update: {},
            create: {
                profileId: profileId,
                paymentMethodId: methodId
            }
        })
    }
}
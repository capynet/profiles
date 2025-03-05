// prisma/seeders/profiles.ts
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

    // Crear imágenes múltiples si están presentes
    if (data.profile.images && Array.isArray(data.profile.images)) {
        // Eliminar imágenes existentes si hay
        await prisma.profileImage.deleteMany({
            where: { profileId: profile.id }
        });

        // Crear nuevas imágenes
        for (const imageData of data.profile.images) {
            // Simular proceso de subida a Google Cloud Storage
            // En un entorno real, aquí cargarías la imagen a GCS y obtendrías la cdnUrl
            const gcsBaseUrl = "https://storage.googleapis.com/sample-bucket";
            const cdnUrl = `${gcsBaseUrl}/${imageData.storageKey}`;

            await prisma.profileImage.create({
                data: {
                    profileId: profile.id,
                    url: imageData.url,
                    cdnUrl: cdnUrl, // URL generado "simulando" Google Cloud Storage
                    storageKey: imageData.storageKey
                }
            });
        }
    }

    // Asociar idiomas
    await associateLanguages(prisma, profile.id, data.profile.languages || [])

    // Asociar métodos de pago
    await associatePaymentMethods(prisma, profile.id, data.profile.paymentMethods || [])
}

async function associateLanguages(prisma: PrismaClient, profileId: number, languageIds: number[]) {
    // Primero eliminar asociaciones existentes
    await prisma.profileLanguage.deleteMany({
        where: { profileId }
    });

    // Crear nuevas asociaciones
    for (const langId of languageIds) {
        await prisma.profileLanguage.create({
            data: {
                profileId: profileId,
                languageId: langId
            }
        });
    }
}

async function associatePaymentMethods(prisma: PrismaClient, profileId: number, methodIds: number[]) {
    // Primero eliminar asociaciones existentes
    await prisma.profilePaymentMethod.deleteMany({
        where: { profileId }
    });

    // Crear nuevas asociaciones
    for (const methodId of methodIds) {
        await prisma.profilePaymentMethod.create({
            data: {
                profileId: profileId,
                paymentMethodId: methodId
            }
        });
    }
}
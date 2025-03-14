// prisma/scripts/cleanup.ts
import { PrismaClient } from '@prisma/client';
import { ImageService } from '@/services/imageService';

const prisma = new PrismaClient();

// Flag para eliminar también las imágenes de Google Cloud Storage
const SHOULD_DELETE_IMAGES = true;

// IDs de usuarios que quieres preservar (opcional)
const PRESERVED_USER_IDS: string[] = [
    // Agrega IDs de usuarios que NO quieres eliminar
    // "cm7xdto4e00006x3dhn2ebp30"  // tu usuario de administrador
];

async function cleanup() {
    try {
        console.log('Starting cleanup process...');

        // 1. Obtener usuarios que no están en la lista de preservación
        const usersToDelete = await prisma.user.findMany({
            where: {
                id: {
                    notIn: PRESERVED_USER_IDS
                }
            },
            select: {
                id: true,
                profile: {
                    select: {
                        id: true
                    }
                }
            }
        });

        console.log(`Found ${usersToDelete.length} users to delete`);

        // Extraer IDs de perfiles a eliminar
        const profileIds = usersToDelete
            .filter(user => user.profile)
            .map(user => user.profile?.id)
            .filter(id => id !== undefined) as number[];

        console.log(`Found ${profileIds.length} profiles to delete`);

        // 2. Obtener y guardar las imágenes para eliminarlas de GCS después
        let profileImageData: { mediumStorageKey: string }[] = [];

        if (SHOULD_DELETE_IMAGES) {
            profileImageData = await prisma.profileImage.findMany({
                where: {
                    profileId: {
                        in: profileIds
                    }
                },
                select: { mediumStorageKey: true }
            });
            console.log(`Found ${profileImageData.length} images to delete from storage`);
        }

        // 3. Eliminar en el orden correcto (importante para evitar errores de clave foránea)

        // Primero eliminar las relaciones de payment methods
        const deletedPaymentMethods = await prisma.profilePaymentMethod.deleteMany({
            where: {
                profileId: {
                    in: profileIds
                }
            }
        });
        console.log(`Deleted ${deletedPaymentMethods.count} profile payment method relations`);

        // Luego eliminar las relaciones de languages
        const deletedLanguages = await prisma.profileLanguage.deleteMany({
            where: {
                profileId: {
                    in: profileIds
                }
            }
        });
        console.log(`Deleted ${deletedLanguages.count} profile language relations`);

        // Después eliminar las imágenes de la base de datos
        const deletedImages = await prisma.profileImage.deleteMany({
            where: {
                profileId: {
                    in: profileIds
                }
            }
        });
        console.log(`Deleted ${deletedImages.count} profile images from database`);

        // Ahora eliminar los perfiles
        const deletedProfiles = await prisma.profile.deleteMany({
            where: {
                id: {
                    in: profileIds
                }
            }
        });
        console.log(`Deleted ${deletedProfiles.count} profiles`);

        // Eliminar las sesiones y cuentas asociadas a los usuarios
        const deletedSessions = await prisma.session.deleteMany({
            where: {
                userId: {
                    in: usersToDelete.map(user => user.id)
                }
            }
        });
        console.log(`Deleted ${deletedSessions.count} sessions`);

        const deletedAccounts = await prisma.account.deleteMany({
            where: {
                userId: {
                    in: usersToDelete.map(user => user.id)
                }
            }
        });
        console.log(`Deleted ${deletedAccounts.count} accounts`);

        // Finalmente eliminar los usuarios
        const deletedUsers = await prisma.user.deleteMany({
            where: {
                id: {
                    in: usersToDelete.map(user => user.id)
                }
            }
        });
        console.log(`Deleted ${deletedUsers.count} users`);

        // Eliminar imágenes de Google Cloud Storage
        if (SHOULD_DELETE_IMAGES && profileImageData.length > 0) {
            console.log('Deleting images from Google Cloud Storage...');

            for (const { mediumStorageKey } of profileImageData) {
                try {
                    await ImageService.deleteImage(mediumStorageKey);
                    console.log(`Deleted image: ${mediumStorageKey}`);
                } catch (error) {
                    console.error(`Failed to delete image ${mediumStorageKey}:`, error);
                }
            }
        }

        console.log('Cleanup process completed successfully!');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar la limpieza
cleanup()
    .then(() => console.log('Done!'))
    .catch((e) => console.error(e));
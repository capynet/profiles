import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({adapter});

async function updateImagePositions() {
    try {
        // Obtener todos los perfiles
        const profiles = await prisma.profile.findMany({
            include: {
                images: true
            }
        });

        console.log(`Actualizando posiciones de imágenes para ${profiles.length} perfiles...`);

        // Para cada perfil, actualizar las posiciones de sus imágenes
        for (const profile of profiles) {
            // Asumiendo que queremos mantener el orden actual de imágenes
            const images = profile.images;

            for (let i = 0; i < images.length; i++) {
                await prisma.profileImage.update({
                    where: { id: images[i].id },
                    data: { position: i }
                });
                console.log(`Actualizada posición de imagen ${images[i].id} a ${i}`);
            }
        }

        console.log('Actualización completada con éxito.');
    } catch (error) {
        console.error('Error al actualizar posiciones de imágenes:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateImagePositions()
    .then(() => console.log('Script finalizado.'))
    .catch(e => console.error(e));
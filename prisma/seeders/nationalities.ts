// prisma/seeders/nationalities.ts
import {PrismaClient} from '@prisma/client'

const nationalities = [
    {name: 'N/A'},
    {name: 'Spanish'},
    {name: 'African *'},
    {name: 'Asian *'},
    {name: 'Argentinian'},
    {name: 'Belarusian'},
    {name: 'Brazilian'},
    {name: 'Bulgarian'},
    {name: 'Colombian'},
    {name: 'Czech'},
    {name: 'Ecuadorian'},
    {name: 'French'},
    {name: 'German'},
    {name: 'Greek'},
    {name: 'Hungarian'},
    {name: 'Italian'},
    {name: 'Mexican'},
    {name: 'Polish'},
    {name: 'Portuguese'},
    {name: 'Puerto Rican'},
    {name: 'Romanian'},
    {name: 'Russian'},
    {name: 'Turkish'},
    {name: 'Ukrainian'},
    {name: 'Venezuelan'}
]

export default async function seedNationalities(prisma: PrismaClient) {
    console.log('Migrating nationalities...')

    for (const nationality of nationalities) {
        await prisma.nationality.upsert({
            where: {name: nationality.name},
            update: {},
            create: {name: nationality.name}
        })
    }

    console.log('✅ Nationalities init finished')
}
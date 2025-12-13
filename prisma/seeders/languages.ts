// prisma/seeders/languages.ts
import { PrismaClient } from '@prisma/client'

const languages = [
    // Most common languages with flags in the name
    { name: '🇬🇧 English', enabled: true },
    { name: '🇪🇸 Spanish', enabled: true },
    { name: '🇫🇷 French', enabled: true },
    { name: '🇩🇪 German', enabled: false },
    { name: '🇮🇹 Italian', enabled: false },
    { name: '🇵🇹 Portuguese', enabled: false },
    { name: '🇷🇺 Russian', enabled: false },
    { name: '🇨🇳 Chinese', enabled: false },
    { name: '🇯🇵 Japanese', enabled: false },
    { name: '🇰🇷 Korean', enabled: false },
    { name: '🇸🇦 Arabic', enabled: false },
    { name: '🇮🇳 Hindi', enabled: false },
    { name: '🇹🇷 Turkish', enabled: false },
    { name: '🇳🇱 Dutch', enabled: false },
    { name: '🇸🇪 Swedish', enabled: false },
    { name: '🇳🇴 Norwegian', enabled: false },
    { name: '🇩🇰 Danish', enabled: false },
    { name: '🇫🇮 Finnish', enabled: false },
    { name: '🇵🇱 Polish', enabled: false },
    { name: '🇨🇿 Czech', enabled: false },
    { name: '🇬🇷 Greek', enabled: false },
    { name: '🇮🇱 Hebrew', enabled: false },
    { name: '🇹🇭 Thai', enabled: false },
    { name: '🇻🇳 Vietnamese', enabled: false },
    { name: '🇮🇩 Indonesian', enabled: false },
    { name: '🇲🇾 Malay', enabled: false },
    { name: '🇵🇭 Tagalog', enabled: false },
    { name: '🇷🇴 Romanian', enabled: false },
    { name: '🇭🇺 Hungarian', enabled: false },
    { name: '🇺🇦 Ukrainian', enabled: false },
]

export default async function seedLanguages(prisma: PrismaClient) {
    console.log('Migrating languages...')

    for (const language of languages) {
        await prisma.language.upsert({
            where: { name: language.name },
            update: { enabled: language.enabled },
            create: { name: language.name, enabled: language.enabled }
        })
    }

    console.log('✅ Languages init finished')
}
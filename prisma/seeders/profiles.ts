// prisma/seeders/profiles.ts
import {PrismaClient} from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {ImageService} from '@/services/imageService';

const PROFILES_QTY = 20
const MIN_PRICE = 20
const MAX_PRICE = 500
const MIN_AGE = 18
const MAX_AGE = 60

interface SeedImage {
    fileName: string;
    position: number;
}

interface SeedProfile {
    name: string;
    price: number;
    age: number;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    images: SeedImage[];
    languages: number[];
    paymentMethods: number[];
    nationalityId: number | null; // Added nationality
    ethnicityId: number | null;   // Added ethnicity
}

interface SeedUser {
    name: string;
    email: string;
    image: string | null;
}

interface SeedData {
    user: SeedUser;
    profile: SeedProfile;
}

// Available sample images in the img directory
const SAMPLE_IMAGES = {
    MALE: [
        'man-profile.webp',
        'peruvian-man.webp',
        'spanish-man.webp',
        'brazil-man.webp',
        'usa-man.webp'
    ],
    FEMALE: [
        'woman-profile.webp'
    ]
};

// Málaga coordinates (bounded within the city)
const MALAGA_COORDS = {
    MIN_LAT: 36.68,
    MAX_LAT: 36.73,
    MIN_LNG: -4.45,
    MAX_LNG: -4.35,
};

// Generate random coordinates within Málaga
function getRandomMalagaCoords() {
    const lat = MALAGA_COORDS.MIN_LAT + Math.random() * (MALAGA_COORDS.MAX_LAT - MALAGA_COORDS.MIN_LAT);
    const lng = MALAGA_COORDS.MIN_LNG + Math.random() * (MALAGA_COORDS.MAX_LNG - MALAGA_COORDS.MIN_LNG);
    return {lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6))};
}

// Generate random Málaga addresses
function getRandomMalagaAddress() {
    const streets = [
        'Calle Larios', 'Avenida de Andalucía', 'Calle Alcazabilla', 'Paseo del Parque',
        'Calle Carretería', 'Plaza de la Merced', 'Calle Nueva', 'Calle Granada',
        'Paseo Marítimo Pablo Ruiz Picasso', 'Calle Compañía', 'Avenida de Velázquez',
        'Calle Comedias', 'Avenida Juan Sebastián Elcano', 'Paseo de Reding'
    ];

    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 100) + 1;
    const postalCodes = ['29001', '29002', '29003', '29004', '29005', '29010', '29016'];
    const postalCode = postalCodes[Math.floor(Math.random() * postalCodes.length)];

    return `${street} ${number}, ${postalCode} Málaga`;
}

// Generate seed data
function generateSeedData(): SeedData[] {
    const seedData: SeedData[] = [];

    // Spanish female names
    const femaleNames = ['Carmen', 'Laura', 'Sofia', 'Ana', 'Elena', 'María', 'Lucía', 'Isabel', 'Pilar', 'Claudia'];

    // Spanish male names
    const maleNames = ['Antonio', 'Javier', 'Manuel', 'Carlos', 'David', 'José', 'Alejandro', 'Miguel', 'Francisco', 'Daniel'];

    // Last names
    const lastNames = ['García', 'Rodríguez', 'López', 'Martínez', 'Fernández', 'Sánchez', 'Pérez', 'González', 'Gómez', 'Ruiz'];

    // Professional descriptions
    const descriptions = [
        "Profesional con amplia experiencia en masajes terapéuticos. Diplomada en fisioterapia con 10 años de experiencia. Atención personalizada y ambiente tranquilo garantizado.",
        "Acompañante para eventos sociales y reuniones. Presencia elegante y conversación interesante para cualquier ocasión. Disponibilidad para viajes dentro y fuera de Málaga.",
        "Especialista en cuidados personalizados y atención domiciliaria. Titulada en enfermería con referencias comprobables. Servicio discreto y de máxima calidad.",
        "Guía turística con profundo conocimiento de Málaga y toda la Costa del Sol. Idiomas: inglés, francés y alemán fluidos. Excursiones a pueblos blancos y rutas gastronómicas.",
        "Ofrezco servicios de acompañamiento y tiempo de calidad. Diplomada en Relaciones Públicas, me adapto a cualquier entorno social. Elegancia y discreción garantizadas.",
        "Masajista profesional especializada en técnicas orientales y relajación profunda. Ambiente acogedor con aromaterapia. Posibilidad de servicio a domicilio u hoteles.",
        "Asesor de imagen y personal shopper con experiencia trabajando para clientes VIP. Te ayudo a encontrar tu mejor versión con un trato exclusivo y personalizado.",
        "Entrenadora personal certificada. Diseño programas de ejercicio adaptados a tus necesidades. Horarios flexibles y atención individualizada en tu domicilio o zonas al aire libre.",
        "Profesional del bienestar con formación en mindfulness y coaching. Te ayudo a encontrar equilibrio y reducir el estrés con sesiones personalizadas en un ambiente relajado.",
        "Chef privada con experiencia en cocina mediterránea e internacional. Preparo menús a medida en tu domicilio para ocasiones especiales o como servicio regular."
    ];

    // Nationality and ethnicity pools - IDs from seeders
    const nationalityPool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const ethnicityPool = [1, 2, 3, 4, 5, 6];

    // Generate profiles (mix of male and female)
    for (let i = 0; i < PROFILES_QTY; i++) {
        const isFemale = Math.random() > 0.5;
        const nameArray = isFemale ? femaleNames : maleNames;
        const firstName = nameArray[Math.floor(Math.random() * nameArray.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;

        // Create unique email
        const domain = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.es', 'icloud.com'][Math.floor(Math.random() * 5)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 1000)}@${domain}`;

        // Random age between 21 and 45
        const age = Math.floor(Math.random() * (MAX_AGE - MIN_AGE + 1)) + 18;

        const price = Math.floor(Math.random() * (MAX_PRICE - MIN_PRICE + 1)) + 20;

        // Random description
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];

        // Random location in Málaga
        const coords = getRandomMalagaCoords();
        const address = getRandomMalagaAddress();

        // Random number of images (1-3)
        const numImages = Math.floor(Math.random() * 3) + 1;
        const images: SeedImage[] = [];

        // Assign appropriate images based on gender
        const appropriateImages = isFemale ? SAMPLE_IMAGES.FEMALE : SAMPLE_IMAGES.MALE;

        // Shuffle array to get random selections
        const shuffledImages = [...appropriateImages].sort(() => 0.5 - Math.random());

        for (let j = 0; j < numImages && j < shuffledImages.length; j++) {
            images.push({
                fileName: shuffledImages[j],
                position: j,
            });
        }

        // Random languages (1-3)
        const numLanguages = Math.floor(Math.random() * 3) + 1;
        const languagePool = [1, 2, 3, 4, 5]; // IDs from existing language seeder
        const languages: number[] = [];

        for (let j = 0; j < numLanguages; j++) {
            const langId = languagePool[Math.floor(Math.random() * languagePool.length)];
            if (!languages.includes(langId)) {
                languages.push(langId);
            }
        }

        // Random payment methods (1-3)
        const numPaymentMethods = Math.floor(Math.random() * 3) + 1;
        const paymentMethodPool = [1, 2, 3]; // IDs from existing payment method seeder
        const paymentMethods: number[] = [];

        for (let j = 0; j < numPaymentMethods; j++) {
            const methodId = paymentMethodPool[Math.floor(Math.random() * paymentMethodPool.length)];
            if (!paymentMethods.includes(methodId)) {
                paymentMethods.push(methodId);
            }
        }

        // Random nationality (single value or null)
        const nationalityId = Math.random() > 0.1
            ? nationalityPool[Math.floor(Math.random() * nationalityPool.length)]
            : null;

        // Random ethnicity (single value or null)
        const ethnicityId = Math.random() > 0.1
            ? ethnicityPool[Math.floor(Math.random() * ethnicityPool.length)]
            : null;

        seedData.push({
            user: {
                name: fullName,
                email,
                image: null,
            },
            profile: {
                name: firstName,
                price,
                age,
                description,
                address,
                latitude: coords.lat,
                longitude: coords.lng,
                images,
                languages,
                paymentMethods,
                nationalityId,
                ethnicityId
            }
        });
    }

    return seedData;
}

export default async function seedProfiles(prisma: PrismaClient) {
    console.log('Seeding profiles...');

    const seedData = generateSeedData();

    // Verify the images directory exists
    const imagesDir = path.join(__dirname, 'img');
    if (!fs.existsSync(imagesDir)) {
        console.error(`Images directory does not exist: ${imagesDir}`);
        return;
    }

    for (const data of seedData) {
        try {
            // 1. Create user
            const user = await prisma.user.create({
                data: {
                    email: data.user.email,
                    name: data.user.name,
                    image: data.user.image,
                },
            });

            console.log(`Created user: ${user.id} - ${user.name}`);

            // 2. Create profile
            const profile = await prisma.profile.create({
                data: {
                    userId: user.id,
                    name: data.profile.name,
                    price: data.profile.price,
                    age: data.profile.age,
                    description: data.profile.description,
                    latitude: data.profile.latitude,
                    longitude: data.profile.longitude,
                    address: data.profile.address,
                    published: true,
                },
            });

            console.log(`Created profile: ${profile.id} - ${profile.name}`);

            // 3. Process and upload images, then create database records
            for (const image of data.profile.images) {
                // Check if the image file exists
                const imagePath = path.join(imagesDir, image.fileName);
                if (!fs.existsSync(imagePath)) {
                    console.warn(`Image file not found: ${imagePath}`);
                    continue;
                }

                // Read the image file
                const imageBuffer = fs.readFileSync(imagePath);

                // Use ImageService to process and upload the image
                console.log(`Processing and uploading image: ${image.fileName}`);
                const processedImage = await ImageService.processAndUploadImage(imageBuffer);

                // Create image record
                await prisma.profileImage.create({
                    data: {
                        profileId: profile.id,
                        position: image.position,
                        ...processedImage
                    },
                });

                console.log(`Created image for profile ${profile.id}, position ${image.position}`);
            }

            // 4. Create language associations
            for (const langId of data.profile.languages) {
                await prisma.profileLanguage.create({
                    data: {
                        profileId: profile.id,
                        languageId: langId,
                    },
                });
            }

            console.log(`Added ${data.profile.languages.length} languages to profile ${profile.id}`);

            // 5. Create payment method associations
            for (const methodId of data.profile.paymentMethods) {
                await prisma.profilePaymentMethod.create({
                    data: {
                        profileId: profile.id,
                        paymentMethodId: methodId,
                    },
                });
            }

            console.log(`Added ${data.profile.paymentMethods.length} payment methods to profile ${profile.id}`);

            // 6. Create nationality association if present
            if (data.profile.nationalityId) {
                await prisma.profileNationality.create({
                    data: {
                        profileId: profile.id,
                        nationalityId: data.profile.nationalityId,
                    },
                });
                console.log(`Added nationality ${data.profile.nationalityId} to profile ${profile.id}`);
            }

            // 7. Create ethnicity association if present
            if (data.profile.ethnicityId) {
                await prisma.profileEthnicity.create({
                    data: {
                        profileId: profile.id,
                        ethnicityId: data.profile.ethnicityId,
                    },
                });
                console.log(`Added ethnicity ${data.profile.ethnicityId} to profile ${profile.id}`);
            }
        } catch (error) {
            console.error(`Error creating profile for ${data.user.email}:`, error);
        }
    }

    console.log(`✅ Successfully seeded ${seedData.length} profiles`);
}
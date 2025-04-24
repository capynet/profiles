// prisma/seeders/services.ts
import { PrismaClient } from '@prisma/client';

const services = [
  { name: "Girlfriend Experience" },
  { name: "Event Companion" },
  { name: "Romantic Night" }
];

export default async function seedServices(prisma: PrismaClient) {
  console.log('Seeding services...');

  for (const service of services) {
    await prisma.service.upsert({
      where: {name: service.name},
      update: {},
      create: {name: service.name}
    })
  }
  
  console.log('✅ Successfully seeded services');
}
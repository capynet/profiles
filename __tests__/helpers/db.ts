// Test database helpers
import { prisma } from '@/prisma';

export async function cleanupDatabase() {
  // Delete in order to avoid foreign key constraints
  await prisma.entityReplacement.deleteMany({});

  // Delete profile relations first
  await prisma.profileLanguage.deleteMany({});
  await prisma.profileService.deleteMany({});
  await prisma.profilePaymentMethod.deleteMany({});
  await prisma.profileNationality.deleteMany({});
  await prisma.profileEthnicity.deleteMany({});

  // Delete version relations
  await prisma.profileVersionLanguage.deleteMany({});
  await prisma.profileVersionService.deleteMany({});
  await prisma.profileVersionPaymentMethod.deleteMany({});
  await prisma.profileVersionNationality.deleteMany({});
  await prisma.profileVersionEthnicity.deleteMany({});

  // Delete profile images
  await prisma.profileImage.deleteMany({});

  // Delete versions
  await prisma.profileVersion.deleteMany({});

  // Delete profiles
  await prisma.profile.deleteMany({});

  // Delete entities
  await prisma.language.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.nationality.deleteMany({});
  await prisma.ethnicity.deleteMany({});

  // Delete users and accounts
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
}

export async function createTestUser(role: 'admin' | 'user' = 'admin') {
  return await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role,
    },
  });
}

export async function createTestLanguage(name: string) {
  return await prisma.language.create({
    data: { name },
  });
}

export async function createTestProfile(userId: string, data?: Partial<{
  name: string;
  published: boolean;
  isDraft: boolean;
  languageIds: number[];
  serviceIds: number[];
}>) {
  const profile = await prisma.profile.create({
    data: {
      userId,
      name: data?.name || 'Test Profile',
      published: data?.published ?? true,
      isDraft: data?.isDraft ?? false,
      age: 25,
      price: 100.0,
      description: 'Test description',
      latitude: 0.0,
      longitude: 0.0,
      address: 'Test Address',
    },
  });

  // Add language relations if provided
  if (data?.languageIds && data.languageIds.length > 0) {
    await prisma.profileLanguage.createMany({
      data: data.languageIds.map(languageId => ({
        profileId: profile.id,
        languageId,
      })),
    });
  }

  // Add service relations if provided
  if (data?.serviceIds && data.serviceIds.length > 0) {
    await prisma.profileService.createMany({
      data: data.serviceIds.map(serviceId => ({
        profileId: profile.id,
        serviceId,
      })),
    });
  }

  return profile;
}

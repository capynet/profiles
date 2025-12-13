import { DELETE } from '@/app/api/admin/entities/[type]/[id]/route';
import { prisma } from '@/prisma';
import {
  cleanupDatabase,
  createTestUser,
  createTestLanguage,
  createTestProfile,
} from '../../../helpers/db';
import { NextRequest } from 'next/server';

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: 'test-user-id', role: 'admin' },
  })),
}));

jest.mock('@/lib/auth-utils', () => ({
  requireAdmin: jest.fn(() => Promise.resolve()),
}));

describe('DELETE /api/admin/entities/[type]/[id]', () => {
  let testUser: any;

  beforeAll(async () => {
    await cleanupDatabase();
    testUser = await createTestUser('admin');
  });

  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.profileLanguage.deleteMany({});
    await prisma.profileVersionLanguage.deleteMany({});
    await prisma.profileVersion.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.language.deleteMany({});
    await prisma.entityReplacement.deleteMany({});
  });

  describe('Delete language not in use', () => {
    it('should successfully delete a language not used by any profile', async () => {
      // Create a test language
      const language = await createTestLanguage('Unused Language');

      // Create request
      const request = new NextRequest('http://localhost:3000/api/admin/entities/language/' + language.id, {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      // Call DELETE handler
      const response = await DELETE(request, {
        params: Promise.resolve({ type: 'language', id: language.id.toString() }),
      });

      // Check response
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.replacedInProfiles).toBe(0);

      // Verify language was deleted
      const deletedLanguage = await prisma.language.findUnique({
        where: { id: language.id },
      });
      expect(deletedLanguage).toBeNull();
    });
  });

  describe('Delete language in use by active profile', () => {
    it('should return 409 when deleting language used by active profiles without replacement', async () => {
      // Create languages
      const language = await createTestLanguage('Language to Delete');

      // Create profile using this language
      await createTestProfile(testUser.id, {
        name: 'Profile Using Language',
        published: true,
        isDraft: false,
        languageIds: [language.id],
      });

      // Try to delete without replacement
      const request = new NextRequest('http://localhost:3000/api/admin/entities/language/' + language.id, {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ type: 'language', id: language.id.toString() }),
      });

      // Should return 409 with usage info
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.inUse).toBe(true);
      expect(data.affectedProfiles).toBe(1);
      expect(data.profiles).toHaveLength(1);
    });

    it('should successfully delete language with replacement', async () => {
      // Create languages
      const oldLanguage = await createTestLanguage('Old Language');
      const newLanguage = await createTestLanguage('New Language');

      // Create profile using old language
      const profile = await createTestProfile(testUser.id, {
        name: 'Profile Using Old Language',
        published: true,
        isDraft: false,
        languageIds: [oldLanguage.id],
      });

      // Delete with replacement
      const request = new NextRequest('http://localhost:3000/api/admin/entities/language/' + oldLanguage.id, {
        method: 'DELETE',
        body: JSON.stringify({ replacementId: newLanguage.id }),
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ type: 'language', id: oldLanguage.id.toString() }),
      });

      // Should succeed
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.replacedInProfiles).toBe(1);

      // Verify old language was deleted
      const deletedLanguage = await prisma.language.findUnique({
        where: { id: oldLanguage.id },
      });
      expect(deletedLanguage).toBeNull();

      // Verify profile now has new language
      const updatedProfile = await prisma.profile.findUnique({
        where: { id: profile.id },
        include: { languages: true },
      });
      expect(updatedProfile?.languages).toHaveLength(1);
      expect(updatedProfile?.languages[0].languageId).toBe(newLanguage.id);

      // Verify EntityReplacement was created
      const replacement = await prisma.entityReplacement.findFirst({
        where: {
          entityType: 'Language',
          oldEntityId: oldLanguage.id,
          newEntityId: newLanguage.id,
        },
      });
      expect(replacement).not.toBeNull();
      expect(replacement?.oldEntityName).toBe('Old Language');
      expect(replacement?.newEntityName).toBe('New Language');
    });
  });

  describe('Delete language with version snapshots', () => {
    it('should successfully delete language used in profile versions', async () => {
      // Create language
      const language = await createTestLanguage('Language in Version');
      const newLanguage = await createTestLanguage('Replacement Language');

      // Create profile
      const profile = await createTestProfile(testUser.id, {
        name: 'Profile with Version',
        published: true,
        isDraft: false,
        languageIds: [language.id],
      });

      // Create a profile version with this language
      const version = await prisma.profileVersion.create({
        data: {
          profileId: profile.id,
          name: profile.name,
          price: profile.price,
          age: profile.age,
          description: 'Version description',
          latitude: profile.latitude,
          longitude: profile.longitude,
          address: profile.address,
          hasWhatsapp: false,
          hasTelegram: false,
          published: true,
          version: 1,
          createdBy: testUser.id,
        },
      });

      // Add language to version
      await prisma.profileVersionLanguage.create({
        data: {
          versionId: version.id,
          languageId: language.id,
        },
      });

      // Delete language with replacement
      const request = new NextRequest('http://localhost:3000/api/admin/entities/language/' + language.id, {
        method: 'DELETE',
        body: JSON.stringify({ replacementId: newLanguage.id }),
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ type: 'language', id: language.id.toString() }),
      });

      // Should succeed
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify language was deleted
      const deletedLanguage = await prisma.language.findUnique({
        where: { id: language.id },
      });
      expect(deletedLanguage).toBeNull();

      // Verify version language relation was deleted
      const versionLanguage = await prisma.profileVersionLanguage.findUnique({
        where: {
          versionId_languageId: {
            versionId: version.id,
            languageId: language.id,
          },
        },
      });
      expect(versionLanguage).toBeNull();
    });
  });
});

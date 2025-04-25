-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "hasTelegram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasWhatsapp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Language" DROP COLUMN "flag";

-- AlterTable
ALTER TABLE "Language" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT false;

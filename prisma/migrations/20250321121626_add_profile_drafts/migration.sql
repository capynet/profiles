-- DropIndex
DROP INDEX "Profile_userId_key";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalProfileId" INTEGER;

-- CreateIndex
CREATE INDEX "Profile_userId_published_isDraft_idx" ON "Profile"("userId", "published", "isDraft");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_originalProfileId_fkey" FOREIGN KEY ("originalProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

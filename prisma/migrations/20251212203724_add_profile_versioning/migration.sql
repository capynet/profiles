-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "currentVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ProfileVersion" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "hasWhatsapp" BOOLEAN NOT NULL,
    "hasTelegram" BOOLEAN NOT NULL,
    "published" BOOLEAN NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" TEXT,

    CONSTRAINT "ProfileVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVersionImage" (
    "id" SERIAL NOT NULL,
    "versionId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "mediumUrl" TEXT NOT NULL,
    "mediumCdnUrl" TEXT,
    "mediumStorageKey" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "thumbnailCdnUrl" TEXT,
    "thumbnailStorageKey" TEXT,
    "highQualityUrl" TEXT,
    "highQualityCdnUrl" TEXT,
    "highQualityStorageKey" TEXT,

    CONSTRAINT "ProfileVersionImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVersionLanguage" (
    "versionId" INTEGER NOT NULL,
    "languageId" INTEGER NOT NULL,

    CONSTRAINT "ProfileVersionLanguage_pkey" PRIMARY KEY ("versionId","languageId")
);

-- CreateTable
CREATE TABLE "ProfileVersionPaymentMethod" (
    "versionId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,

    CONSTRAINT "ProfileVersionPaymentMethod_pkey" PRIMARY KEY ("versionId","paymentMethodId")
);

-- CreateTable
CREATE TABLE "ProfileVersionNationality" (
    "versionId" INTEGER NOT NULL,
    "nationalityId" INTEGER NOT NULL,

    CONSTRAINT "ProfileVersionNationality_pkey" PRIMARY KEY ("versionId","nationalityId")
);

-- CreateTable
CREATE TABLE "ProfileVersionEthnicity" (
    "versionId" INTEGER NOT NULL,
    "ethnicityId" INTEGER NOT NULL,

    CONSTRAINT "ProfileVersionEthnicity_pkey" PRIMARY KEY ("versionId","ethnicityId")
);

-- CreateTable
CREATE TABLE "ProfileVersionService" (
    "versionId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "ProfileVersionService_pkey" PRIMARY KEY ("versionId","serviceId")
);

-- CreateIndex
CREATE INDEX "ProfileVersion_profileId_createdAt_idx" ON "ProfileVersion"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileVersion_createdBy_idx" ON "ProfileVersion"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileVersion_profileId_version_key" ON "ProfileVersion"("profileId", "version");

-- CreateIndex
CREATE INDEX "ProfileVersionImage_versionId_idx" ON "ProfileVersionImage"("versionId");

-- AddForeignKey
ALTER TABLE "ProfileVersion" ADD CONSTRAINT "ProfileVersion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionImage" ADD CONSTRAINT "ProfileVersionImage_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionLanguage" ADD CONSTRAINT "ProfileVersionLanguage_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionLanguage" ADD CONSTRAINT "ProfileVersionLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionPaymentMethod" ADD CONSTRAINT "ProfileVersionPaymentMethod_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionPaymentMethod" ADD CONSTRAINT "ProfileVersionPaymentMethod_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionNationality" ADD CONSTRAINT "ProfileVersionNationality_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionNationality" ADD CONSTRAINT "ProfileVersionNationality_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Nationality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionEthnicity" ADD CONSTRAINT "ProfileVersionEthnicity_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionEthnicity" ADD CONSTRAINT "ProfileVersionEthnicity_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "Ethnicity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionService" ADD CONSTRAINT "ProfileVersionService_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "ProfileVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVersionService" ADD CONSTRAINT "ProfileVersionService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

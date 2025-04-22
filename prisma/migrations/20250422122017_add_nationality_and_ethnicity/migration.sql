-- CreateTable
CREATE TABLE "Nationality" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Nationality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ethnicity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ethnicity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileNationality" (
    "profileId" INTEGER NOT NULL,
    "nationalityId" INTEGER NOT NULL,

    CONSTRAINT "ProfileNationality_pkey" PRIMARY KEY ("profileId","nationalityId")
);

-- CreateTable
CREATE TABLE "ProfileEthnicity" (
    "profileId" INTEGER NOT NULL,
    "ethnicityId" INTEGER NOT NULL,

    CONSTRAINT "ProfileEthnicity_pkey" PRIMARY KEY ("profileId","ethnicityId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Nationality_name_key" ON "Nationality"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Ethnicity_name_key" ON "Ethnicity"("name");

-- AddForeignKey
ALTER TABLE "ProfileNationality" ADD CONSTRAINT "ProfileNationality_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileNationality" ADD CONSTRAINT "ProfileNationality_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "Nationality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEthnicity" ADD CONSTRAINT "ProfileEthnicity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileEthnicity" ADD CONSTRAINT "ProfileEthnicity_ethnicityId_fkey" FOREIGN KEY ("ethnicityId") REFERENCES "Ethnicity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

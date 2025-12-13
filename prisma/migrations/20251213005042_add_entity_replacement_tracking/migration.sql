-- CreateTable
CREATE TABLE "EntityReplacement" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "oldEntityId" INTEGER NOT NULL,
    "newEntityId" INTEGER,
    "oldEntityName" TEXT NOT NULL,
    "newEntityName" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntityReplacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntityReplacement_entityType_oldEntityId_idx" ON "EntityReplacement"("entityType", "oldEntityId");

-- CreateIndex
CREATE INDEX "EntityReplacement_createdAt_idx" ON "EntityReplacement"("createdAt");

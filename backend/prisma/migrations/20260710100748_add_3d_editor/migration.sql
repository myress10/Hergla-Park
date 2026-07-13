-- AlterTable
ALTER TABLE "Espace" ADD COLUMN     "baseSceneUrl" TEXT,
ADD COLUMN     "originalPlacements" JSONB DEFAULT '[]',
ADD COLUMN     "placements" JSONB DEFAULT '[]';

-- CreateTable
CREATE TABLE "Object3D" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail" TEXT,
    "categorie" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Object3D_pkey" PRIMARY KEY ("id")
);

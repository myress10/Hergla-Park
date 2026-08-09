-- AlterTable
ALTER TABLE "Espace" ALTER COLUMN "companyId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Object3D" ALTER COLUMN "companyId" DROP DEFAULT;

-- 1. Create a temporary column to store role string representation
ALTER TABLE "User" ADD COLUMN "temp_role" TEXT;

-- 2. Copy the enum values as text into the temp column
UPDATE "User" SET "temp_role" = "role"::text;

-- 3. Drop the column referencing the old enum
ALTER TABLE "User" DROP COLUMN "role";

-- 4. Drop the old enum type (resolving the relation conflict)
DROP TYPE "Role";

-- 5. Now safely Create the tables
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "isRootIntervention" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nom_companyId_key" ON "Role"("nom", "companyId");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Insert Base System Roles
INSERT INTO "Role" ("id", "nom", "isSystem", "companyId") VALUES 
  ('system-role-root', 'ROOT', true, null),
  ('system-role-superadmin', 'SUPERADMIN', true, null),
  ('system-role-admin', 'ADMIN', true, null),
  ('system-role-employe', 'EMPLOYE', true, null);

-- 7. Populate UserRole from the temporary column
INSERT INTO "UserRole" ("userId", "roleId")
SELECT "id", 
  CASE 
    WHEN "temp_role" = 'SUPERADMIN' THEN 'system-role-superadmin'
    WHEN "temp_role" = 'ADMIN' THEN 'system-role-admin'
    ELSE 'system-role-employe'
  END
FROM "User";

-- 8. Clean up temporary column
ALTER TABLE "User" DROP COLUMN "temp_role";




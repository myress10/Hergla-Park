/**
 * prisma/seed.ts
 *
 * Seed script for SaaS dynamic roles, permissions, audit logging,
 * and the default company "Hergla Park".
 *
 * Usage:
 *   npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-tenant seed...\n');

  // ── 1. Create permissions catalogue ────────────────────────────────────────
  const permissionsData = [
    { key: 'espace:create', description: 'Créer un espace de parc' },
    { key: 'espace:read', description: 'Consulter la liste et les détails des espaces' },
    { key: 'espace:update', description: 'Modifier un espace (statut, métadonnées)' },
    { key: 'espace:delete', description: 'Supprimer un espace' },
    
    { key: 'user:create', description: 'Créer un nouvel utilisateur' },
    { key: 'user:read', description: 'Consulter les profils utilisateurs' },
    { key: 'user:update', description: 'Modifier un profil utilisateur' },
    { key: 'user:delete', description: 'Supprimer un compte utilisateur' },
    
    { key: 'role:create', description: 'Créer un rôle personnalisé' },
    { key: 'role:update', description: 'Modifier un rôle personnalisé' },
    { key: 'role:delete', description: 'Supprimer un rôle personnalisé' },
    { key: 'role:assign', description: 'Attribuer des rôles aux utilisateurs' },
    
    { key: 'scene:edit', description: 'Éditer et enregistrer les placements 3D' },
    { key: 'scene:reset', description: 'Réinitialiser la scène 3D à son état original' },
    
    { key: 'logs:view', description: 'Consulter le journal d\'activité (réservé ROOT)' },
  ];

  console.log('Inserting permissions...');
  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log('✅ Permissions inserted.');

  // ── 2. Create base system roles ────────────────────────────────────────────
  const systemRoles = [
    { id: 'system-role-root', nom: 'ROOT', isSystem: true, companyId: null },
    { id: 'system-role-superadmin', nom: 'SUPERADMIN', isSystem: true, companyId: null },
    { id: 'system-role-admin', nom: 'ADMIN', isSystem: true, companyId: null },
    { id: 'system-role-employe', nom: 'EMPLOYE', isSystem: true, companyId: null },
  ];

  console.log('Inserting base system roles...');
  for (const r of systemRoles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { nom: r.nom, isSystem: r.isSystem, companyId: r.companyId },
      create: r,
    });
  }
  console.log('✅ System roles inserted.');

  // ── 3. Associate permissions to system roles ────────────────────────────────
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));

  const rolePermissionMappings: { [roleId: string]: string[] } = {
    'system-role-root': allPermissions.map((p) => p.key), // ROOT gets EVERYTHING
    'system-role-superadmin': allPermissions.map((p) => p.key).filter((k) => k !== 'logs:view'), // All except logs:view
    'system-role-admin': ['espace:read', 'espace:update', 'user:read'],
    'system-role-employe': ['espace:read', 'espace:update', 'scene:edit'],
  };

  console.log('Mapping permissions to system roles...');
  for (const [roleId, permKeys] of Object.entries(rolePermissionMappings)) {
    // Clear existing permissions mappings first to update them safely
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    for (const key of permKeys) {
      const permissionId = permMap.get(key);
      if (permissionId) {
        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
        });
      }
    }
  }
  console.log('✅ Role-Permission associations seeded.');

  // ── 4. Create (or get) default company ──────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { slug: 'hergla-park' },
    update: {},
    create: {
      nom: 'Hergla Park',
      slug: 'hergla-park',
      logoUrl: null,
      actif: true,
    },
  });
  console.log(`✅ Company created/loaded: ${company.nom} (id: ${company.id})`);

  // ── 5. Attach orphaned Spaces & Object3Ds to default company ────────────────
  const spacesResult = await prisma.espace.updateMany({
    where: { companyId: 'TEMP' },
    data: { companyId: company.id },
  });
  const objectsResult = await prisma.object3D.updateMany({
    where: { companyId: 'TEMP' },
    data: { companyId: company.id },
  });
  console.log(`✅ Orphaned Spaces mapped: ${spacesResult.count}`);
  console.log(`✅ Orphaned Object3Ds mapped: ${objectsResult.count}`);

  // ── 6. Ensure all Users are attached to Hergla Park (except ROOT) ──────────
  // Note: Root users should have companyId = null. Existing users are mapped to Hergla Park.
  const usersResult = await prisma.user.updateMany({
    where: { companyId: null },
    data: { companyId: company.id },
  });
  console.log(`✅ Users associated with default company: ${usersResult.count}`);

  // Ensure every user has at least one role assigned (fall back to EMPLOYE if none)
  const users = await prisma.user.findMany({
    include: { roles: true },
  });
  let userRolesCreated = 0;
  for (const user of users) {
    if (user.roles.length === 0) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: 'system-role-employe',
        },
      });
      userRolesCreated++;
    }
  }
  console.log(`✅ Assured role assignment for ${userRolesCreated} users.`);

  // ── 7. Summary ──────────────────────────────────────────────────────────────
  const countLogs = await prisma.auditLog.count();
  console.log('\n📊 Database statistics:');
  console.log(`   Companies   : ${await prisma.company.count()}`);
  console.log(`   Espaces     : ${await prisma.espace.count()}`);
  console.log(`   Object3Ds   : ${await prisma.object3D.count()}`);
  console.log(`   Users       : ${await prisma.user.count()}`);
  console.log(`   Roles       : ${await prisma.role.count()}`);
  console.log(`   Permissions : ${await prisma.permission.count()}`);
  console.log(`   Audit Logs  : ${countLogs}`);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

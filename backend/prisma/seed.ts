/**
 * prisma/seed.ts
 *
 * Seed script for SaaS dynamic roles, permissions, audit logging,
 * and the default company "Hergla Park".
 *
 * Usage:
 *   npm run db:seed
 */

import { PrismaClient, StatutEspace } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting expanded multi-tenant seed...\n');

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

  // ── 4. Create default company "Hergla Park" ─────────────────────────────────
  const company = await prisma.company.upsert({
    where: { slug: 'hergla-park' },
    update: {},
    create: {
      nom: 'Hergla Park',
      slug: 'hergla-park',
      logoUrl: '/uploads/logo.png',
      actif: true,
    },
  });
  console.log(`✅ Company: ${company.nom} (id: ${company.id})`);

  // ── 5. Create Custom Role "Responsable Café" ─────────────────────────────────
  // Note: custom role specific to Hergla Park
  const customRoleName = 'Responsable Café';
  const customRole = await prisma.role.upsert({
    where: { nom_companyId: { nom: customRoleName, companyId: company.id } },
    update: {},
    create: {
      nom: customRoleName,
      isSystem: false,
      companyId: company.id,
    },
  });
  console.log(`✅ Custom Role: ${customRole.nom} (id: ${customRole.id})`);

  // Assign permissions to the custom role ("Responsable Café" can read/update spaces and edit scene)
  const customRolePermKeys = ['espace:read', 'espace:update', 'scene:edit'];
  await prisma.rolePermission.deleteMany({
    where: { roleId: customRole.id },
  });
  for (const key of customRolePermKeys) {
    const permissionId = permMap.get(key);
    if (permissionId) {
      await prisma.rolePermission.create({
        data: {
          roleId: customRole.id,
          permissionId,
        },
      });
    }
  }
  console.log('✅ Custom Role permissions mapped.');

  // ── 6. Create 3 Spaces ──────────────────────────────────────────────────────
  console.log('Seeding spaces...');
  
  const spaceCafe = await prisma.espace.upsert({
    where: { id: 'space-cafe-demo-id' },
    update: {},
    create: {
      id: 'space-cafe-demo-id',
      companyId: company.id,
      nom: 'Café',
      categorie: 'Café & Détente',
      statut: StatutEspace.OUVERT,
      baseSceneUrl: '/uploads/models/cafe_base.glb',
      donneesSpecifiques: {
        tablesCount: 15,
        hasTerrace: true,
        specialty: 'Café Tunisien',
      },
    },
  });

  const spaceRestaurant = await prisma.espace.upsert({
    where: { id: 'space-resto-demo-id' },
    update: {},
    create: {
      id: 'space-resto-demo-id',
      companyId: company.id,
      nom: 'Restaurant',
      categorie: 'Restauration',
      statut: StatutEspace.FERME,
      baseSceneUrl: '/uploads/models/restaurant_base.glb',
      donneesSpecifiques: {
        capacity: 120,
        cuisineType: 'Méditerranéenne',
        menuOfTheDay: 'Couscous de poissons',
      },
    },
  });

  const spaceKarting = await prisma.espace.upsert({
    where: { id: 'space-karting-demo-id' },
    update: {},
    create: {
      id: 'space-karting-demo-id',
      companyId: company.id,
      nom: 'Piste Karting',
      categorie: 'Sports & Loisirs',
      statut: StatutEspace.MAINTENANCE,
      baseSceneUrl: '/uploads/models/karting_track.glb',
      donneesSpecifiques: {
        trackLengthMeters: 800,
        kartsAvailable: 12,
        maintenanceReason: 'Refoulement de la piste principale',
      },
    },
  });
  console.log('✅ Spaces seeded (Café, Restaurant, Piste Karting).');

  // ── 7. Seeding 3D Objects catalogue ──────────────────────────────────────────
  console.log('Seeding catalogue 3D objects...');
  const catalogObjects = [
    { id: 'obj-table-id', nom: 'Table', categorie: 'mobilier', modelUrl: '/uploads/models/table.glb', thumbnailUrl: '/uploads/thumbnails/table.png' },
    { id: 'obj-chaise-id', nom: 'Chaise', categorie: 'mobilier', modelUrl: '/uploads/models/chaise.glb', thumbnailUrl: '/uploads/thumbnails/chaise.png' },
    { id: 'obj-plante-id', nom: 'Plante verte', categorie: 'decoration', modelUrl: '/uploads/models/plante.glb', thumbnailUrl: '/uploads/thumbnails/plante.png' },
    { id: 'obj-panneau-id', nom: 'Panneau indicateur', categorie: 'signaletique', modelUrl: '/uploads/models/panneau.glb', thumbnailUrl: '/uploads/thumbnails/panneau.png' },
    { id: 'obj-karting-id', nom: 'Karting Standard', categorie: 'equipement', modelUrl: '/uploads/models/karting.glb', thumbnailUrl: '/uploads/thumbnails/karting.png' },
    { id: 'obj-sofa-id', nom: 'Sofa Lounge', categorie: 'mobilier', modelUrl: '/uploads/models/sofa.glb', thumbnailUrl: '/uploads/thumbnails/sofa.png' },
  ];

  for (const obj of catalogObjects) {
    await prisma.object3D.upsert({
      where: { id: obj.id },
      update: { nom: obj.nom, categorie: obj.categorie, modelUrl: obj.modelUrl, thumbnailUrl: obj.thumbnailUrl },
      create: {
        id: obj.id,
        companyId: company.id,
        nom: obj.nom,
        categorie: obj.categorie,
        modelUrl: obj.modelUrl,
        thumbnailUrl: obj.thumbnailUrl,
        isCustom: false,
      },
    });
  }
  console.log('✅ 3D Objects seeded.');

  // ── 8. Seeding Placements for Café scene ────────────────────────────────────
  console.log('Seeding scene placements for Café...');
  const placements = [
    { id: 'place-cafe-table-1', espaceId: spaceCafe.id, object3DId: 'obj-table-id', positionX: 0.0, positionY: 0.0, positionZ: 0.0, rotationX: 0.0, rotationY: 0.0, rotationZ: 0.0, scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0 },
    { id: 'place-cafe-chaise-1', espaceId: spaceCafe.id, object3DId: 'obj-chaise-id', positionX: 0.6, positionY: 0.0, positionZ: 0.0, rotationX: 0.0, rotationY: 1.57, rotationZ: 0.0, scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0 },
    { id: 'place-cafe-chaise-2', espaceId: spaceCafe.id, object3DId: 'obj-chaise-id', positionX: -0.6, positionY: 0.0, positionZ: 0.0, rotationX: 0.0, rotationY: -1.57, rotationZ: 0.0, scaleX: 1.0, scaleY: 1.0, scaleZ: 1.0 },
    { id: 'place-cafe-plante-1', espaceId: spaceCafe.id, object3DId: 'obj-plante-id', positionX: 1.5, positionY: 0.0, positionZ: 1.5, rotationX: 0.0, rotationY: 0.0, rotationZ: 0.0, scaleX: 1.2, scaleY: 1.2, scaleZ: 1.2 },
  ];

  // Clean old placements for Café first
  await prisma.scenePlacement.deleteMany({
    where: { espaceId: spaceCafe.id },
  });

  for (const pl of placements) {
    await prisma.scenePlacement.create({
      data: pl,
    });
  }

  // Save JSON snapshot of original scene layout to Café space
  const originalSceneData = placements.map(({ object3DId, positionX, positionY, positionZ, rotationX, rotationY, rotationZ, scaleX, scaleY, scaleZ }) => ({
    object3DId,
    position: [positionX, positionY, positionZ],
    rotation: [rotationX ?? 0, rotationY ?? 0, rotationZ ?? 0],
    scale: [scaleX ?? 1, scaleY ?? 1, scaleZ ?? 1],
  }));

  await prisma.espace.update({
    where: { id: spaceCafe.id },
    data: { originalSceneData },
  });
  console.log('✅ Café scene placements & originalSceneData seeded.');

  // ── 9. Create QA accounts ──────────────────────────────────────────────────
  console.log('Seeding QA users...');
  
  // Demo password
  const demoPassword = 'DemoSecurePass!2026';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(demoPassword, salt);

  // 1. ROOT
  const userRoot = await prisma.user.upsert({
    where: { email: 'root_demo@herglapark.com' },
    update: { passwordHash },
    create: {
      email: 'root_demo@herglapark.com',
      nom: 'Alex (ROOT)',
      passwordHash,
      companyId: null, // Global
    },
  });
  await prisma.userRole.deleteMany({ where: { userId: userRoot.id } });
  await prisma.userRole.create({ data: { userId: userRoot.id, roleId: 'system-role-root' } });

  // 2. SUPERADMIN
  const userSuperadmin = await prisma.user.upsert({
    where: { email: 'superadmin_demo@herglapark.com' },
    update: { passwordHash },
    create: {
      email: 'superadmin_demo@herglapark.com',
      nom: 'Sami (SuperAdmin)',
      passwordHash,
      companyId: company.id,
    },
  });
  await prisma.userRole.deleteMany({ where: { userId: userSuperadmin.id } });
  await prisma.userRole.create({ data: { userId: userSuperadmin.id, roleId: 'system-role-superadmin' } });

  // 3. ADMIN
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin_demo@herglapark.com' },
    update: { passwordHash, assignedSpaceId: spaceCafe.id },
    create: {
      email: 'admin_demo@herglapark.com',
      nom: 'Mariem (Admin Café)',
      passwordHash,
      companyId: company.id,
      assignedSpaceId: spaceCafe.id,
    },
  });
  await prisma.userRole.deleteMany({ where: { userId: userAdmin.id } });
  // ADMIN gets both system ADMIN role and custom "Responsable Café" role
  await prisma.userRole.create({ data: { userId: userAdmin.id, roleId: 'system-role-admin' } });
  await prisma.userRole.create({ data: { userId: userAdmin.id, roleId: customRole.id } });

  // 4. EMPLOYE
  const userEmploye = await prisma.user.upsert({
    where: { email: 'employe_demo@herglapark.com' },
    update: { passwordHash, assignedSpaceId: spaceKarting.id },
    create: {
      email: 'employe_demo@herglapark.com',
      nom: 'Yassine (Employé Karting)',
      passwordHash,
      companyId: company.id,
      assignedSpaceId: spaceKarting.id,
    },
  });
  await prisma.userRole.deleteMany({ where: { userId: userEmploye.id } });
  await prisma.userRole.create({ data: { userId: userEmploye.id, roleId: 'system-role-employe' } });

  console.log('✅ QA Users seeded.');

  // ── 10. Seeding some Audit Logs ─────────────────────────────────────────────
  console.log('Seeding audit logs...');
  const auditLogsData = [
    {
      companyId: null,
      actorId: userRoot.id,
      action: 'company.create',
      entityType: 'Company',
      entityId: company.id,
      isRootIntervention: true,
      metadata: { nom: 'Hergla Park', slug: 'hergla-park' },
    },
    {
      companyId: company.id,
      actorId: userSuperadmin.id,
      action: 'user.create',
      entityType: 'User',
      entityId: userAdmin.id,
      isRootIntervention: false,
      metadata: { email: userAdmin.email, role: 'ADMIN' },
    },
    {
      companyId: company.id,
      actorId: userAdmin.id,
      action: 'espace.update',
      entityType: 'Espace',
      entityId: spaceCafe.id,
      isRootIntervention: false,
      metadata: { changes: { statut: StatutEspace.OUVERT } },
    },
    {
      companyId: company.id,
      actorId: userEmploye.id,
      action: 'scene.edit',
      entityType: 'Espace',
      entityId: spaceCafe.id,
      isRootIntervention: false,
      metadata: { placementsCount: placements.length },
    },
    {
      companyId: null,
      actorId: userRoot.id,
      action: 'logs.view',
      entityType: 'AuditLog',
      entityId: null,
      isRootIntervention: true,
      metadata: { reason: 'Vérification de sécurité' },
    },
  ];

  await prisma.auditLog.deleteMany();
  for (const log of auditLogsData) {
    await prisma.auditLog.create({
      data: log,
    });
  }
  console.log('✅ Audit logs seeded.');

  // ── 11. Write Credentials file locally (ignored in git) ─────────────────────
  const rootDir = path.join(__dirname, '..', '..');
  const backendDir = __dirname;
  
  const credentialsContent = `# QA Credentials — Hergla-Park

Ce fichier a été généré automatiquement par le script de seed et est exclu de Git.

### Comptes de démo et de test QA :

| Rôle | Email | Mot de passe | Description |
| :--- | :--- | :--- | :--- |
| **ROOT** | \`root_demo@herglapark.com\` | \`${demoPassword}\` | Super-utilisateur global, accès à tous les logs et rôles de toutes les entreprises. |
| **SUPERADMIN** | \`superadmin_demo@herglapark.com\` | \`${demoPassword}\` | Administrateur entreprise Hergla Park, gère espaces/utilisateurs/catalogue. |
| **ADMIN** | \`admin_demo@herglapark.com\` | \`${demoPassword}\` | Rôles cumulés (ADMIN + Responsable Café). Assigné à l'espace Café. |
| **EMPLOYE** | \`employe_demo@herglapark.com\` | \`${demoPassword}\` | Rôle EMPLOYE. Assigné à l'espace Piste Karting. |

### Espaces créés :
1. **Café** (ID: \`space-cafe-demo-id\` - statut: OUVERT)
2. **Restaurant** (ID: \`space-resto-demo-id\` - statut: FERME)
3. **Piste Karting** (ID: \`space-karting-demo-id\` - statut: MAINTENANCE)

Date de génération : ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(rootDir, 'SEED_CREDENTIALS.md'), credentialsContent);
  fs.writeFileSync(path.join(backendDir, 'SEED_CREDENTIALS.md'), credentialsContent);
  
  console.log('\n🔐 ******************************************************');
  console.log('  QA Credentials file written to :');
  console.log(`  - ${path.join(rootDir, 'SEED_CREDENTIALS.md')}`);
  console.log(`  - ${path.join(backendDir, 'SEED_CREDENTIALS.md')}`);
  console.log('  Please consult SEED_CREDENTIALS.md for test logins.');
  console.log('********************************************************\n');

  // ── 12. Summary ─────────────────────────────────────────────────────────────
  console.log('📊 Database statistics:');
  console.log(`   Companies   : ${await prisma.company.count()}`);
  console.log(`   Espaces     : ${await prisma.espace.count()}`);
  console.log(`   Object3Ds   : ${await prisma.object3D.count()}`);
  console.log(`   Users       : ${await prisma.user.count()}`);
  console.log(`   Roles       : ${await prisma.role.count()}`);
  console.log(`   Permissions : ${await prisma.permission.count()}`);
  console.log(`   Audit Logs  : ${await prisma.auditLog.count()}`);
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

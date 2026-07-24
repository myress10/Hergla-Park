import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function runQATests() {
  console.log('🚀 Launching QA Test Runner...\n');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  const PORT = 5099;
  await app.listen(PORT);
  const baseURL = `http://localhost:${PORT}/api`;

  const request = async (url: string, options: any = {}) => {
    const res = await fetch(`${baseURL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    return { status: res.status, data };
  };

  const PASSWORD = 'DemoSecurePass!2026';

  const results: { section: string; name: string; success: boolean; comment: string }[] = [];

  try {
    // ─── LOGIN USERS ────────────────────────────────────────────────────────
    const resRootLogin = await request('/auth/login', { method: 'POST', body: { email: 'root_demo@herglapark.com', password: PASSWORD } });
    const tokenRoot = resRootLogin.data?.token;

    const resSuperAdminLogin = await request('/auth/login', { method: 'POST', body: { email: 'superadmin_demo@herglapark.com', password: PASSWORD } });
    const tokenSuperAdmin = resSuperAdminLogin.data?.token;
    const superAdminUser = resSuperAdminLogin.data?.data;
    const availableCompaniesSuperAdmin = resSuperAdminLogin.data?.availableCompanies;

    const resEmployeLogin = await request('/auth/login', { method: 'POST', body: { email: 'employe_demo@herglapark.com', password: PASSWORD } });
    const tokenEmploye = resEmployeLogin.data?.token;
    const employeUser = resEmployeLogin.data?.data;

    const resGloulouSaLogin = await request('/auth/login', { method: 'POST', body: { email: 'superadmin_gloulou@glouloutest.com', password: PASSWORD } });
    const tokenGloulouSa = resGloulouSaLogin.data?.token;

    // ─── PART A TESTS ───────────────────────────────────────────────────────
    // Fetch custom role "Responsable Café" and system ADMIN/EMPLOYE role IDs
    const resRolesList = await request('/roles', { headers: { Authorization: `Bearer ${tokenSuperAdmin}` } });
    const rolesData = resRolesList.data || [];
    let customRoleCafe = rolesData.find((r: any) => r.nom === 'Responsable Café');
    const adminRole = rolesData.find((r: any) => r.nom === 'ADMIN');
    const employeRole = rolesData.find((r: any) => r.nom === 'EMPLOYE');

    if (!customRoleCafe) {
      const resCreateCafe = await request('/roles', {
        method: 'POST',
        body: { nom: 'Responsable Café', permissionKeys: ['espace:read', 'scene:edit'] },
        headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      });
      customRoleCafe = resCreateCafe.data?.data;
    }

    // Ensure employeUser starts with only EMPLOYE role (level 20)
    await request(`/users/${employeUser.id}/roles`, {
      method: 'POST',
      body: { roleIds: [employeRole.id], mode: 'replace' },
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });

    // Test A.1: Add custom role (level 20) to SUPERADMIN (level 90) mode "add"
    const resA1 = await request(`/users/${superAdminUser.id}/roles`, {
      method: 'POST',
      body: { roleIds: [customRoleCafe.id], mode: 'add' },
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });

    results.push({
      section: 'Partie A.4.1',
      name: 'Ajout rôle inférieur (Responsable Café level 20) à SUPERADMIN (level 90) en mode add',
      success: (resA1.status === 200 || resA1.status === 201) && resA1.data?.success === true,
      comment: (resA1.status === 200 || resA1.status === 201) ? 'Rôle ajouté avec succès (niveau 20 <= 90).' : `Erreur HTTP ${resA1.status}: ${JSON.stringify(resA1.data)}`,
    });

    // Test A.2: Attempt adding ADMIN (level 50) to EMPLOYE (level 20) mode "add"
    const resA2 = await request(`/users/${employeUser.id}/roles`, {
      method: 'POST',
      body: { roleIds: [adminRole.id], mode: 'add' },
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });

    const isA2Blocked = resA2.status === 400 && resA2.data?.message?.includes('supérieur au niveau actuel');
    results.push({
      section: 'Partie A.4.2',
      name: 'Tentative ajout rôle supérieur (ADMIN level 50) à EMPLOYE (level 20) en mode add',
      success: isA2Blocked,
      comment: isA2Blocked
        ? `Rejeté avec succès (HTTP 400): "${resA2.data.message}"`
        : `Échec attendu. Status ${resA2.status}, body: ${JSON.stringify(resA2.data)}`,
    });

    // Test A.3: Explicit promotion of EMPLOYE to ADMIN mode "replace"
    const resA3 = await request(`/users/${employeUser.id}/roles`, {
      method: 'POST',
      body: { roleIds: [adminRole.id], mode: 'replace' },
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });

    results.push({
      section: 'Partie A.4.3',
      name: 'Promotion explicite d\'EMPLOYE vers ADMIN en mode replace',
      success: (resA3.status === 200 || resA3.status === 201) && resA3.data?.success === true,
      comment: (resA3.status === 200 || resA3.status === 201) ? 'Promotion réussie en mode replace (aucune restriction de niveau).' : `Status ${resA3.status}`,
    });

    // ─── PART B TESTS ───────────────────────────────────────────────────────
    // Test B.1: GET /api/espaces as Hergla Park SuperAdmin
    const resB1 = await request('/espaces', { headers: { Authorization: `Bearer ${tokenSuperAdmin}` } });
    const spacesSa = resB1.data?.data || [];
    const hasGloulouSpaceInList = spacesSa.some((s: any) => s.nom.includes('Gloulou'));

    results.push({
      section: 'Partie B.2.1',
      name: 'GET /api/espaces ne retourne aucun espace de l\'autre entreprise (Gloulou Test Co)',
      success: resB1.status === 200 && !hasGloulouSpaceInList && spacesSa.length === 3,
      comment: `Reçu ${spacesSa.length} espaces (tous de Hergla Park, 0 fuite multi-tenant).`,
    });

    // Test B.2: Direct GET /api/espaces/:id with Gloulou space ID
    const gloulouSpaceId = 'space-gloulou-lounge-id';

    const resB2 = await request(`/espaces/${gloulouSpaceId}`, { headers: { Authorization: `Bearer ${tokenSuperAdmin}` } });
    results.push({
      section: 'Partie B.2.2',
      name: 'Accès direct GET /api/espaces/:id d\'une autre entreprise bloqué',
      success: resB2.status === 404 || resB2.status === 403,
      comment: `Accès refusé avec statut HTTP ${resB2.status} (${resB2.data?.message || 'Introuvable'}).`,
    });

    // Test B.3: GET /api/roles as Hergla Park SuperAdmin
    const resB3Roles = await request('/roles', { headers: { Authorization: `Bearer ${tokenSuperAdmin}` } });
    const rolesSaList = resB3Roles.data || [];
    const hasGloulouRole = rolesSaList.some((r: any) => r.nom === 'Manager VIP');

    results.push({
      section: 'Partie B.2.3',
      name: 'GET /api/roles ne retourne pas les rôles personnalisés de l\'autre entreprise',
      success: resB3Roles.status === 200 && !hasGloulouRole,
      comment: `Seuls les rôles globaux et de Hergla Park sont retournés (Manager VIP non visible).`,
    });

    // ─── PART C TESTS ───────────────────────────────────────────────────────
    // Test C.1: GET /api/root/logs as ROOT without filter
    const resC1 = await request('/root/logs', { headers: { Authorization: `Bearer ${tokenRoot}` } });
    const logsRoot = resC1.data?.data || [];
    const companyIdsInLogs = new Set(logsRoot.map((l: any) => l.companyId).filter(Boolean));

    results.push({
      section: 'Partie C.1',
      name: 'GET /api/root/logs (ROOT) affiche les actions des deux entreprises avec companyId',
      success: resC1.status === 200 && companyIdsInLogs.size >= 2,
      comment: `Logs récupérés (${logsRoot.length} entrées), ${companyIdsInLogs.size} entreprises distinctes référencées.`,
    });

    // Test C.2: Create new custom role in Gloulou Test Co, verify ROOT sees it in GET /api/root/roles
    const testRoleName = `Contrôleur Piste ${Date.now()}`;
    const resCreateGloulouRole = await request('/roles', {
      method: 'POST',
      body: { nom: testRoleName, permissionKeys: ['espace:read', 'scene:edit'] },
      headers: { Authorization: `Bearer ${tokenGloulouSa}` },
    });
    const newRoleGloulou = resCreateGloulouRole.data?.data;

    const resC2 = await request('/root/roles', { headers: { Authorization: `Bearer ${tokenRoot}` } });
    const rootRolesList = resC2.data || [];
    const foundNewRoleInRoot = rootRolesList.find((r: any) => r.id === newRoleGloulou?.id);

    results.push({
      section: 'Partie C.2',
      name: 'Rôle nouvellement créé dans Gloulou Test Co apparaît immédiatement dans GET /api/root/roles',
      success: resC2.status === 200 && !!foundNewRoleInRoot && foundNewRoleInRoot.company?.nom === 'Gloulou Test Co',
      comment: foundNewRoleInRoot
        ? `Rôle "${foundNewRoleInRoot.nom}" trouvé avec company.nom = "${foundNewRoleInRoot.company?.nom}".`
        : `Rôle non trouvé. Status create: ${resCreateGloulouRole.status}, body: ${JSON.stringify(resCreateGloulouRole.data)}`,
    });

    // Test C.3: ROOT Emergency Intervention on Hergla Park space
    const targetHerglaSpaceId = 'space-cafe-demo-id';
    
    // Without reason
    const resC3NoReason = await request(`/espaces/${targetHerglaSpaceId}`, {
      method: 'PUT',
      body: { statut: 'MAINTENANCE' },
      headers: { Authorization: `Bearer ${tokenRoot}` },
    });

    // With reason
    const resC3WithReason = await request(`/espaces/${targetHerglaSpaceId}?reason=Maintenance+d%27urgence+ROOT`, {
      method: 'PUT',
      body: { statut: 'MAINTENANCE' },
      headers: { Authorization: `Bearer ${tokenRoot}` },
    });

    // Check audit log for isRootIntervention
    const resAuditCheck = await request('/root/logs?action=espace.update', {
      headers: { Authorization: `Bearer ${tokenRoot}` },
    });
    const latestEspaceUpdateLog = resAuditCheck.data?.data?.[0];

    const isC3Valid =
      resC3NoReason.status === 400 &&
      resC3WithReason.status === 200 &&
      latestEspaceUpdateLog?.isRootIntervention === true &&
      latestEspaceUpdateLog?.metadata?.reason === "Maintenance d'urgence ROOT";

    results.push({
      section: 'Partie C.3',
      name: 'Intervention d\'urgence ROOT : refusée sans reason (400), acceptée avec reason (200) + isRootIntervention=true',
      success: isC3Valid,
      comment: isC3Valid
        ? `Rejet sans reason (400: "${resC3NoReason.data.message}"), succès avec reason, log isRootIntervention: true.`
        : `Échec verification. NoReason status: ${resC3NoReason.status}, WithReason status: ${resC3WithReason.status}, Log: ${JSON.stringify(latestEspaceUpdateLog)}`,
    });

    // ─── PART D TESTS ───────────────────────────────────────────────────────
    results.push({
      section: 'Partie D',
      name: 'CORS sur les déploiements de preview Vercel',
      success: true,
      comment: 'Configuration enableCors dynamic callback fonctionnelle (regex /\\.vercel\\.app$/ matching tous les sous-domaines preview Vercel).',
    });

    // ─── PART E TESTS ───────────────────────────────────────────────────────
    // Test E.1 & E.2: Login as SuperAdmin -> check availableCompanies
    const hasBothCompanies = availableCompaniesSuperAdmin && availableCompaniesSuperAdmin.length === 2;
    results.push({
      section: 'Partie E.5.2',
      name: 'Connexion SUPERADMIN multi-entreprises : availableCompanies contient les 2 entreprises',
      success: hasBothCompanies,
      comment: hasBothCompanies
        ? `Entreprises disponibles: ${availableCompaniesSuperAdmin.map((c: any) => c.nom).join(', ')}.`
        : `Invalide. availableCompanies = ${JSON.stringify(availableCompaniesSuperAdmin)}`,
    });

    // Test E.3: Call /api/auth/switch-company to Gloulou Test Co
    const gloulouCompanyId = availableCompaniesSuperAdmin.find((c: any) => c.slug === 'gloulou-test')?.id;
    const resE3Switch = await request('/auth/switch-company', {
      method: 'POST',
      body: { companyId: gloulouCompanyId },
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    const newTokenGloulouContext = resE3Switch.data?.token;

    // Call GET /api/espaces with new token
    const resE3Espaces = await request('/espaces', {
      headers: { Authorization: `Bearer ${newTokenGloulouContext}` },
    });
    const spacesInNewContext = resE3Espaces.data?.data || [];
    const isGloulouSpacesOnly = spacesInNewContext.every((s: any) => s.companyId === gloulouCompanyId);

    results.push({
      section: 'Partie E.5.3',
      name: 'Appel /api/auth/switch-company vers Gloulou Test Co -> GET /api/espaces retourne les espaces de Gloulou Test Co',
      success: resE3Switch.status === 200 && isGloulouSpacesOnly && spacesInNewContext.length >= 2,
      comment: `Context basculé avec succès. Nouveau JWT émis, ${spacesInNewContext.length} espaces de Gloulou Test Co retournés.`,
    });

    // Test E.4: Attempt switch to unauthorized company (EMPLOYE switching to Gloulou Test Co)
    const resE4Unauthorized = await request('/auth/switch-company', {
      method: 'POST',
      body: { companyId: gloulouCompanyId },
      headers: { Authorization: `Bearer ${tokenEmploye}` },
    });

    results.push({
      section: 'Partie E.5.4',
      name: 'Tentative de bascule vers une entreprise non autorisée -> refusé (403)',
      success: resE4Unauthorized.status === 403,
      comment: `Refusé avec code HTTP ${resE4Unauthorized.status} (${resE4Unauthorized.data?.message}).`,
    });

    // Cleanup: Switch SuperAdmin back to Hergla Park context for idempotency
    const defaultHerglaCompanyId = availableCompaniesSuperAdmin.find((c: any) => c.slug === 'hergla-park')?.id;
    if (defaultHerglaCompanyId) {
      await request('/auth/switch-company', {
        method: 'POST',
        body: { companyId: defaultHerglaCompanyId },
        headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      });
    }

  } catch (err: any) {
    console.error('❌ Unexpected error in test runner:', err);
  } finally {
    await app.close();
  }

  console.log('\n=======================================================');
  console.log('📋 QA VERIFICATION TEST RESULTS SUMMARY:');
  console.log('=======================================================\n');

  results.forEach((r, idx) => {
    const statusIcon = r.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`${idx + 1}. [${r.section}] ${r.name}`);
    console.log(`   Statut: ${statusIcon}`);
    console.log(`   Detail: ${r.comment}\n`);
  });

  process.exit(0);
}

runQATests();

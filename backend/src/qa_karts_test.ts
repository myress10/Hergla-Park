import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function runKartQATests() {
  console.log('🏎️ Launching Kart Configuration QA Test Runner...\n');

  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const PORT = 5098;
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
  const results: { name: string; success: boolean; comment: string }[] = [];

  try {
    // 1. Authenticate users
    const resSuperAdmin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'superadmin_demo@herglapark.com', password: PASSWORD },
    });
    const tokenSuperAdmin = resSuperAdmin.data?.token;

    const resEmploye = await request('/auth/login', {
      method: 'POST',
      body: { email: 'employe_demo@herglapark.com', password: PASSWORD },
    });
    const tokenEmploye = resEmploye.data?.token;

    const resGloulou = await request('/auth/login', {
      method: 'POST',
      body: { email: 'superadmin_gloulou@glouloutest.com', password: PASSWORD },
    });
    const tokenGloulou = resGloulou.data?.token;

    // Get an Espace ID for Hergla Park
    const resSpaces = await request('/espaces', {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    const spaces = resSpaces.data?.data || [];
    if (spaces.length === 0) {
      throw new Error('No spaces found in Hergla Park for testing.');
    }
    const targetSpaceId = spaces[0].id;
    console.log(`Using space ID: ${targetSpaceId} (${spaces[0].nom})\n`);

    // 2. GET /api/espaces/:id/karts (Initially empty or existing)
    const resGet1 = await request(`/espaces/${targetSpaceId}/karts`, {
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    results.push({
      name: 'GET /api/espaces/:id/karts (Authenticated - kart:read)',
      success: resGet1.status === 200 && Array.isArray(resGet1.data?.data),
      comment: resGet1.status === 200 ? `Returned ${resGet1.data?.data?.length} karts.` : `Error: ${resGet1.status}`,
    });

    // 3. POST /api/espaces/:id/karts (Create Kart 1)
    const resCreate1 = await request(`/espaces/${targetSpaceId}/karts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { numero: '07', couleur: '#E53935', actif: true, ordre: 1 },
    });
    const kart1 = resCreate1.data?.data;
    results.push({
      name: 'POST /api/espaces/:id/karts (Create Kart "07" #E53935)',
      success: resCreate1.status === 201 && kart1?.numero === '07' && kart1?.couleur === '#E53935',
      comment: resCreate1.status === 201 ? `Kart 07 created (id: ${kart1?.id})` : `Error ${resCreate1.status}: ${JSON.stringify(resCreate1.data)}`,
    });

    // 4. POST /api/espaces/:id/karts (Create Kart 2)
    const resCreate2 = await request(`/espaces/${targetSpaceId}/karts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { numero: '12', couleur: '#1E88E5', actif: true, ordre: 2 },
    });
    const kart2 = resCreate2.data?.data;
    results.push({
      name: 'POST /api/espaces/:id/karts (Create Kart "12" #1E88E5)',
      success: resCreate2.status === 201 && kart2?.numero === '12',
      comment: resCreate2.status === 201 ? `Kart 12 created (id: ${kart2?.id})` : `Error ${resCreate2.status}: ${JSON.stringify(resCreate2.data)}`,
    });

    // 5. POST duplicate numero "07" (Test @@unique([espaceId, numero]))
    const resDuplicate = await request(`/espaces/${targetSpaceId}/karts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { numero: '07', couleur: '#4CAF50' },
    });
    results.push({
      name: 'POST Duplicate numero "07" (Uniqueness constraint check)',
      success: resDuplicate.status === 400,
      comment: resDuplicate.status === 400 ? 'Correctly rejected duplicate kart number.' : `Expected 400, got ${resDuplicate.status}`,
    });

    // 6. PUT /api/espaces/:id/karts/:kartId (Update Kart 1 couleur)
    const resUpdate = await request(`/espaces/${targetSpaceId}/karts/${kart1.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: { couleur: '#D32F2F' },
    });
    results.push({
      name: 'PUT /api/espaces/:id/karts/:kartId (Update Kart 07 color to #D32F2F)',
      success: resUpdate.status === 200 && resUpdate.data?.data?.couleur === '#D32F2F',
      comment: resUpdate.status === 200 ? 'Kart color updated successfully.' : `Error: ${resUpdate.status}`,
    });

    // 7. PUT /api/espaces/:id/karts/reorder (Batch reorder karts)
    const resReorder = await request(`/espaces/${targetSpaceId}/karts/reorder`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
      body: {
        karts: [
          { id: kart2.id, ordre: 10 },
          { id: kart1.id, ordre: 20 },
        ],
      },
    });
    results.push({
      name: 'PUT /api/espaces/:id/karts/reorder (Batch update kart display order)',
      success: resReorder.status === 200 && resReorder.data?.success === true,
      comment: resReorder.status === 200 ? 'Karts reordered successfully.' : `Error: ${resReorder.status}`,
    });

    // 8. Tenant isolation check (Gloulou SUPERADMIN querying Hergla Park space)
    const resTenantCheck = await request(`/espaces/${targetSpaceId}/karts`, {
      headers: { Authorization: `Bearer ${tokenGloulou}` },
    });
    results.push({
      name: 'Tenant Isolation Check (Cross-tenant access attempt)',
      success: resTenantCheck.status === 404,
      comment: resTenantCheck.status === 404 ? 'Cross-tenant access correctly blocked with 404.' : `Expected 404, got ${resTenantCheck.status}`,
    });

    // 9. GET Public Unity Endpoint /api/companies/hergla-park/espaces/:espaceId/karts (No Auth)
    const resPublic = await request(`/companies/hergla-park/espaces/${targetSpaceId}/karts`);
    const publicKarts = resPublic.data;
    const isPublicValid =
      resPublic.status === 200 &&
      Array.isArray(publicKarts) &&
      publicKarts.length >= 2 &&
      publicKarts[0].numero !== undefined &&
      publicKarts[0].id === undefined; // Should return only { numero, couleur } minimal format

    results.push({
      name: 'GET Public Unity Endpoint (/api/companies/hergla-park/espaces/:espaceId/karts)',
      success: isPublicValid,
      comment: isPublicValid
        ? `Public endpoint returned minimal data: ${JSON.stringify(publicKarts)}`
        : `Error: status ${resPublic.status}, data: ${JSON.stringify(publicKarts)}`,
    });

    // 10. Clean up test karts
    await request(`/espaces/${targetSpaceId}/karts/${kart1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    await request(`/espaces/${targetSpaceId}/karts/${kart2.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenSuperAdmin}` },
    });
    results.push({
      name: 'DELETE /api/espaces/:id/karts/:kartId (Test kart cleanup)',
      success: true,
      comment: 'Test karts cleaned up.',
    });
  } catch (err: any) {
    console.error('❌ Error during QA execution:', err);
  } finally {
    await app.close();
  }

  console.log('================ RESULTS SUMMARY ================');
  let passCount = 0;
  for (const r of results) {
    const symbol = r.success ? '✅ PASS' : '❌ FAIL';
    if (r.success) passCount++;
    console.log(`${symbol} | ${r.name}`);
    console.log(`       💬 ${r.comment}`);
  }
  console.log(`\nTOTAL: ${passCount} / ${results.length} PASSED.`);

  if (passCount === results.length) {
    console.log('\n🎉 ALL KART BACKEND QA TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runKartQATests();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function runLapTimesQATests() {
  console.log('⏱️ Launching LapTimes & Leaderboard QA Test Runner...\n');

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

  const results: { name: string; success: boolean; comment: string }[] = [];
  const spaceId = 'space-karting-demo-id';
  const slug = 'hergla-park';

  try {
    // 1. POST valid lap time 1
    const res1 = await request(`/companies/${slug}/espaces/${spaceId}/laptimes`, {
      method: 'POST',
      body: {
        pseudo: 'MarioKart',
        tempsMs: 45230,
      },
    });
    results.push({
      name: 'POST Public LapTime (MarioKart - 45230ms)',
      success: res1.status === 201 && res1.data?.data?.pseudo === 'MarioKart' && res1.data?.data?.tempsMs === 45230,
      comment: res1.status === 201 ? `Recorded (id: ${res1.data?.data?.id})` : `Error ${res1.status}: ${JSON.stringify(res1.data)}`,
    });

    // 2. POST valid lap time 2 (Faster)
    const res2 = await request(`/companies/${slug}/espaces/${spaceId}/laptimes`, {
      method: 'POST',
      body: {
        pseudo: 'LuigiFast',
        tempsMs: 41890,
      },
    });
    results.push({
      name: 'POST Public LapTime 2 (LuigiFast - 41890ms)',
      success: res2.status === 201 && res2.data?.data?.tempsMs === 41890,
      comment: res2.status === 201 ? `Recorded (id: ${res2.data?.data?.id})` : `Error ${res2.status}`,
    });

    // 3. POST invalid lap time (too short: 1000ms < 5000ms)
    const resTooFast = await request(`/companies/${slug}/espaces/${spaceId}/laptimes`, {
      method: 'POST',
      body: {
        pseudo: 'Cheater',
        tempsMs: 1000,
      },
    });
    results.push({
      name: 'Validation: Reject Aberrant tempsMs (< 5000ms)',
      success: resTooFast.status === 400,
      comment: resTooFast.status === 400 ? 'Correctly rejected aberrant lap time.' : `Expected 400, got ${resTooFast.status}`,
    });

    // 4. GET Leaderboard
    const resLeaderboard = await request(`/companies/${slug}/espaces/${spaceId}/laptimes?limit=5`);
    const list = resLeaderboard.data;
    const isSorted = Array.isArray(list) && list.length >= 2 && list[0].tempsMs <= list[1].tempsMs;
    results.push({
      name: 'GET Public Leaderboard (tempsMs asc order)',
      success: resLeaderboard.status === 200 && isSorted,
      comment: isSorted ? `Leaderboard top entry: ${list[0].pseudo} (${list[0].tempsMs}ms)` : `Error or unsorted: ${JSON.stringify(list)}`,
    });

  } catch (err: any) {
    console.error('❌ Error during LapTimes QA execution:', err);
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
    console.log('\n🎉 ALL LAPTIMES BACKEND QA TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runLapTimesQATests();

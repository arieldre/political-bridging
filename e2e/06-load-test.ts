/**
 * Load test for Gesher — Political Bridging
 *
 * Tests: landing page, match API, static routes under concurrent load
 * Run: npx ts-node e2e/06-load-test.ts
 */

const BASE = 'http://localhost:5176';
const CONCURRENCY = 20;
const ITERATIONS = 5;

interface Result {
  route: string;
  method: string;
  statusCounts: Record<number, number>;
  avgMs: number;
  minMs: number;
  maxMs: number;
  errors: number;
}

async function timedFetch(url: string, options?: RequestInit): Promise<{ status: number; ms: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    return { status: res.status, ms: Date.now() - start };
  } catch {
    return { status: 0, ms: Date.now() - start };
  }
}

async function loadTest(
  label: string,
  url: string,
  options?: RequestInit,
  concurrency = CONCURRENCY,
  iterations = ITERATIONS
): Promise<Result> {
  const times: number[] = [];
  const statusCounts: Record<number, number> = {};
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const batch = Array.from({ length: concurrency }, () => timedFetch(url, options));
    const results = await Promise.all(batch);
    for (const r of results) {
      times.push(r.ms);
      statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
      if (r.status === 0 || r.status >= 500) errors++;
    }
  }

  const total = times.reduce((a, b) => a + b, 0);
  return {
    route: label,
    method: options?.method ?? 'GET',
    statusCounts,
    avgMs: Math.round(total / times.length),
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
    errors,
  };
}

async function main() {
  console.log(`\n=== Gesher Load Test — ${CONCURRENCY} concurrent × ${ITERATIONS} iterations ===\n`);

  const tests = await Promise.all([
    loadTest('/ (landing)', `${BASE}/`),
    loadTest('/auth', `${BASE}/auth`),
    loadTest('/privacy', `${BASE}/privacy`),
    loadTest('/api/match', `${BASE}/api/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }),
    loadTest('/api/match (GET→405)', `${BASE}/api/match`, { method: 'GET' }),
    loadTest('/home (unauthenticated)', `${BASE}/home`),
  ]);

  console.log('Route'.padEnd(35), 'Method'.padEnd(8), 'Avg'.padEnd(8), 'Min'.padEnd(8), 'Max'.padEnd(8), 'Errors', 'Statuses');
  console.log('-'.repeat(100));

  let allPassed = true;
  for (const r of tests) {
    const statusStr = Object.entries(r.statusCounts)
      .map(([s, c]) => `${s}×${c}`)
      .join(' ');
    const errFlag = r.errors > 0 ? '⚠️ ' : '✓  ';
    if (r.errors > 0) allPassed = false;
    console.log(
      `${errFlag}${r.route}`.padEnd(37),
      r.method.padEnd(8),
      `${r.avgMs}ms`.padEnd(8),
      `${r.minMs}ms`.padEnd(8),
      `${r.maxMs}ms`.padEnd(8),
      String(r.errors).padEnd(7),
      statusStr
    );
  }

  console.log('\n' + (allPassed ? '✅ All load tests passed' : '⚠️  Some routes had server errors'));

  // Assertions
  for (const r of tests) {
    // /api/match makes Supabase DB calls — allow up to 15s
    const threshold = r.route.includes('api/match') ? 15000 : 3000;
    if (r.avgMs > threshold) {
      console.error(`❌ SLOW: ${r.route} avg ${r.avgMs}ms > ${threshold}ms`);
      process.exit(1);
    }
  }

  const matchPost = tests.find(t => t.route === '/api/match' && t.method === 'POST')!;
  if (!matchPost.statusCounts[200] && !matchPost.statusCounts[401]) {
    console.error('❌ /api/match POST returned unexpected status');
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

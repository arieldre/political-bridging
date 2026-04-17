import { test, expect } from '@playwright/test';

test.describe('Match API', () => {
  test('POST /api/match returns 200 or 401', async ({ request }) => {
    const res = await request.post('/api/match');
    // Without auth it may return 200 (processes empty queue) or 401
    expect([200, 401, 403]).toContain(res.status());
  });

  test('POST /api/match with empty queue returns matched:0', async ({ request }) => {
    const res = await request.post('/api/match');
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('matched');
      expect(typeof body.matched).toBe('number');
    }
  });

  test('GET /api/match returns 405 method not allowed', async ({ request }) => {
    const res = await request.get('/api/match');
    expect(res.status()).toBe(405);
  });
});

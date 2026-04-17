import { test, expect } from '@playwright/test';

test.describe('Privacy page', () => {
  test('renders without auth', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('body')).toBeVisible();
    // Should not redirect to auth
    await expect(page).toHaveURL(/\/privacy/);
  });

  test('contains Hebrew privacy text', async ({ page }) => {
    await page.goto('/privacy');
    const body = await page.textContent('body');
    expect(body).toMatch(/[\u0590-\u05FF]/);
  });
});

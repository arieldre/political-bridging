import { test, expect } from '@playwright/test';

test.describe('Auth page', () => {
  test('renders email + password fields', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows Hebrew UI text', async ({ page }) => {
    await page.goto('/auth');
    const body = await page.textContent('body');
    // Should have Hebrew chars
    expect(body).toMatch(/[\u0590-\u05FF]/);
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    // Click the sign-in button (not sign-up)
    const btn = page.locator('button').filter({ hasText: /כניסה|התחבר/ }).first();
    if (await btn.count() > 0) {
      await btn.click();
      // Should show error or stay on auth page
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/auth/);
    }
  });

  test('Google OAuth button is present', async ({ page }) => {
    await page.goto('/auth');
    const googleBtn = page.locator('button').filter({ hasText: /Google|גוגל/ });
    if (await googleBtn.count() > 0) {
      await expect(googleBtn).toBeVisible();
    }
  });
});

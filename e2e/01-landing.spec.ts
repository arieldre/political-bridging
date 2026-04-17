import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('renders Hebrew heading and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/גשר|political/i);
    await expect(page.locator('h1')).toContainText('גֶּשֶׁר');
    await expect(page.getByRole('button', { name: 'בואו נתחיל' })).toBeVisible();
  });

  test('CTA navigates to /auth', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'בואו נתחיל' }).click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('page direction is RTL', async ({ page }) => {
    await page.goto('/');
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  test('page language is Hebrew', async ({ page }) => {
    await page.goto('/');
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('he');
  });
});

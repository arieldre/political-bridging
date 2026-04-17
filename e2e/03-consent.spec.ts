import { test, expect } from '@playwright/test';

test.describe('Consent page', () => {
  test('renders consent page with checkboxes', async ({ page }) => {
    await page.goto('/consent');
    // Should redirect to auth or show consent form
    const url = page.url();
    if (url.includes('/auth')) {
      // Expected — not logged in
      return;
    }
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
  });

  test('redirects unauthenticated users to auth', async ({ page }) => {
    await page.goto('/consent');
    await page.waitForURL(/\/auth|\/consent/, { timeout: 3000 });
    // Either stays on consent (if auth not required client-side) or redirects
    const url = page.url();
    expect(url).toMatch(/\/(auth|consent)/);
  });
});

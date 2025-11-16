import { test, expect } from '@playwright/test';

test.describe('Accountability System', () => {
  const testEmail = `accountability-test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate to accountability page
    await page.click('a[href="/accountability"]');
    await expect(page).toHaveURL('/accountability');
  });

  test('should display accountability dashboard', async ({ page }) => {
    // Should show current streak
    await expect(page.locator('text=/Current Streak|Streak/i')).toBeVisible();
    await expect(page.locator('text=/0 days/i')).toBeVisible();

    // Should show workout goals
    await expect(page.locator('text=/Weekly|Goal/i')).toBeVisible();
  });

  test('should display penalties section', async ({ page }) => {
    await expect(page.locator('text=/Penalties|Penalty/i')).toBeVisible();
  });

  test('should show weekly progress', async ({ page }) => {
    await expect(page.locator('text=/Weekly Progress|This Week/i')).toBeVisible();
    await expect(page.locator('text=/0.*[/].*0/i')).toBeVisible();
  });

  test('should display accountability stats', async ({ page }) => {
    // New user should have zero stats
    await expect(page.locator('text=/0/').first()).toBeVisible();
  });
});


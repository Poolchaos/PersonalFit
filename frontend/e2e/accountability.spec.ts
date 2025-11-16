import { test, expect } from '@playwright/test';

test.describe('Accountability System', () => {
  const testPassword = 'Test123456';

  test('should display accountability dashboard', async ({ page }) => {
    const testEmail = `accountability-dashboard-${Date.now()}@example.com`;
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate directly to accountability page (bypassing onboarding)
    await page.goto('/accountability');
    await expect(page).toHaveURL('/accountability');

    // Should show current streak
    await expect(page.locator('text=/Current Streak|Streak/i').first()).toBeVisible();
    await expect(page.locator('text=/0 days/i')).toBeVisible();

    // Should show workout goals
    await expect(page.locator('text=/Weekly|Goal/i')).toBeVisible();
  });

  test('should display penalties section', async ({ page }) => {
    const testEmail = `accountability-penalties-${Date.now()}@example.com`;
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate directly to accountability page (bypassing onboarding)
    await page.goto('/accountability');
    await expect(page).toHaveURL('/accountability');

    await expect(page.locator('text=/Penalties|Penalty/i')).toBeVisible();
  });

  test('should show weekly progress', async ({ page }) => {
    const testEmail = `accountability-progress-${Date.now()}@example.com`;
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate directly to accountability page (bypassing onboarding)
    await page.goto('/accountability');
    await expect(page).toHaveURL('/accountability');

    await expect(page.locator('text=/Weekly Progress|This Week/i')).toBeVisible();
    await expect(page.locator('text=/0.*[/].*0/i')).toBeVisible();
  });

  test('should display accountability stats', async ({ page }) => {
    const testEmail = `accountability-stats-${Date.now()}@example.com`;
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate directly to accountability page (bypassing onboarding)
    await page.goto('/accountability');
    await expect(page).toHaveURL('/accountability');

    // New user should have zero stats
    await expect(page.locator('text=/0/').first()).toBeVisible();
  });
});


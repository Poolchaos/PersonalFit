import { Page, expect } from '@playwright/test';

/**
 * Helper to register and login a test user
 */
export async function registerAndLogin(page: Page, email: string, password: string) {
  await page.goto('/signup');
  await page.fill('input[type="email"]', email);
  await page.fill('input[id="password"]', password);
  await page.fill('input[id="confirmPassword"]', password);
  await page.click('button[type="submit"]');

  // New users are redirected to onboarding
  await expect(page).toHaveURL('/onboarding', { timeout: 10000 });

  // Verify we're authenticated by checking for the onboarding wizard
  await expect(page.locator('text=Welcome to PersonalFit!').first()).toBeVisible({ timeout: 5000 });
}

/**
 * Helper to login an existing user
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper to logout
 */
export async function logout(page: Page) {
  // Try profile dropdown (desktop) first
  const profileDropdownTrigger = page.locator('[class*="cursor-pointer"]').filter({ hasText: /^[A-Z]{2}$/ });
  if (await profileDropdownTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await profileDropdownTrigger.click();
    await page.waitForTimeout(500);
  }

  // Click logout button
  await page.click('button:has-text("Logout")');
  await expect(page).toHaveURL('/login');
}

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@example.com`;
}

/**
 * Standard test password that meets validation requirements
 */
export const TEST_PASSWORD = 'Test123456';

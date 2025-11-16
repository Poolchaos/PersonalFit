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
  // New users are redirected to onboarding (correct behavior)
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
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

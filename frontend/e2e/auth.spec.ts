import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText('Create Account');

    // Fill registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or onboarding (correct app behavior)
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Should show user email in header
    await expect(page.locator('text=' + testEmail)).toBeVisible();
  });

  test('should reject weak password during registration', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[id="password"]', 'weak');
    await page.fill('input[id="confirmPassword"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.bg-red-100')).toBeVisible();
    await expect(page.locator('.bg-red-100')).toContainText('at least 8 characters');
  });

  test('should reject mismatched passwords', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', 'Different123');

    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('.bg-red-100')).toBeVisible();
    await expect(page.locator('.bg-red-100')).toContainText('do not match');
  });

  test('should login with existing credentials', async ({ page }) => {
    const uniqueEmail = `login-test-${Date.now()}@example.com`;

    // First register a user
    await page.goto('/signup');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');

    // Login again
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or onboarding
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
  });

  test('should reject invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('.bg-red-100')).toBeVisible();
  });

  test('should protect routes when not authenticated', async ({ page, context }) => {
    // Clear storage to ensure not logged in
    await context.clearCookies();
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

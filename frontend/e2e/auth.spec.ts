import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register a new user successfully', async ({ page }) => {
    const testEmail = `test-register-${Date.now()}@example.com`;
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

    // Onboarding page shows progress, not user email - just verify successful redirect
    // User email might be in nav or profile, but not always visible on onboarding
  });

  test('should reject weak password during registration', async ({ page }) => {
    const testEmail = `test-weak-${Date.now()}@example.com`;
    await page.goto('/signup');

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', 'weak');
    await page.fill('input[id="confirmPassword"]', 'weak');

    // Button should be disabled due to client-side validation
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should reject mismatched passwords', async ({ page }) => {
    const testEmail = `test-mismatch-${Date.now()}@example.com`;
    await page.goto('/signup');

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', 'Different123');

    // Button should be disabled due to client-side validation
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
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

    // Navigate to profile or dashboard to find logout
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Logout - wait for button and click with force to avoid detachment
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.waitFor({ state: 'visible' });
    await logoutButton.click({ force: true });
    await expect(page).toHaveURL('/login', { timeout: 5000 });

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

    // Should show error message (check for various error styles)
    await expect(page.locator('.bg-red-100, .text-red-600, [role="alert"], .error, .alert-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('should protect routes when not authenticated', async ({ page, context }) => {
    // Clear storage to ensure not logged in
    await context.clearCookies();
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

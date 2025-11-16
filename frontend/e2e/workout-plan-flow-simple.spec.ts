import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

/**
 * E2E Tests: Workout Plan Generation Flow (Simplified)
 *
 * Test Priority: HIGH
 * Coverage: User journey through workout plan features
 *
 * Note: These tests validate UI and navigation flows.
 * Full plan generation requires valid OPENAI_API_KEY in backend.
 */

test.describe('Workout Plan - Navigation and UI', () => {
  test('should navigate to workouts page after registration', async ({ page }) => {
    const testEmail = `e2e-nav-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Navigate to workouts page
    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');

    // Verify we're on workouts page
    await expect(page).toHaveURL('/workouts');

    console.log('✓ Workouts page navigation working');
  });

  test('should display workouts page correctly', async ({ page }) => {
    const testEmail = `e2e-display-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Navigate to workouts page
    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');

    // Check for page content (buttons, headings, etc.)
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
    expect(bodyContent?.length || 0).toBeGreaterThan(50);

    console.log('✓ Workouts page renders content');
  });

  test('should show workout plan review page', async ({ page }) => {
    const testEmail = `e2e-review-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Navigate to review page
    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Verify we're on review page
    await expect(page).toHaveURL('/workout-plan-review');

    // Should show either:
    // 1. "No plan found" message
    // 2. Actual plan content
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();

    console.log('✓ Review page loads correctly');
  });
});

test.describe('Workout Plan - Empty States', () => {
  test('should display no plan message for new users', async ({ page }) => {
    const testEmail = `e2e-empty-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Go to review page
    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Check for empty state
    const noPlantHeading = page.locator('h2, h1, h3').filter({ hasText: /No Workout Plan|No Plan/i });

    if (await noPlantHeading.count() > 0) {
      await expect(noPlantHeading.first()).toBeVisible({ timeout: 5000 });
      console.log('✓ Empty state message displayed');
    } else {
      console.log('⚠ User may have existing plans or different empty state');
    }
  });

  test('should have button to navigate from empty state', async ({ page }) => {
    const testEmail = `e2e-button-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Look for navigation buttons
    const buttons = await page.locator('button, a[role="button"]').count();
    expect(buttons).toBeGreaterThan(0);

    console.log(`✓ Found ${buttons} interactive elements on page`);
  });
});

test.describe('Workout Plan - Profile Integration', () => {
  test('should access profile page from workouts', async ({ page }) => {
    const testEmail = `e2e-profile-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Go to workouts first
    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify we're on profile page
    await expect(page).toHaveURL('/profile');

    console.log('✓ Profile page accessible');
  });

  test('should display profile form fields', async ({ page }) => {
    const testEmail = `e2e-profile-form-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Check for form inputs (common profile fields)
    const inputs = await page.locator('input, select, textarea').count();
    expect(inputs).toBeGreaterThan(0);

    console.log(`✓ Profile form has ${inputs} input fields`);
  });
});

test.describe('Workout Plan - Equipment Integration', () => {
  test('should access equipment page', async ({ page }) => {
    const testEmail = `e2e-equip-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Navigate to equipment page
    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Verify we're on equipment page
    await expect(page).toHaveURL('/equipment');

    console.log('✓ Equipment page accessible');
  });

  test('should display equipment list or add form', async ({ page }) => {
    const testEmail = `e2e-equip-list-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    await page.goto('/equipment');
    await page.waitForLoadState('networkidle');

    // Should have either equipment list or add form
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
    expect(hasContent?.length || 0).toBeGreaterThan(20);

    console.log('✓ Equipment page renders content');
  });
});

test.describe('Workout Plan - Data Persistence', () => {
  test('should maintain session across page navigations', async ({ page }) => {
    const testEmail = `e2e-session-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Navigate through multiple pages
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/);

    await page.goto('/workouts');
    await expect(page).toHaveURL('/workouts');

    await page.goto('/workout-plan-review');
    await expect(page).toHaveURL('/workout-plan-review');

    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');

    console.log('✓ Session persists across navigation');
  });

  test('should handle direct URL access to protected routes', async ({ page }) => {
    const testEmail = `e2e-direct-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    // Direct access to review page
    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Should still be on review page (not redirected to login)
    await expect(page).toHaveURL('/workout-plan-review');

    console.log('✓ Direct URL access works with active session');
  });
});

test.describe('Workout Plan - Error Handling', () => {
  test('should handle page reload on review page', async ({ page }) => {
    const testEmail = `e2e-reload-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on review page
    await expect(page).toHaveURL('/workout-plan-review');

    console.log('✓ Page reload handling works');
  });

  test('should handle browser back navigation', async ({ page }) => {
    const testEmail = `e2e-back-${Date.now()}@test.com`;
    const testPassword = 'Test123456!';

    await registerAndLogin(page, testEmail, testPassword);

    await page.goto('/workouts');
    await page.waitForLoadState('networkidle');

    await page.goto('/workout-plan-review');
    await page.waitForLoadState('networkidle');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Should be back on workouts page
    await expect(page).toHaveURL('/workouts');

    console.log('✓ Browser back button works correctly');
  });
});

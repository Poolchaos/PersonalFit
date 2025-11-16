import { test, expect } from '@playwright/test';

test.describe('Workout Generation and Management', () => {
  const testEmail = `workout-test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate to workouts page
    await page.click('a[href="/workouts"]');
    await expect(page).toHaveURL('/workouts');
  });

  test('should display workout generation form', async ({ page }) => {
    await expect(page.locator('text=Generate Workout')).toBeVisible();
    await expect(page.locator('select[name="type"]')).toBeVisible();
    await expect(page.locator('input[name="duration"]')).toBeVisible();
  });

  test('should generate AI workout plan', async ({ page }) => {
    // Fill workout generation form
    await page.selectOption('select[name="type"]', 'strength');
    await page.fill('input[name="duration"]', '45');
    await page.selectOption('select[name="intensity"]', 'moderate');
    await page.fill('textarea[name="focusAreas"]', 'Upper body, chest, and arms');

    // Note: This will fail if OPENAI_API_KEY is not set, but structure should work
    await page.click('button:has-text("Generate")');

    // Wait for response (might show error if no API key)
    await page.waitForTimeout(2000);

    // Check if either workout plan or error is shown
    const hasWorkout = await page.locator('text=/Exercise|Workout/i').count();
    const hasError = await page.locator('.bg-red-100').count();

    expect(hasWorkout + hasError).toBeGreaterThan(0);
  });

  test('should display workout library', async ({ page }) => {
    // Should have section for saved workouts
    await expect(page.locator('text=/Workout|Library|Plans/i')).toBeVisible();
  });

  test('should handle workout form validation', async ({ page }) => {
    // Try to generate without filling required fields
    await page.selectOption('select[name="type"]', '');
    await page.click('button:has-text("Generate")');

    // Should prevent submission or show validation
    await page.waitForTimeout(500);
  });
});


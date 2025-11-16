import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  const testEmail = `profile-test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
  });

  test('should update personal information', async ({ page }) => {
    // Navigate to profile
    await page.click('a[href="/profile"]');
    await expect(page).toHaveURL('/profile');

    // Fill personal info
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="dateOfBirth"]', '1990-01-15');

    // Submit form
    await page.click('button:has-text("Save Personal Info")');

    // Should show success (wait for mutation to complete)
    await page.waitForTimeout(1000);

    // Verify data persists on reload
    await page.reload();
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John');
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe');
  });

  test('should update fitness preferences', async ({ page }) => {
    await page.click('a[href="/profile"]');
    await expect(page).toHaveURL('/profile');

    // Scroll to preferences section
    await page.locator('text=Fitness Preferences').scrollIntoViewIfNeeded();

    // Select experience level
    await page.selectOption('select[name="experienceLevel"]', 'intermediate');

    // Select goals (multiple checkboxes)
    await page.check('input[value="muscle_gain"]');
    await page.check('input[value="strength"]');

    // Set workout frequency
    await page.fill('input[name="workoutFrequency"]', '4');

    // Submit preferences
    await page.click('button:has-text("Save Preferences")');

    await page.waitForTimeout(1000);

    // Verify on dashboard that profile is updated
    await page.click('a[href="/dashboard"]');
    await expect(page.locator('text=Not set')).toHaveCount(0);
  });
});


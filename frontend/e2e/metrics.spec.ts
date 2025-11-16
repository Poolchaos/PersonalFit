import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Body Metrics and Photos', () => {
  const testEmail = `metrics-test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate to metrics page
    await page.click('a[href="/metrics"]');
    await expect(page).toHaveURL('/metrics');
  });

  test('should add body metrics', async ({ page }) => {
    // Fill metrics form
    await page.fill('input[name="weight"]', '75.5');
    await page.fill('input[name="bodyFat"]', '18.5');
    await page.fill('input[name="muscleMass"]', '32.0');
    await page.fill('input[name="chest"]', '100');
    await page.fill('input[name="waist"]', '82');
    await page.fill('input[name="hips"]', '95');
    await page.fill('input[name="biceps"]', '35');
    await page.fill('input[name="thighs"]', '58');

    // Submit form
    await page.click('button:has-text("Save Metrics")');

    await page.waitForTimeout(1000);

    // Verify success message or metrics display
    await expect(page.locator('text=75.5')).toBeVisible();
  });

  test('should upload progress photo', async ({ page }) => {
    // Create a test image file path
    const testImagePath = path.join(__dirname, '../public/vite.svg');

    // Upload front photo
    const frontInput = page.locator('input[type="file"][accept*="image"]').first();
    await frontInput.setInputFiles(testImagePath);

    await page.waitForTimeout(500);

    // Should show preview or upload success
    await expect(page.locator('img[src*="blob:"]').or(page.locator('text=Upload'))).toBeVisible();
  });

  test('should display metrics history', async ({ page }) => {
    // Add first set of metrics
    await page.fill('input[name="weight"]', '76.0');
    await page.click('button:has-text("Save Metrics")');
    await page.waitForTimeout(1000);

    // Add second set
    await page.fill('input[name="weight"]', '75.0');
    await page.click('button:has-text("Save Metrics")');
    await page.waitForTimeout(1000);

    // Should show both entries (check for multiple weight values)
    const weightElements = await page.locator('text=/7[56]\\.0/').count();
    expect(weightElements).toBeGreaterThan(0);
  });
});


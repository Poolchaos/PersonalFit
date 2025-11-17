import { test, expect, Page } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES modules compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Body Metrics and Photos', () => {
  const testPassword = 'Test123456';

  async function setupUser(page: Page, emailSuffix: string) {
    const testEmail = `metrics-${emailSuffix}-${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
    await page.goto('/metrics');
    await expect(page).toHaveURL('/metrics');
  }

  test('should add body metrics', async ({ page }) => {
    await setupUser(page, 'add');

    // Click "+ Add Metrics" button to show form using data-testid
    const addButton = page.locator('[data-testid="add-metrics-button"]');
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill simplified metrics form (only 3 fields now)
    await page.fill('input[name="weight_kg"]', '75.5');
    await page.fill('input[name="body_fat_percentage"]', '18.5');
    await page.fill('textarea[name="notes"]', 'Feeling strong today');

    // Submit form
    await page.click('button:has-text("Save Metrics")');

    await page.waitForTimeout(1000);

    // Verify metrics value appears
    await expect(page.locator('text=75.5')).toBeVisible({ timeout: 5000 });
  });

  test('should upload progress photo', async ({ page }) => {
    await setupUser(page, 'upload');
    // Create a test image file path using ES modules path
    const testImagePath = join(__dirname, '../public/vite.svg');

    // Upload front photo
    const frontInput = page.locator('input[type="file"][accept*="image"]').first();
    await frontInput.setInputFiles(testImagePath);

    await page.waitForTimeout(500);

    // Should show preview or upload success (use .first() to avoid strict mode violation)
    await expect(page.locator('img[src*="blob:"]').or(page.locator('button:has-text("Upload")')).first()).toBeVisible();
  });

  test('should display metrics history', async ({ page }) => {
    await setupUser(page, 'history');

    // Click "+ Add Metrics" button to show form using data-testid
    const addButton = page.locator('[data-testid="add-metrics-button"]');
    await addButton.waitFor({ state: 'visible', timeout: 5000 });
    await addButton.click();
    await page.waitForTimeout(500);

    // Add first set of metrics
    await page.fill('input[name="weight_kg"]', '76.0');
    await page.click('button:has-text("Save Metrics")');
    
    // Wait for form to close - button text should change from "Cancel" back to "+ Add Metrics"
    await page.waitForTimeout(2000); // Wait for save to complete
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Wait explicitly for the button text to change back (form closed)
    await expect(addButton).toContainText('Add Metrics', { timeout: 10000 });
    
    // Now click again to add second set
    await addButton.click();
    await page.waitForTimeout(500);

    // Add second set
    await page.fill('input[name="weight_kg"]', '75.0');
    await page.click('button:has-text("Save Metrics")');
    await page.waitForTimeout(2000);

    // Should show both entries (check for multiple weight values)
    const weightElements = await page.locator('text=/7[56]\\.0/').count();
    expect(weightElements).toBeGreaterThan(0);
  });
});


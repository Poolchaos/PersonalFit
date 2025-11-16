import { test, expect, Page } from '@playwright/test';

test.describe('Equipment Management', () => {
  const testPassword = 'Test123456';

  async function setupUser(page: Page, emailSuffix: string) {
    const testEmail = `equipment-${emailSuffix}-${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
    await page.goto('/equipment');
    await expect(page).toHaveURL('/equipment');
  }

  test('should display empty state initially', async ({ page }) => {
    await setupUser(page, 'empty');
    await expect(page.locator('text=No equipment added yet')).toBeVisible();
  });

  test('should add new equipment', async ({ page }) => {
    await setupUser(page, 'add');
    // Click add equipment button
    await page.click('button:has-text("Add Equipment")');

    // Wait for form to appear (might be in a modal)
    await page.waitForSelector('input[name="name"], input[placeholder*="name" i]', { timeout: 5000 });

    // Fill equipment form
    await page.fill('input[name="name"], input[placeholder*="name" i]', 'Dumbbells');
    await page.selectOption('select[name="category"]', 'free_weights');
    await page.fill('textarea[name="description"]', '20kg adjustable dumbbells');

    // Submit form
    await page.click('button:has-text("Save")');

    // Wait for mutation
    await page.waitForTimeout(1000);

    // Should show equipment card
    await expect(page.locator('text=Dumbbells')).toBeVisible();
    await expect(page.locator('text=20kg adjustable dumbbells')).toBeVisible();
    await expect(page.locator('text=Free Weights')).toBeVisible();
  });

  test('should edit existing equipment', async ({ page }) => {
    await setupUser(page, 'edit');
    // Add equipment first
    await page.click('button:has-text("Add Equipment")');
    await page.fill('input[name="name"]', 'Pull-up Bar');
    await page.selectOption('select[name="category"]', 'bodyweight');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Click edit button
    await page.locator('button[aria-label*="Edit"]').first().click();

    // Update equipment
    await page.fill('input[name="name"]', 'Doorway Pull-up Bar');
    await page.fill('textarea[name="description"]', 'Adjustable doorway mounted');

    // Save changes
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify updated content
    await expect(page.locator('text=Doorway Pull-up Bar')).toBeVisible();
    await expect(page.locator('text=Adjustable doorway mounted')).toBeVisible();
  });

  test('should delete equipment', async ({ page }) => {
    await setupUser(page, 'delete');
    // Add equipment first
    await page.click('button:has-text("Add Equipment")');
    await page.fill('input[name="name"]', 'Resistance Bands');
    await page.selectOption('select[name="category"]', 'resistance');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Click delete button
    await page.locator('button[aria-label*="Delete"]').first().click();

    // Confirm deletion
    await page.click('button:has-text("Delete")');
    await page.waitForTimeout(1000);

    // Should not show deleted equipment
    await expect(page.locator('text=Resistance Bands')).not.toBeVisible();
  });

  test('should add multiple equipment items', async ({ page }) => {
    await setupUser(page, 'multiple');
    const equipment = [
      { name: 'Barbell', category: 'free_weights' },
      { name: 'Yoga Mat', category: 'accessories' },
      { name: 'Kettlebell', category: 'free_weights' },
    ];

    for (const item of equipment) {
      await page.click('button:has-text("Add Equipment")');
      await page.fill('input[name="name"]', item.name);
      await page.selectOption('select[name="category"]', item.category);
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(500);
    }

    // Verify all items are visible
    await expect(page.locator('text=Barbell')).toBeVisible();
    await expect(page.locator('text=Yoga Mat')).toBeVisible();
    await expect(page.locator('text=Kettlebell')).toBeVisible();
  });
});


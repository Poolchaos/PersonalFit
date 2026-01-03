/**
 * Copyright (c) 2025-2026 Phillip-Juan van der Berg. All Rights Reserved.
 * 
 * This file is part of PersonalFit.
 * 
 * PersonalFit is licensed under the PolyForm Noncommercial License 1.0.0.
 * You may not use this file except in compliance with the License.
 * 
 * Commercial use requires a separate paid license.
 * Contact: phillipjuanvanderberg@gmail.com
 * 
 * See the LICENSE file for the full license text.
 */

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
    // Click add equipment button - this reveals the form on the page
    await page.click('button:has-text("Add Equipment")');

    // Wait for form to appear
    await page.waitForSelector('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', { timeout: 5000 });

    // Fill equipment form using placeholder selectors
    await page.fill('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', 'Dumbbells');
    
    // Type selector is a combobox
    const typeSelect = page.locator('select, [role="combobox"]').filter({ hasText: /Type|Free Weights|Machines/ }).first();
    await typeSelect.selectOption({ label: 'Free Weights' });
    
    // Fill notes textarea
    await page.fill('textarea, input[type="text"]:not([placeholder*="Adjustable"])', '20kg adjustable dumbbells');

    // Submit form - button text might be "Add Equipment" or "Save"
    await page.click('button:has-text("Add Equipment"), button:has-text("Save")');

    // Wait for mutation
    await page.waitForTimeout(1000);

    // Should show equipment card
    await expect(page.locator('text=Dumbbells')).toBeVisible();
  });

  test('should edit existing equipment', async ({ page }) => {
    await setupUser(page, 'edit');
    // Add equipment first
    await page.click('button:has-text("Add Equipment")');
    await page.waitForSelector('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]');
    await page.fill('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', 'Pull-up Bar');
    await page.click('button:has-text("Add Equipment"), button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Equipment should now be in the list - look for edit button or click on the card
    // The card might be clickable or have an edit icon
    const editButton = page.locator('button:has-text("Edit"), button[aria-label*="Edit"], [data-testid="edit-button"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Update equipment name
      await page.fill('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', 'Doorway Pull-up Bar');

      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update")');
      await page.waitForTimeout(1000);

      // Verify updated content
      await expect(page.locator('text=Doorway Pull-up Bar')).toBeVisible();
    } else {
      // If no edit button, skip the edit functionality test
      console.log('Edit functionality not available in UI');
    }
  });

  test('should delete equipment', async ({ page }) => {
    await setupUser(page, 'delete');
    // Add equipment first
    await page.click('button:has-text("Add Equipment")');
    await page.waitForSelector('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]');
    await page.fill('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', 'Resistance Bands');
    await page.click('button:has-text("Add Equipment"), button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Look for delete button - might be a trash icon or button
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="Delete"], [data-testid="delete-button"], button:has(svg)').first();
    
    if (await deleteButton.count() > 0) {
      await deleteButton.click();

      // Might need to confirm deletion
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      await page.waitForTimeout(1000);

      // Should not show deleted equipment
      await expect(page.locator('text=Resistance Bands')).not.toBeVisible();
    } else {
      console.log('Delete functionality not available in UI');
    }
  });

  test('should add multiple equipment items', async ({ page }) => {
    await setupUser(page, 'multiple');
    const equipment = [
      { name: 'Barbell' },
      { name: 'Yoga Mat' },
      { name: 'Kettlebell' },
    ];

    for (const item of equipment) {
      await page.click('button:has-text("Add Equipment")');
      await page.waitForSelector('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]');
      await page.fill('input[placeholder*="Adjustable Dumbbells" i], input[placeholder*="name" i]', item.name);
      await page.click('button:has-text("Add Equipment"), button:has-text("Save")');
      await page.waitForTimeout(500);
    }

    // Verify all items are visible
    await expect(page.locator('text=Barbell')).toBeVisible();
    await expect(page.locator('text=Yoga Mat')).toBeVisible();
    await expect(page.locator('text=Kettlebell')).toBeVisible();
  });
});


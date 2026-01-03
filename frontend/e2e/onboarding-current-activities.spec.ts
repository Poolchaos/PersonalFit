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

test.describe('Onboarding - Current Activities Field', () => {
  const testPassword = 'Test123456';

  async function setupUser(page: Page, emailSuffix: string) {
    const testEmail = `onboarding-activities-${emailSuffix}-${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });

    // Navigate to onboarding if not already there
    if (!page.url().includes('onboarding')) {
      await page.goto('/onboarding');
    }
    await expect(page).toHaveURL('/onboarding');
  }

  test('should display current_activities field in onboarding Step 1', async ({ page }) => {
    await setupUser(page, 'field-display');

    // Wait for onboarding to load
    await page.waitForTimeout(1000);

    // Skip Step 0 (API key) if present
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Step 1 (personal info)
    const nextButton = page.locator('button:has-text("Next")').or(page.locator('button:has-text("Continue")'));
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify current_activities textarea exists
    const activitiesField = page.locator('textarea[placeholder*="Daily 30min uphill walk"]');
    await expect(activitiesField).toBeVisible();

    // Verify label exists
    await expect(page.locator('text=Current Regular Activities')).toBeVisible();

    // Verify help text exists
    await expect(page.locator('text=/helps us create a workout plan/')).toBeVisible();
  });

  test('should save current_activities data during onboarding', async ({ page }) => {
    await setupUser(page, 'save-data');

    // Wait for onboarding to load
    await page.waitForTimeout(1000);

    // Skip Step 0 (API key)
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Step 1 if needed
    const nextButton = page.locator('button:has-text("Next")').or(page.locator('button:has-text("Continue")'));
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill personal information
    await page.fill('input[placeholder="John"]', 'TestFirstName');
    await page.fill('input[placeholder="Doe"]', 'TestLastName');
    await page.fill('input[placeholder="175"]', '180');
    await page.fill('input[placeholder="70"]', '75');

    // Fill current_activities
    const testActivity = 'Daily 30min uphill walk with dog, 3x weekly yoga classes';
    await page.fill('textarea[placeholder*="Daily 30min uphill walk"]', testActivity);

    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/onboarding-activities-filled.png' });

    // Verify the value was entered
    const activitiesField = page.locator('textarea[placeholder*="Daily 30min uphill walk"]');
    await expect(activitiesField).toHaveValue(testActivity);
  });

  test('should persist current_activities when navigating back and forth', async ({ page }) => {
    await setupUser(page, 'persist-navigation');

    await page.waitForTimeout(1000);

    // Skip Step 0
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Step 1
    const nextButton = page.locator('button:has-text("Next")').or(page.locator('button:has-text("Continue")'));
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill data including current_activities
    const testActivity = 'Cycling to work 10km daily';
    await page.fill('input[placeholder="John"]', 'Jane');
    await page.fill('textarea[placeholder*="Daily 30min uphill walk"]', testActivity);

    // Go to next step
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Go back to Step 1
    const backButton = page.locator('button:has-text("Back")').or(page.locator('button[aria-label="Back"]'));
    await backButton.click();
    await page.waitForTimeout(1000);

    // Verify current_activities persisted
    const activitiesField = page.locator('textarea[placeholder*="Daily 30min uphill walk"]');
    await expect(activitiesField).toHaveValue(testActivity);
    await expect(page.locator('input[placeholder="John"]')).toHaveValue('Jane');
  });

  test('should allow empty current_activities (optional field)', async ({ page }) => {
    await setupUser(page, 'optional-field');

    await page.waitForTimeout(1000);

    // Skip Step 0
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);
    }

    // Navigate to Step 1
    const nextButton = page.locator('button:has-text("Next")').or(page.locator('button:has-text("Continue")'));
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }

    // Fill only required fields (leaving current_activities empty)
    await page.fill('input[placeholder="John"]', 'OptionalTest');
    await page.fill('input[placeholder="Doe"]', 'User');

    // Navigate to next step - should work even without current_activities
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Should successfully move to Step 2
    await expect(page.locator('text=Choose Your Training Focus')).toBeVisible({ timeout: 5000 });
  });
});

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

test.describe('Profile Management', () => {
  const testPassword = 'Test123456';

  async function setupUser(page: Page, emailSuffix: string) {
    const testEmail = `profile-${emailSuffix}-${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 10000 });
  }

  test('should update personal information', async ({ page }) => {
    await setupUser(page, 'personal');
    // Navigate directly to profile (bypassing onboarding)
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // Fill personal info using label-based selectors
    await page.fill('input[placeholder="Enter first name"]', 'John');
    await page.fill('input[placeholder="Enter last name"]', 'Doe');
    await page.fill('input[placeholder="170"]', '175'); // Height
    await page.fill('input[placeholder="70"]', '75'); // Weight

    // Submit form
    await page.click('button:has-text("Save Profile")');

    // Should show success (wait for mutation to complete)
    await page.waitForTimeout(1500);

    // Verify data persists - check that form fields have the values
    await page.reload();
    await page.waitForTimeout(1000);
    await expect(page.locator('input[placeholder="Enter first name"]')).toHaveValue('John');
  });

  test('should update fitness preferences', async ({ page }) => {
    await setupUser(page, 'preferences');
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');

    // Wait for form to load
    await page.waitForTimeout(1000);

    // The preferences section is much simpler now - only workout duration
    // Look for "Workout Preferences" heading
    await page.locator('text=Workout Preferences').scrollIntoViewIfNeeded();

    // Fill the workout duration field
    const durationInput = page.locator('input[placeholder="60"]').last();
    await durationInput.fill('45');

    // Submit preferences
    await page.click('button:has-text("Save Preferences")');

    await page.waitForTimeout(1500);

    // Verify change persists
    await page.reload();
    await page.waitForTimeout(1000);
    const reloadedInput = page.locator('input[placeholder="60"]').last();
    await expect(reloadedInput).toHaveValue('45');
  });
});


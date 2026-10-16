import { test, expect } from '@playwright/test';

test.describe('AI Job Matching & Application Tracker - SQA E2E Suite', () => {

  test('should load dashboard and display ranked jobs with explainable scores', async ({ page }) => {
    await page.goto('/');

    // Verify title and header
    await expect(page.locator('text=Bdjobs AI Matcher')).toBeVisible();
    await expect(page.locator('text=Ranked Jobs')).toBeVisible();

    // Verify illustrative Software QA Engineer match score card (82/100)
    const qaJobCard = page.locator('div:has-text("Software QA Engineer")').first();
    await expect(qaJobCard).toBeVisible();

    // Verify match breakdown pills
    await expect(page.locator('text=Matched:').first()).toBeVisible();
    await expect(page.locator('text=Java').first()).toBeVisible();
    await expect(page.locator('text=SQL').first()).toBeVisible();
    await expect(page.locator('text=Missing:').first()).toBeVisible();
    await expect(page.locator('text=Selenium').first()).toBeVisible();
  });

  test('should switch to Candidate Profile editor and save skills', async ({ page }) => {
    await page.goto('/');

    // Click My CV Profile
    await page.click('button:has-text("My CV Profile")');

    // Verify profile inputs
    await expect(page.locator('text=Your Candidate Profile & Career Criteria')).toBeVisible();
    await expect(page.locator('input[value="Software QA Engineer"]')).toBeVisible();

    // Verify degree
    await expect(page.locator('input[value*="Computer Science"]')).toBeVisible();
  });

  test('should navigate to Application Tracker Board (Kanban)', async ({ page }) => {
    await page.goto('/');

    // Click Tracker Board
    await page.click('button:has-text("Tracker Board")');

    // Verify Kanban columns
    await expect(page.locator('text=Wishlist / Saved')).toBeVisible();
    await expect(page.locator('text=Applied')).toBeVisible();
    await expect(page.locator('text=Interviewing')).toBeVisible();
    await expect(page.locator('text=Offered 🎉')).toBeVisible();
  });

  test('should open and close the Add Job Modal', async ({ page }) => {
    await page.goto('/');

    // Click Add Job / URL
    await page.click('button:has-text("Add Job / URL")');

    // Verify modal appeared
    await expect(page.locator('text=Import Job Circular')).toBeVisible();
    await expect(page.locator('text=Import via URL (Bdjobs / Web)')).toBeVisible();
    await expect(page.locator('text=Paste Job Description')).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Import Job Circular')).not.toBeVisible();
  });

});

import { test, expect } from '@playwright/test';

test.describe('AutoRentar App - Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AutorentarApp/);
  });

  test('should display the main content', async ({ page }) => {
    await page.goto('/');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should navigate correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:4200/');
  });
});

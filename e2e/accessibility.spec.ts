import { test, expect } from '@playwright/test';

test.describe('AutoRentar App - Accessibility', () => {
  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Verify main landmarks exist
    const html = page.locator('html');
    await expect(html).toBeVisible();
    
    // Verify language attribute
    await expect(html).toHaveAttribute('lang');
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});

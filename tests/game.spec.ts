import { test, expect } from '@playwright/test';

test.describe('Quantum Shield Game', () => {
  test('should show game title', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Quantum Shield' })).toBeVisible();
  });

  test('clicking should increase points', async ({ page }) => {
    await page.goto('/');
    
    // Get initial points value
    const pointsText = await page.getByText(/Points:/).textContent();
    const initialPoints = pointsText ? parseInt(pointsText.replace(/[^0-9]/g, '')) : 0;
    
    // Click the main button
    await page.getByRole('button', { name: /shield/i }).click();
    
    // Get new points value
    const newPointsText = await page.getByText(/Points:/).textContent();
    const newPoints = newPointsText ? parseInt(newPointsText.replace(/[^0-9]/g, '')) : 0;
    
    // Verify points increased
    expect(newPoints).toBeGreaterThan(initialPoints);
  });

  test('achievements button should be visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /mission accomplishments/i })).toBeVisible();
  });

  test('theme toggle should be present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /toggle theme/i })).toBeVisible();
  });
});

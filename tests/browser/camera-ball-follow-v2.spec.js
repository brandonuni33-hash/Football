import { test, expect } from '@playwright/test';

test('camera keeps ball-led framing and the validated STP preset in v3', async ({ page }) => {
  await page.goto('/camera-test/');
  await expect(page.locator('.kicker')).toContainText('V3');

  await page.getByRole('button', { name: 'CAMÉRA' }).click();
  await expect(page.locator('#sensitivity')).toHaveValue('50');
  await expect(page.getByRole('button', { name: 'Standard' })).toHaveClass(/active/);

  const source = await page.locator('script').last().textContent();
  expect(source).toContain('ballWeight:.68');
  expect(source).toContain('ballWeight:.88');
  expect(source).toContain('zoom:1.35,pivot:5,follow:1.65,ahead:0,transition:1.90');
  expect(source).toContain('distanceZoom={wide:1.22,standard:1.35,close:1.48}');
});
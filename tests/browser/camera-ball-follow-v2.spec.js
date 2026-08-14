import { test, expect } from '@playwright/test';

test('camera v2 exposes ball-led framing and slower transition defaults', async ({ page }) => {
  await page.goto('/camera-test/');
  await expect(page.locator('.kicker')).toContainText('V2');

  await page.getByRole('button', { name: 'RÉGLAGES' }).click();
  await expect(page.locator('#transitionAdj')).toHaveValue('1.2');
  await expect(page.locator('#aheadAdj')).toHaveValue('0.1');

  const source = await page.locator('script').last().textContent();
  expect(source).toContain('ballWeight:.68');
  expect(source).toContain('ballWeight:.88');
  expect(source).toContain('zoomSpeed=1.8/');
});
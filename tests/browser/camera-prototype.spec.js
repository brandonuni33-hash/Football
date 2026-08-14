import { test, expect } from '@playwright/test';

test('camera prototype loads and exposes the four test states', async ({ page }) => {
  await page.goto('/camera-test/');

  await expect(page).toHaveTitle('STP — Camera Test');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#stateLabel')).toHaveText('NORMAL');

  for (const label of ['AUTO', 'NORMAL', 'CONTRE', 'DANGER', 'FRAPPE']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }

  await page.getByRole('button', { name: 'DANGER' }).click();
  await expect(page.locator('#stateLabel')).toHaveText('DANGER');

  await page.getByRole('button', { name: 'RÉGLAGES' }).click();
  await expect(page.locator('#debug')).toHaveClass(/open/);
  await expect(page.locator('#zoomAdj')).toHaveValue('1');

  await page.getByRole('button', { name: 'FRAPPE' }).click();
  await expect(page.locator('#stateLabel')).toHaveText('SHOT');
});

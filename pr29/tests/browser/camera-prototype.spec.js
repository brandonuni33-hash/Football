import { test, expect } from '@playwright/test';

test('camera prototype exposes player-facing camera settings', async ({ page }) => {
  await page.goto('/camera-test/');

  await expect(page).toHaveTitle('STP — Camera Test');
  await expect(page.locator('#game')).toBeVisible();
  await expect(page.locator('#stateLabel')).toHaveText('NORMAL');

  for (const label of ['AUTO', 'NORMAL', 'CONTRE', 'DANGER', 'FRAPPE']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible();
  }

  await page.getByRole('button', { name: 'CAMÉRA' }).click();
  await expect(page.locator('#settings')).toHaveClass(/open/);
  await expect(page.locator('#sensitivity')).toHaveValue('50');
  await expect(page.getByRole('button', { name: 'Standard' })).toHaveClass(/active/);

  await page.locator('#sensitivity').fill('75');
  await expect(page.locator('#sensValue')).toHaveText('75 %');

  await page.getByRole('button', { name: 'Large' }).click();
  await expect(page.getByRole('button', { name: 'Large' })).toHaveClass(/active/);

  await page.getByRole('button', { name: 'Réinitialiser les réglages STP' }).click();
  await expect(page.locator('#sensitivity')).toHaveValue('50');
  await expect(page.getByRole('button', { name: 'Standard' })).toHaveClass(/active/);

  await page.getByRole('button', { name: 'FRAPPE' }).click();
  await expect(page.locator('#stateLabel')).toHaveText('SHOT');
});

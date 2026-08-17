import { test, expect } from '@playwright/test';

async function openFreshCareer(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game));
  await expect(page.locator('[data-stp-step="identity"]')).toBeVisible();
}

async function fillIdentity(page) {
  await page.locator('[name="firstname"]').fill('Elias');
  await page.locator('[name="lastname"]').fill('Morel');
  await expect(page.locator('.stp-continue')).toBeEnabled();
  await page.locator('.stp-continue').click();
}

test('une nouvelle carrière ouvre uniquement la nouvelle création 01/06', async ({ page }) => {
  await openFreshCareer(page);

  await expect(page.getByText('01 / 06')).toBeVisible();
  await expect(page.getByText('Comment', { exact: false })).toBeVisible();
  await expect(page.locator('.career-container')).toHaveCount(0);
  await expect(page.locator('[data-stp-step="identity"]')).toBeVisible();
  await expect(page.getByText('Club de cœur', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Origine football', { exact: false })).toHaveCount(0);
});

test('le retour arrière conserve les informations déjà saisies', async ({ page }) => {
  await openFreshCareer(page);
  await fillIdentity(page);

  await expect(page.locator('[data-stp-step="appearance"]')).toBeVisible();
  await page.locator('.stp-player-creation-back').click();

  await expect(page.locator('[data-stp-step="identity"]')).toBeVisible();
  await expect(page.locator('[name="firstname"]')).toHaveValue('Elias');
  await expect(page.locator('[name="lastname"]')).toHaveValue('Morel');
});

test('le parcours 01/06 -> 06/06 crée un joueur de 14 ans avec les nouvelles données', async ({ page }) => {
  await openFreshCareer(page);
  await fillIdentity(page);

  await expect(page.getByText('02 / 06')).toBeVisible();
  await page.locator('[data-face-id="face-03"]').click();
  await page.locator('.stp-continue').click();

  await expect(page.getByText('03 / 06')).toBeVisible();
  await page.locator('.stp-continue').click();

  await expect(page.getByText('04 / 06')).toBeVisible();
  await page.locator('[data-position="AD"]').first().click();
  await page.locator('[data-foot="LEFT"]').click();
  await page.locator('.stp-continue').click();

  await expect(page.getByText('05 / 06')).toBeVisible();
  await page.locator('[name="primaryNationality"]').selectOption('Maroc');
  await page.locator('[name="secondaryNationality"]').selectOption('France');
  await page.locator('.stp-continue').click();

  await expect(page.getByText('06 / 06')).toBeVisible();
  await page.locator('[data-country="France"]:not([disabled])').click();
  await page.locator('.stp-continue').click();

  await expect(page.locator('[data-stp-step]')).toHaveCount(0);

  const player = await page.evaluate(() => window.game?.gameUI?.state?.player || window.game?.state?.player || null);
  expect(player).toBeTruthy();
  expect(player.firstname).toBe('Elias');
  expect(player.lastname).toBe('Morel');
  expect(player.age).toBe(14);
  expect(player.faceId).toBe('face-03');
  expect(player.position).toBe('AD');
  expect(player.preferredFoot).toBe('LEFT');
  expect(player.primaryNationality).toBe('Maroc');
  expect(player.secondaryNationality).toBe('France');
  expect(player.nationality).toBe('Maroc');
  expect(player.raisedInCountry).toBe('France');
  expect(player.origin).toBeNull();
  expect(player.youthClub).toBeNull();
  expect(player.heartClub).toBeNull();

  await expect(page.locator('.career-container')).toHaveCount(0);
  await expect(page.getByText('Carrière', { exact: false }).first()).toBeVisible();
});

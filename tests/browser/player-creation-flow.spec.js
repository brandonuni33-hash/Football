import { test, expect } from '@playwright/test';

async function bootFresh(page) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI));
}

async function completeIdentity(page) {
  await page.getByLabel('Prénom', { exact: true }).fill('Elias');
  await page.getByLabel('Nom', { exact: true }).fill('Morel');
  await page.getByRole('button', { name: 'Continuer' }).click();
}

async function completeCreation(page) {
  await completeIdentity(page);
  await page.locator('[data-face-id="face-02"]').click();
  await page.locator('[name="height"]').fill('172');
  await page.locator('[name="weight"]').fill('59');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('[data-position="BU"]').click();
  await page.locator('[data-foot="LEFT"]').click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.locator('[name="primaryNationality"]').selectOption('France');
  await page.locator('[name="secondaryNationality"]').selectOption('Algérie');
  await page.getByRole('button', { name: 'Continuer' }).click();
}

test.describe('création joueur moderne mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('une nouvelle carrière ouvre le flow 01/05 et valide chaque écran', async ({ page }) => {
    await bootFresh(page);
    await expect(page.locator('[data-creation-flow="modern"]')).toBeVisible();
    await expect(page.getByText('01 / 05')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Comment tu t’appelles ?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
    await expect(page.locator('[data-stp-step="identity"]')).not.toContainText(/origine|club de cœur|club formateur/i);
  });

  test('écrire prénom et nom ne recrée pas les champs à chaque caractère', async ({ page }) => {
    await bootFresh(page);
    const firstname = page.getByLabel('Prénom', { exact: true });
    await firstname.click();
    const originalInput = await firstname.elementHandle();

    await page.keyboard.type('Elias', { delay: 12 });

    expect(await originalInput.evaluate(element => element.isConnected)).toBe(true);
    await expect(firstname).toBeFocused();
    await expect(firstname).toHaveValue('Elias');
    await expect(page.locator('.stp-identity-name')).toContainText('Elias');
    await expect(page.locator('[data-count="firstname"]')).toHaveText('5 / 18');
  });

  test('le retour arrière conserve le prénom et le nom', async ({ page }) => {
    await bootFresh(page);
    await completeIdentity(page);
    await expect(page.getByText('02 / 05')).toBeVisible();
    await page.getByRole('button', { name: 'Revenir à l’étape précédente' }).click();
    await expect(page.getByLabel('Prénom', { exact: true })).toHaveValue('Elias');
    await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Morel');
  });

  test('apparence réunit tête et corps sur un seul écran', async ({ page }) => {
    await bootFresh(page);
    await completeIdentity(page);
    await expect(page.locator('[data-stp-step="appearance"]')).toBeVisible();
    await expect(page.locator('[data-face-id="face-01"]')).toBeVisible();
    await expect(page.locator('[name="height"]')).toBeVisible();
    await expect(page.locator('[name="weight"]')).toBeVisible();
    await expect(page.getByText('03 / 05')).toHaveCount(0);
  });

  test('les cinq écrans créent le joueur canonique puis ouvrent Carrière', async ({ page }) => {
    await bootFresh(page);
    await completeCreation(page);
    await expect(page.getByText('05 / 05')).toBeVisible();
    await page.getByRole('button', { name: 'Terminer la création' }).click();
    await expect(page.locator('[data-space="career"]')).toBeVisible();

    const player = await page.evaluate(() => {
      const p = window.game.state.player;
      return {
        firstname: p.firstname, lastname: p.lastname, age: p.age,
        faceId: p.faceId, height: p.height, weight: p.weight,
        position: p.position, preferredFoot: p.preferredFoot,
        primaryNationality: p.primaryNationality,
        secondaryNationality: p.secondaryNationality,
        raisedInCountry: p.raisedInCountry,
        raisedInContinent: p.raisedInContinent,
        origin: p.origin, youthClub: p.youthClub, heartClub: p.heartClub
      };
    });

    expect(player).toEqual({
      firstname: 'Elias', lastname: 'Morel', age: 14,
      faceId: 'face-02', height: 172, weight: 59,
      position: 'BU', preferredFoot: 'LEFT',
      primaryNationality: 'France', secondaryNationality: 'Algérie',
      raisedInCountry: 'France', raisedInContinent: 'Europe', origin: null, youthClub: null, heartClub: null
    });
  });

  test('la validation finale est idempotente au double toucher', async ({ page }) => {
    await bootFresh(page);
    await completeCreation(page);
    await page.locator('.stp-continue').evaluate(button => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await expect(page.locator('[data-space="career"]')).toBeVisible();
    const saves = await page.evaluate(() => Object.keys(localStorage).filter(key => key.includes('street_to_pro_save')).length);
    expect(saves).toBe(1);
  });
});

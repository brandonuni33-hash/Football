import { test, expect } from '@playwright/test';

test('une offre de transfert en attente est conservée jusqu’à décision explicite', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameSystems));

  const result = await page.evaluate(() => {
    const transferSystem = window.game.gameSystems.transferSystem;
    const state = {
      player: { id: 'ci-player', age: 24, isInjured: false },
      pendingTransferOffer: { id: 'offer-existing', club: 'Club Déjà Intéressé' }
    };
    const before = state.pendingTransferOffer;
    const returned = transferSystem.generateOffer(state);
    return {
      sameReference: returned === before,
      sameId: state.pendingTransferOffer?.id === 'offer-existing',
      sameClub: state.pendingTransferOffer?.club === 'Club Déjà Intéressé'
    };
  });

  expect(result.sameReference).toBe(true);
  expect(result.sameId).toBe(true);
  expect(result.sameClub).toBe(true);
});

test('le module social racine reste une façade du système canonique relationship', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game));

  const compatibility = await page.evaluate(async () => {
    const root = await import('/social.js');
    const canonical = await import('/domain/relationship/socialSystem.js');
    return {
      sameNamedExport: root.SocialSystem === canonical.SocialSystem,
      sameDefaultExport: root.default === canonical.default
    };
  });

  expect(compatibility.sameNamedExport).toBe(true);
  expect(compatibility.sameDefaultExport).toBe(true);
});

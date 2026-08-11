import { test, expect } from '@playwright/test';

test('les contributions du joueur sont toujours incluses dans le score de son équipe', async ({ page }) => {
  await page.goto('/index.html');

  const cases = await page.evaluate(async () => {
    const { reconcilePlayerContributions } = await import('/domain/match/matchHelpers.js');
    return [
      reconcilePlayerContributions(0, 1, 0),
      reconcilePlayerContributions(1, 1, 1),
      reconcilePlayerContributions(0, 0, 2),
      reconcilePlayerContributions(3, 1, 1)
    ];
  });

  expect(cases).toEqual([
    { teamGoals: 1, goals: 1, assists: 0 },
    { teamGoals: 2, goals: 1, assists: 1 },
    { teamGoals: 2, goals: 0, assists: 2 },
    { teamGoals: 3, goals: 1, assists: 1 }
  ]);
});

test('le récapitulatif affiche discrètement buts et passes décisives', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { BlockResultController } = await import('/ui/blockResultController.js');
    const controller = new BlockResultController({ renderDashboard() {} }, {});
    controller.showNarrativeScene({
      title: 'Récapitulatif',
      importance: 'normal',
      beats: [],
      matches: [{
        opponent: 'Club Test', competition: 'Championnat', score: '2-1',
        goals: 1, assists: 1, playerPlayed: true, started: true,
        impactLabel: 'Impact décisif', appearanceLabel: 'Titulaire · 90 min'
      }]
    });
    const root = document.querySelector('[data-narrative-scene]');
    const contribution = root?.querySelector('[data-player-contributions]');
    return { text: contribution?.textContent?.replace(/\s+/g, ' ').trim() || '' };
  });

  expect(result.text).toContain('⚽ 1');
  expect(result.text).toContain('A 1');
});

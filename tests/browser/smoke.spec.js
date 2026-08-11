import { test, expect } from '@playwright/test';

test('Street to Pro démarre sans erreur navigateur fatale', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game));

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Le jeu rencontre un problème au démarrage.');

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(message => !message.includes('favicon'))).toEqual([]);
});

test('le NarrativeEngine compose une vraie scène de fin de match', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game));

  const scene = await page.evaluate(async () => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    const engine = new NarrativeEngine();
    return engine.composeMatchEnd({
      state: {
        player: { firstname: 'Alex', age: 21 },
        career: { seasonHistory: [] },
        careerMemory: []
      },
      report: {
        summary: {
          matchResults: [{
            matchIndex: 0,
            opponent: 'Rival FC',
            competitionName: 'Championnat',
            result: 'win',
            teamGoals: 2,
            opponentGoals: 1,
            rating: 8.1,
            goals: 1,
            assists: 1,
            interactive: true,
            importance: 'major',
            fixture: { isDerby: true, competitionName: 'Championnat' }
          }]
        }
      }
    });
  });

  expect(scene).toBeTruthy();
  expect(scene.type).toBe('match.end');
  expect(scene.importance).toBe('major');
  expect(scene.facts.score).toBe('2-1');
  expect(scene.beats.length).toBeGreaterThanOrEqual(3);
  expect(scene.beats.some(beat => beat.kind === 'result')).toBe(true);
  expect(scene.beats.some(beat => beat.kind === 'player')).toBe(true);
});

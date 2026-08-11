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
  expect(scene.matches).toHaveLength(1);
  expect(scene.matches[0].isImpactMatch).toBe(true);
  expect(scene.beats.length).toBeGreaterThanOrEqual(3);
  expect(scene.beats.some(beat => beat.kind === 'result')).toBe(true);
  expect(scene.beats.some(beat => beat.kind === 'player')).toBe(true);
});

test('le récap narratif distingue tous les matchs et le match où le joueur a eu le plus d’impact', async ({ page }) => {
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
          matchResults: [
            {
              matchIndex: 0,
              opponent: 'Club A',
              competitionName: 'Championnat',
              result: 'win',
              teamGoals: 1,
              opponentGoals: 0,
              rating: 6.4,
              goals: 0,
              assists: 0,
              interactive: false,
              importance: 'normal'
            },
            {
              matchIndex: 1,
              opponent: 'Club B',
              competitionName: 'Coupe',
              result: 'win',
              teamGoals: 3,
              opponentGoals: 1,
              rating: 8.7,
              goals: 2,
              assists: 1,
              interactive: true,
              importance: 'important'
            },
            {
              matchIndex: 2,
              opponent: 'Club C',
              competitionName: 'Championnat',
              result: 'loss',
              teamGoals: 0,
              opponentGoals: 2,
              rating: 5.2,
              goals: 0,
              assists: 0,
              interactive: false,
              importance: 'normal'
            }
          ]
        }
      }
    });
  });

  expect(scene.facts.matchCount).toBe(3);
  expect(scene.matches).toHaveLength(3);
  expect(scene.impactMatchIndex).toBe(1);
  expect(scene.matches.filter(match => match.isImpactMatch)).toHaveLength(1);
  expect(scene.matches.find(match => match.matchIndex === 1)?.impactLevel).toBe('decisive');
  expect(scene.matches.find(match => match.matchIndex === 2)?.impactLevel).toBe('difficult');
  expect(scene.beats.some(beat => beat.kind === 'block-overview')).toBe(true);
});

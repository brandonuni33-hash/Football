import { test, expect } from '@playwright/test';

test('la narration distingue doublé triplé quadruplé et scores supérieurs', async ({ page }) => {
  await page.goto('/index.html');

  const texts = await page.evaluate(async () => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    const engine = new NarrativeEngine();
    const describe = goals => engine.composeMatchEnd({
      state: { player: { firstname: 'Alex' }, career: { seasonHistory: [] }, careerMemory: [] },
      report: { summary: { matchResults: [{
        matchIndex: 0,
        opponent: 'Club Test',
        competitionName: 'Championnat',
        result: 'win',
        teamGoals: goals,
        opponentGoals: 0,
        rating: 9,
        goals,
        assists: 0,
        playerPlayed: true,
        started: true
      }] } }
    }).beats.find(beat => beat.kind === 'player')?.text;

    return Object.fromEntries([2, 3, 4, 5, 6, 7].map(goals => [goals, describe(goals)]));
  });

  expect(texts['2']).toContain('doublé');
  expect(texts['3']).toContain('triplé');
  expect(texts['4']).toContain('quadruplé');
  expect(texts['5']).toContain('quintuplé');
  expect(texts['6']).toContain('sextuplé');
  expect(texts['7']).toContain('7 buts');
  expect(texts['7']).not.toContain('sextuplé');
  expect(texts['3']).not.toContain('doublé');
  expect(texts['4']).not.toContain('doublé');
});

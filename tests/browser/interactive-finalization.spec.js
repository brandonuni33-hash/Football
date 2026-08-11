import { test, expect } from '@playwright/test';

test('un match interactif ne déduit morale et fitness qu’une seule fois', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const [{ commitInteractiveResult }, { finalizeInteractiveBlock }] = await Promise.all([
      import('/domain/match/interactiveMatchController.js'),
      import('/domain/gameplay/interactiveBlockFinalizer.js')
    ]);
    const state = {
      player: {
        age: 20,
        overall: 60,
        potential: 75,
        morale: 80,
        fitness: 90,
        stats: {},
        attributes: {},
        hidden: {},
        temporaryEffects: []
      },
      career: { balance: 0 },
      calendar: {},
      cups: {}
    };
    const match = {
      rating: 8,
      minutesPlayed: 90,
      goals: 0,
      assists: 0,
      tackles: 0,
      yellowCards: 0,
      successfulPasses: 0
    };

    commitInteractiveResult(state, match);
    const afterMatch = { morale: state.player.morale, fitness: state.player.fitness };
    finalizeInteractiveBlock(state, [match], 'TECHNIQUE');

    return {
      afterMatch,
      afterBlock: { morale: state.player.morale, fitness: state.player.fitness }
    };
  });

  expect(result.afterMatch).toEqual({ morale: 82, fitness: 87 });
  expect(result.afterBlock.morale).toBe(82);
  expect(result.afterBlock.fitness).toBe(84);
});

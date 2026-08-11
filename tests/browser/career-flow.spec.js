import { test, expect } from '@playwright/test';

const CURRENT_YEAR = 2026;

async function boot(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI));
}

async function createDeterministicCareer(page) {
  return page.evaluate(({ year }) => {
    const gateway = window.game.gameUI;
    const state = gateway.startCareer({
      firstname: 'CI',
      lastname: 'Tester',
      country: 'France',
      position: 'BU',
      origin: 'CENTRE_FORMATION',
      youthClub: { name: 'Test Academy', country: 'France', tier: 1 }
    });

    if (!state?.player) throw new Error('La création de carrière n’a pas produit de joueur.');

    state.player.age = 18;
    state.player.club = 'Test FC';
    state.player.clubCountry = 'France';
    state.player.clubLevel = 1;
    state.calendar.currentMonth = 8;
    state.calendar.currentSeasonYear = year;
    state.calendar.seasonMatchCursor = 0;

    const fixture = {
      id: 'ci-final-001',
      month: 8,
      type: 'league',
      competitionId: 'CI_LEAGUE',
      competitionType: 'league',
      competitionName: 'Championnat CI',
      phase: 'final',
      round: 'Finale',
      opponent: 'Rival CI',
      opponentStrength: 58,
      home: true,
      isDerby: true
    };

    const emptyMonth = month => ({
      month,
      label: `Mois ${month}`,
      period: 'Test CI',
      phase: 'season',
      matches: []
    });
    const byMonth = {};
    for (let month = 1; month <= 12; month += 1) byMonth[month] = emptyMonth(month);
    byMonth[8].matches = [fixture];

    state.calendar.seasonSchedule = {
      version: 4,
      seasonYear: year,
      seasonLabel: `${year}-${year + 1}`,
      generatedForAge: 18,
      category: 'Senior',
      seed: 1,
      matches: [fixture],
      byMonth,
      totals: { allMatches: 1, leagueMatches: 1, cupMatches: 0, europeanMatches: 0 }
    };
    state.cups = {};
    state.europeanTournament = null;
    delete state.matchInteractionPlan;
    delete state.activeMatchSession;
    delete state.interactiveBlockResults;

    window.game.gameSystems.blockSystem.stateManager.save(state);
    return { playerId: state.player.id, month: state.calendar.currentMonth };
  }, { year: CURRENT_YEAR });
}

test('parcours carrière complet : création → match → narration → conséquence → sauvegarde/rechargement', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await boot(page);
  const created = await createDeterministicCareer(page);
  expect(created.playerId).toBeTruthy();
  expect(created.month).toBe(8);

  const flow = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const registry = window.game.gameSystems;

    const interactionPlan = gateway.getMatchInteractionPlan();
    const playable = interactionPlan.entries.filter(entry => entry.playable);
    if (playable.length !== 1) {
      throw new Error(`Le scénario CI attend exactement 1 match jouable, reçu: ${playable.length}`);
    }

    let result = gateway.playNextBlock();
    let decisions = 0;
    while (result?.interactive) {
      decisions += 1;
      if (decisions > 8) throw new Error('Boucle de match interactif anormalement longue.');
      result = gateway.playNextBlock(0);
    }

    if (!result?.report) throw new Error('Le bloc ne retourne pas de rapport final.');
    if (!result?.narrativeScene) throw new Error('La fin de match ne retourne pas de scène narrative.');

    const consequence = registry.consequenceSystem.applyToState(
      gateway.state,
      {
        id: 'ci-choice-consequence',
        text: 'Assumer publiquement sa responsabilité',
        consequences: { permanent: { reputation: 2 } }
      },
      { source: 'CI' }
    );

    registry.blockSystem.stateManager.save(gateway.state);

    return {
      decisions,
      matchCount: result.report.summary?.matchResults?.length || 0,
      narrativeType: result.narrativeScene.type,
      narrativeBeats: result.narrativeScene.beats?.length || 0,
      narrativeScore: result.narrativeScene.facts?.score || null,
      memoryRecorded: Boolean(consequence?.memory?.recorded),
      memoryCount: gateway.state.careerMemory?.length || 0,
      savedPlayerId: gateway.state.player.id
    };
  });

  expect(flow.decisions).toBeGreaterThan(0);
  expect(flow.matchCount).toBeGreaterThanOrEqual(1);
  expect(flow.narrativeType).toBe('match.end');
  expect(flow.narrativeBeats).toBeGreaterThanOrEqual(3);
  expect(flow.narrativeScore).toMatch(/^\d+-\d+$/);
  expect(flow.memoryRecorded).toBe(true);
  expect(flow.memoryCount).toBeGreaterThan(0);

  await page.reload();
  await page.waitForFunction(() => Boolean(window.game));

  const restored = await page.evaluate(() => ({
    playerId: window.game.state?.player?.id || null,
    playerName: window.game.state?.player?.firstname || window.game.state?.player?.firstName || null,
    memoryCount: window.game.state?.careerMemory?.length || 0,
    hasConsequenceMemory: Boolean(window.game.state?.careerMemory?.some(item => item.choiceId === 'ci-choice-consequence'))
  }));

  expect(restored.playerId).toBe(flow.savedPlayerId);
  expect(restored.playerName).toBe('CI');
  expect(restored.memoryCount).toBeGreaterThan(0);
  expect(restored.hasConsequenceMemory).toBe(true);
  expect(pageErrors).toEqual([]);
});

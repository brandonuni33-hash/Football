import { test, expect } from '@playwright/test';

const CURRENT_YEAR = 2026;

async function boot(page) {
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.game?.gameUI));
}

async function createDeterministicCareer(page, { fixtures = null, age = 18 } = {}) {
  return page.evaluate(({ year, requestedFixtures, playerAge }) => {
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

    state.player.age = playerAge;
    state.player.club = 'Test FC';
    state.player.clubCountry = 'France';
    state.player.clubLevel = 1;
    state.calendar.currentMonth = 8;
    state.calendar.currentSeasonYear = year;
    state.calendar.seasonMatchCursor = 0;

    const defaultFixture = {
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
    const matchFixtures = Array.isArray(requestedFixtures) && requestedFixtures.length
      ? requestedFixtures
      : [defaultFixture];

    const emptyMonth = month => ({
      month,
      label: `Mois ${month}`,
      period: 'Test CI',
      phase: 'season',
      matches: []
    });
    const byMonth = {};
    for (let month = 1; month <= 12; month += 1) byMonth[month] = emptyMonth(month);
    byMonth[8].matches = matchFixtures;

    state.calendar.seasonSchedule = {
      version: 4,
      seasonYear: year,
      seasonLabel: `${year}-${year + 1}`,
      generatedForAge: playerAge,
      category: playerAge < 18 ? 'U17/U19' : 'Senior',
      seed: 1,
      matches: matchFixtures,
      byMonth,
      totals: { allMatches: matchFixtures.length, leagueMatches: matchFixtures.length, cupMatches: 0, europeanMatches: 0 }
    };
    state.cups = {};
    state.europeanTournament = null;
    delete state.matchInteractionPlan;
    delete state.activeMatchSession;
    delete state.interactiveBlockResults;

    window.game.gameSystems.blockSystem.stateManager.save(state);
    return {
      playerId: state.player.id,
      month: state.calendar.currentMonth,
      matchesPlayed: Number(state.player.stats?.matchesPlayed || 0)
    };
  }, { year: CURRENT_YEAR, requestedFixtures: fixtures, playerAge: age });
}

async function forceInteractionPlan(page, playableIndexes) {
  return page.evaluate(({ year, indexes }) => {
    const gateway = window.game.gameUI;
    const state = gateway.state;
    const matches = gateway.getScheduledMatches();
    const selected = new Set(indexes);
    state.matchInteractionPlan = {
      key: `${year}:8:${matches.length}`,
      budget: selected.size,
      playableCount: selected.size,
      entries: matches.map((match, matchIndex) => ({
        matchIndex,
        playable: selected.has(matchIndex),
        importance: {
          score: Number(match.importanceScore || (selected.has(matchIndex) ? 80 : 10)),
          level: selected.has(matchIndex) ? 'exceptional' : 'low',
          reasons: selected.has(matchIndex) ? ['ci_force'] : []
        }
      }))
    };
    return gateway.getMatchInteractionPlan();
  }, { year: CURRENT_YEAR, indexes: playableIndexes });
}

async function finishInteractiveFlow(page) {
  return page.evaluate(() => {
    const gateway = window.game.gameUI;
    let result = gateway.playNextBlock();
    let decisions = 0;
    while (result?.interactive) {
      decisions += 1;
      if (decisions > 10) throw new Error('Boucle de match interactif anormalement longue.');
      result = gateway.playNextBlock(0);
    }
    return { decisions, result };
  });
}

test('parcours carrière complet : création → match → narration → conséquence → sauvegarde/rechargement', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await boot(page);
  const created = await createDeterministicCareer(page);
  expect(created.playerId).toBeTruthy();
  expect(created.month).toBe(8);

  const forcedPlan = await forceInteractionPlan(page, [0]);
  expect(forcedPlan.entries.filter(entry => entry.playable)).toHaveLength(1);

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

test('bloc 100 % simulé : tous les matchs sont joués sans session interactive et finalisés une seule fois', async ({ page }) => {
  await boot(page);
  const fixtures = [
    { id: 'ci-sim-1', month: 8, type: 'league', competitionId: 'CI_LEAGUE', competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club A', opponentStrength: 52, home: true },
    { id: 'ci-sim-2', month: 8, type: 'league', competitionId: 'CI_LEAGUE', competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club B', opponentStrength: 55, home: false }
  ];
  const created = await createDeterministicCareer(page, { fixtures });
  const plan = await forceInteractionPlan(page, []);
  expect(plan.playableCount).toBe(0);

  const result = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const before = Number(gateway.state.player.stats?.matchesPlayed || 0);
    const block = gateway.playNextBlock();
    const rows = block?.report?.summary?.matchResults || [];
    return {
      before,
      after: Number(gateway.state.player.stats?.matchesPlayed || 0),
      interactiveSession: Boolean(gateway.state.activeMatchSession),
      interactiveRows: rows.filter(row => row.interactive).length,
      simulatedRows: rows.filter(row => row.interactive === false).length,
      matchCount: rows.length,
      narrativeType: block?.narrativeScene?.type || null,
      monthAfter: gateway.state.calendar?.currentMonth
    };
  });

  expect(result.interactiveSession).toBe(false);
  expect(result.interactiveRows).toBe(0);
  expect(result.simulatedRows).toBe(2);
  expect(result.matchCount).toBe(2);
  expect(result.after - result.before).toBe(2);
  expect(result.narrativeType).toBe('match.end');
  expect(result.monthAfter).not.toBe(8);
  expect(result.before).toBe(created.matchesPlayed);
});

test('bloc mixte : un match interactif et un match simulé sont fusionnés dans le même rapport', async ({ page }) => {
  await boot(page);
  const fixtures = [
    { id: 'ci-mixed-1', month: 8, type: 'league', competitionId: 'CI_LEAGUE', competitionType: 'league', competitionName: 'Championnat CI', phase: 'final', round: 'Finale', opponent: 'Rival CI', opponentStrength: 60, home: true, isDerby: true },
    { id: 'ci-mixed-2', month: 8, type: 'league', competitionId: 'CI_LEAGUE', competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club Simulation', opponentStrength: 54, home: false }
  ];
  const created = await createDeterministicCareer(page, { fixtures });
  const plan = await forceInteractionPlan(page, [0]);
  expect(plan.entries.filter(entry => entry.playable)).toHaveLength(1);

  const flow = await finishInteractiveFlow(page);
  expect(flow.decisions).toBeGreaterThan(0);

  const rows = flow.result?.report?.summary?.matchResults || [];
  expect(rows).toHaveLength(2);
  expect(rows.filter(row => row.interactive)).toHaveLength(1);
  expect(rows.filter(row => row.interactive === false)).toHaveLength(1);
  expect(rows.map(row => row.matchIndex)).toEqual([0, 1]);
  expect(flow.result?.narrativeScene?.type).toBe('match.end');

  const stateAfter = await page.evaluate(() => ({
    matchesPlayed: Number(window.game.gameUI.state.player.stats?.matchesPlayed || 0),
    month: window.game.gameUI.state.calendar?.currentMonth,
    hasInteractiveBuffer: Array.isArray(window.game.gameUI.state.interactiveBlockResults),
    hasActiveSession: Boolean(window.game.gameUI.state.activeMatchSession)
  }));
  expect(stateAfter.matchesPlayed - created.matchesPlayed).toBe(2);
  expect(stateAfter.month).not.toBe(8);
  expect(stateAfter.hasInteractiveBuffer).toBe(false);
  expect(stateAfter.hasActiveSession).toBe(false);
});

test('ancienne sauvegarde : StateManager migre les attributs, notifications et mémoires vers le schéma actuel', async ({ page }) => {
  await boot(page);

  const migrated = await page.evaluate(async () => {
    const { StateManager, SCHEMA_VERSION } = await import('/state/stateManager.js');
    const legacy = {
      schemaVersion: 3,
      player: {
        id: 'legacy-ci-player',
        firstname: 'Legacy',
        lastname: 'Tester',
        age: 17,
        position: 'BU',
        attributes: { vitesse: 61, tir: 64, passe: 58, dribble: 63, defense: 31, physique: 56, mental: 59 },
        stats: {},
        progression: { obsolete: true },
        attributesV2: { obsolete: true }
      },
      notifications: [
        { id: 'legacy-signal-1', title: 'Ancien signal', read: false },
        { id: 'legacy-signal-2', title: 'Signal lu', read: true }
      ],
      careerMemory: [{ id: 'legacy-memory-1', title: 'Premier souvenir' }],
      calendar: { currentMonth: 8, currentSeasonYear: 2025 }
    };

    localStorage.setItem(StateManager.STORAGE_KEY, JSON.stringify(legacy));
    const state = StateManager.load();
    return {
      schemaVersion: state?.schemaVersion,
      expectedVersion: SCHEMA_VERSION,
      playerId: state?.player?.id,
      age: state?.player?.age,
      acceleration: state?.player?.attributes?.acceleration,
      endurance: state?.player?.attributes?.endurance,
      puissance: state?.player?.attributes?.puissance,
      mentalIsObject: Boolean(state?.player?.mental && typeof state.player.mental === 'object'),
      hasProgression: Object.prototype.hasOwnProperty.call(state?.player || {}, 'progression'),
      hasAttributesV2: Object.prototype.hasOwnProperty.call(state?.player || {}, 'attributesV2'),
      temporaryEffectsIsArray: Array.isArray(state?.player?.temporaryEffects),
      notificationsIsObject: Boolean(state?.notifications && !Array.isArray(state.notifications)),
      signalCount: state?.notifications?.signals?.length || 0,
      unreadCount: state?.notifications?.unreadCount,
      memoryCount: state?.careerMemory?.length || 0,
      relationshipMemoryIsArray: Array.isArray(state?.relationshipMemory),
      narrativeVersion: state?.narrativeState?.version,
      narrativeProcessedFactsIsArray: Array.isArray(state?.narrativeState?.processedFactIds),
      notificationThreadsSeparate: state?.narrativeState?.storyThreads !== state?.notifications?.threads
    };
  });

  expect(migrated.schemaVersion).toBe(migrated.expectedVersion);
  expect(migrated.playerId).toBe('legacy-ci-player');
  expect(migrated.age).toBe(17);
  expect(migrated.acceleration).toBeGreaterThan(0);
  expect(migrated.endurance).toBeGreaterThan(0);
  expect(migrated.puissance).toBe(56);
  expect(migrated.mentalIsObject).toBe(true);
  expect(migrated.hasProgression).toBe(false);
  expect(migrated.hasAttributesV2).toBe(false);
  expect(migrated.temporaryEffectsIsArray).toBe(true);
  expect(migrated.notificationsIsObject).toBe(true);
  expect(migrated.signalCount).toBe(2);
  expect(migrated.unreadCount).toBe(1);
  expect(migrated.memoryCount).toBe(1);
  expect(migrated.relationshipMemoryIsArray).toBe(true);
  expect(migrated.narrativeVersion).toBe(1);
  expect(migrated.narrativeProcessedFactsIsArray).toBe(true);
  expect(migrated.notificationThreadsSeparate).toBe(true);
});

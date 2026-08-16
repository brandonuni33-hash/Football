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
      version: 5,
      seasonYear: year,
      seasonLabel: `${year}-${year + 1}`,
      generatedForAge: playerAge,
      category: playerAge < 18 ? 'U17/U19' : 'Senior',
      seed: 1,
      matches: matchFixtures,
      byMonth,
      totals: {
        allMatches: matchFixtures.length,
        leagueMatches: matchFixtures.length,
        cupMatches: 0,
        europeanMatches: 0
      }
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

test('parcours carrière complet : création → match simulé → narration → conséquence → sauvegarde/rechargement', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await boot(page);
  const created = await createDeterministicCareer(page);
  expect(created.playerId).toBeTruthy();
  expect(created.month).toBe(8);

  const result = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const block = gateway.playNextBlock();
    return {
      block,
      hasActiveSession: Boolean(gateway.state.activeMatchSession),
      hasInteractiveBuffer: Array.isArray(gateway.state.interactiveBlockResults)
    };
  });

  expect(result.block?.interactive).not.toBe(true);
  expect(result.hasActiveSession).toBe(false);
  expect(result.hasInteractiveBuffer).toBe(false);
  expect(result.block?.report).toBeTruthy();
  expect(result.block?.narrativeScene).toBeTruthy();
  expect(result.block.report.summary?.matchResults?.length || 0).toBeGreaterThanOrEqual(1);
  expect(result.block.report.summary?.matchResults?.every(row => row.interactive === false)).toBe(true);
  expect(result.block.narrativeScene.type).toBe('match.end');
  expect(result.block.narrativeScene.beats?.length || 0).toBeGreaterThanOrEqual(3);
  expect(result.block.narrativeScene.facts?.score || null).toMatch(/^\d+-\d+$/);

  const consequence = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const registry = window.game.gameSystems;
    const applied = registry.consequenceSystem.applyToState(
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
      memoryRecorded: Boolean(applied?.memory?.recorded),
      memoryCount: gateway.state.careerMemory?.length || 0,
      savedPlayerId: gateway.state.player.id
    };
  });

  expect(consequence.memoryRecorded).toBe(true);
  expect(consequence.memoryCount).toBeGreaterThan(0);

  await page.reload();
  await page.waitForFunction(() => Boolean(window.game));

  const restored = await page.evaluate(() => ({
    playerId: window.game.state?.player?.id || null,
    playerName: window.game.state?.player?.firstname || window.game.state?.player?.firstName || null,
    memoryCount: window.game.state?.careerMemory?.length || 0,
    hasConsequenceMemory: Boolean(
      window.game.state?.careerMemory?.some(item => item.choiceId === 'ci-choice-consequence')
    )
  }));

  expect(restored.playerId).toBe(consequence.savedPlayerId);
  expect(restored.playerName).toBe('CI');
  expect(restored.memoryCount).toBeGreaterThan(0);
  expect(restored.hasConsequenceMemory).toBe(true);
  expect(pageErrors).toEqual([]);
});

test('bloc 100 % simulé : tous les matchs sont joués sans session interactive et finalisés une seule fois', async ({ page }) => {
  await boot(page);
  const fixtures = [
    {
      id: 'ci-sim-1', month: 8, type: 'league', competitionId: 'CI_LEAGUE',
      competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club A',
      opponentStrength: 52, home: true
    },
    {
      id: 'ci-sim-2', month: 8, type: 'league', competitionId: 'CI_LEAGUE',
      competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club B',
      opponentStrength: 55, home: false
    }
  ];
  const created = await createDeterministicCareer(page, { fixtures });

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

test('un ancien plan interactif ne peut pas réactiver le gameplay contrôlable', async ({ page }) => {
  await boot(page);
  const fixtures = [
    {
      id: 'ci-legacy-playable-1', month: 8, type: 'league', competitionId: 'CI_LEAGUE',
      competitionType: 'league', competitionName: 'Championnat CI', phase: 'final', round: 'Finale',
      opponent: 'Rival CI', opponentStrength: 60, home: true, isDerby: true
    },
    {
      id: 'ci-legacy-playable-2', month: 8, type: 'league', competitionId: 'CI_LEAGUE',
      competitionType: 'league', competitionName: 'Championnat CI', opponent: 'Club Simulation',
      opponentStrength: 54, home: false
    }
  ];
  const created = await createDeterministicCareer(page, { fixtures });
  const legacyPlan = await forceInteractionPlan(page, [0]);
  expect(legacyPlan.entries.filter(entry => entry.playable)).toHaveLength(1);

  const flow = await page.evaluate(() => {
    const gateway = window.game.gameUI;
    const result = gateway.playNextBlock();
    const rows = result?.report?.summary?.matchResults || [];
    return {
      interactive: result?.interactive === true,
      rows,
      narrativeType: result?.narrativeScene?.type || null,
      matchesPlayed: Number(gateway.state.player.stats?.matchesPlayed || 0),
      month: gateway.state.calendar?.currentMonth,
      hasInteractiveBuffer: Array.isArray(gateway.state.interactiveBlockResults),
      hasActiveSession: Boolean(gateway.state.activeMatchSession)
    };
  });

  expect(flow.interactive).toBe(false);
  expect(flow.rows).toHaveLength(2);
  expect(flow.rows.filter(row => row.interactive)).toHaveLength(0);
  expect(flow.rows.filter(row => row.interactive === false)).toHaveLength(2);
  expect(flow.rows.map(row => row.matchIndex)).toEqual([0, 1]);
  expect(flow.narrativeType).toBe('match.end');
  expect(flow.matchesPlayed - created.matchesPlayed).toBe(2);
  expect(flow.month).not.toBe(8);
  expect(flow.hasInteractiveBuffer).toBe(false);
  expect(flow.hasActiveSession).toBe(false);
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
      narrativeJournalIsArray: Array.isArray(state?.narrativeState?.journalEntries),
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
  expect(migrated.narrativeVersion).toBe(2);
  expect(migrated.narrativeProcessedFactsIsArray).toBe(true);
  expect(migrated.narrativeJournalIsArray).toBe(true);
  expect(migrated.notificationThreadsSeparate).toBe(true);
});

import { test, expect } from '@playwright/test';

const matchReport = (overrides = {}) => ({
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
      playerPlayed: true,
      started: true,
      fixture: { id: 'foundation-match-1', isDerby: true },
      ...overrides
    }]
  }
});

const narrativeState = () => ({
  player: { id: 'foundation-player', firstname: 'Alex', stats: { matchesPlayed: 1 } },
  calendar: { currentSeasonYear: 2026, currentMonth: 8 },
  career: { seasonHistory: [] },
  careerMemory: [],
  notifications: { signals: [], threads: [{ id: 'notification-thread' }], unreadCount: 0 }
});

test('les faits narratifs sont déterministes, normalisés et immuables', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async () => {
    const { default: NarrativeFactNormalizer } = await import('/domain/narrative/narrativeFactNormalizer.js');
    const normalizer = new NarrativeFactNormalizer();
    const raw = {
      type: 'match.completed', source: 'match', occurredAt: 'season:2026:month:8:match:0',
      subjectId: 'p1', actorIds: ['club-b', 'p1', 'p1'], metrics: { goals: 2 },
      outcome: { result: 'win' }, certainty: 'confirmed', visibility: 'public',
      tags: ['cup', 'cup'], dedupeKey: 'match|p1|fixture-1', payload: { opponent: 'Rival FC' }
    };
    const first = normalizer.normalize(raw);
    const second = normalizer.normalize({ ...raw, metrics: { goals: 2 } });
    return {
      sameId: first.id === second.id,
      frozen: Object.isFrozen(first) && Object.isFrozen(first.metrics) && Object.isFrozen(first.payload),
      actorIds: first.actorIds,
      tags: first.tags,
      goals: first.metrics.goals
    };
  });

  expect(result.sameId).toBe(true);
  expect(result.frozen).toBe(true);
  expect(result.actorIds).toEqual(['club-b', 'p1']);
  expect(result.tags).toEqual(['cup']);
  expect(result.goals).toBe(2);
});

test('le moteur produit au plus une scène et persiste uniquement son état narratif', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    const engine = new NarrativeEngine();
    const notificationsBefore = JSON.stringify(state.notifications);
    const memoryBefore = JSON.stringify(state.careerMemory);
    const output = engine.processMatchEnd({ state, report });
    return {
      generated: output.diagnostics.generatedSceneCount,
      primaryType: output.primaryScene?.type,
      passiveCount: output.passiveBeats.length,
      processedCount: state.narrativeState?.processedFactIds?.length,
      threadIds: Object.keys(state.narrativeState?.storyThreads || {}),
      notificationsUntouched: JSON.stringify(state.notifications) === notificationsBefore,
      memoryUntouched: JSON.stringify(state.careerMemory) === memoryBefore,
      notificationThreadStillPresent: state.notifications.threads[0]?.id
    };
  }, { report: matchReport(), state: narrativeState() });

  expect(result.generated).toBe(1);
  expect(result.primaryType).toBe('match.end');
  expect(result.passiveCount).toBe(0);
  expect(result.processedCount).toBe(1);
  expect(result.threadIds).toContain('player-form');
  expect(result.notificationsUntouched).toBe(true);
  expect(result.memoryUntouched).toBe(true);
  expect(result.notificationThreadStillPresent).toBe('notification-thread');
});

test('un même fait ne peut pas produire deux scènes ni deux transitions', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    const engine = new NarrativeEngine();
    const first = engine.processMatchEnd({ state, report });
    const momentum = state.narrativeState.storyThreads['player-form'].momentum;
    const second = engine.processMatchEnd({ state, report });
    return {
      firstScene: Boolean(first.primaryScene),
      secondScene: Boolean(second.primaryScene),
      duplicates: second.diagnostics.duplicateFactIds.length,
      processedCount: state.narrativeState.processedFactIds.length,
      sceneCount: state.narrativeState.pacing.sceneCount,
      momentum,
      momentumAfterReplay: state.narrativeState.storyThreads['player-form'].momentum
    };
  }, { report: matchReport(), state: narrativeState() });

  expect(result.firstScene).toBe(true);
  expect(result.secondScene).toBe(false);
  expect(result.duplicates).toBe(1);
  expect(result.processedCount).toBe(1);
  expect(result.sceneCount).toBe(1);
  expect(result.momentumAfterReplay).toBe(result.momentum);
});

test('la continuité rejette un récit où les contributions dépassent le score de l équipe', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    const output = new NarrativeEngine().processMatchEnd({ state, report });
    return {
      hasScene: Boolean(output.primaryScene),
      rejected: output.diagnostics.rejectedFacts,
      hasNarrativeState: Boolean(state.narrativeState)
    };
  }, {
    report: matchReport({ teamGoals: 1, opponentGoals: 0, goals: 1, assists: 1 }),
    state: narrativeState()
  });

  expect(result.hasScene).toBe(false);
  expect(result.rejected).toHaveLength(1);
  expect(result.rejected[0].reasons).toContain('player-contributions-exceed-team-score');
  expect(result.hasNarrativeState).toBe(false);
});

test('un callback narratif conserve la preuve du souvenir réellement lu sans forcer un beat jeunesse', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const { default: NarrativeEngine } = await import('/domain/narrative/narrativeEngine.js');
    state.careerMemory.push({ id: 'memory-rival', title: 'Premier duel face à Rival FC', age: 16 });
    const output = new NarrativeEngine().processMatchEnd({ state, report });
    return {
      outputMemoryId: output.callbackCommands[0]?.memoryId,
      storedMemoryId: state.narrativeState.callbacks[0]?.memoryId,
      careerMemoryCount: state.careerMemory.length
    };
  }, { report: matchReport(), state: narrativeState() });

  expect(result.outputMemoryId).toBe('memory-rival');
  expect(result.storedMemoryId).toBe('memory-rival');
  expect(result.careerMemoryCount).toBe(1);
});

test('le presenter applicatif expose le récit sans logique DOM', async ({ page }) => {
  await page.goto('/index.html');
  const result = await page.evaluate(async ({ report, state }) => {
    const [{ default: NarrativeEngine }, { default: NarrativeOrchestrator }] = await Promise.all([
      import('/domain/narrative/narrativeEngine.js'),
      import('/application/narrativeOrchestrator.js')
    ]);
    const presented = new NarrativeOrchestrator({ engine: new NarrativeEngine() }).processMatchEnd({ state, report });
    return {
      frozen: Object.isFrozen(presented),
      type: presented.primaryScene?.type,
      diagnostics: presented.diagnostics?.generatedSceneCount,
      hasDomainCommands: Object.prototype.hasOwnProperty.call(presented, 'threadTransitions')
    };
  }, { report: matchReport(), state: narrativeState() });

  expect(result.frozen).toBe(true);
  expect(result.type).toBe('match.end');
  expect(result.diagnostics).toBe(1);
  expect(result.hasDomainCommands).toBe(false);
});

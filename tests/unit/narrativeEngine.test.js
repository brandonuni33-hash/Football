import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeEngine from '../../domain/narrative/narrativeEngine.js';
import NarrativeFactNormalizer from '../../domain/narrative/narrativeFactNormalizer.js';
import { SCHEMA_VERSION, StateManager } from '../../state/stateManager.js';
import { createBaseState } from '../../state/stateFactory.js';

const report = (overrides = {}) => ({ summary: { matchResults: [{
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
    fixture: { id: 'unit-match-1', isDerby: true },
    ...overrides
}] } });

const state = () => ({
    player: { id: 'unit-player', firstname: 'Alex', stats: { matchesPlayed: 1 } },
    calendar: { currentSeasonYear: 2026, currentMonth: 8 },
    career: { seasonHistory: [] },
    careerMemory: [],
    notifications: { signals: [], threads: [{ id: 'notification-thread' }], unreadCount: 0 }
});

test('NarrativeFactNormalizer crée un contrat stable et immuable', () => {
    const normalizer = new NarrativeFactNormalizer();
    const raw = {
        type: 'match.completed', source: 'match', occurredAt: 'block-1', subjectId: 'p1',
        actorIds: ['p1', 'club-a', 'p1'], metrics: { goals: 2 }, outcome: { result: 'win' },
        certainty: 'confirmed', visibility: 'public', tags: ['cup', 'cup'],
        dedupeKey: 'match|p1|1', payload: { opponent: 'Rival FC' }
    };
    const first = normalizer.normalize(raw), second = normalizer.normalize({ ...raw });
    assert.equal(first.id, second.id);
    assert.ok(Object.isFrozen(first));
    assert.ok(Object.isFrozen(first.metrics));
    assert.deepEqual(first.actorIds, ['club-a', 'p1']);
    assert.deepEqual(first.tags, ['cup']);
});

test('le pipeline produit une scène unique et un fil narratif séparé', () => {
    const current = state();
    const notificationsBefore = structuredClone(current.notifications);
    const output = new NarrativeEngine().processMatchEnd({ state: current, report: report() });
    assert.equal(output.diagnostics.generatedSceneCount, 1);
    assert.equal(output.primaryScene.type, 'match.end');
    assert.equal(current.narrativeState.processedFactIds.length, 1);
    assert.equal(current.narrativeState.storyThreads['player-form'].phase, 'rising');
    assert.deepEqual(current.notifications, notificationsBefore);
});

test('le reducer rend le traitement idempotent', () => {
    const current = state(), engine = new NarrativeEngine(), currentReport = report();
    const first = engine.processMatchEnd({ state: current, report: currentReport });
    const firstMomentum = current.narrativeState.storyThreads['player-form'].momentum;
    const second = engine.processMatchEnd({ state: current, report: currentReport });
    assert.ok(first.primaryScene);
    assert.equal(second.primaryScene, null);
    assert.equal(second.diagnostics.duplicateFactIds.length, 1);
    assert.equal(current.narrativeState.pacing.sceneCount, 1);
    assert.equal(current.narrativeState.storyThreads['player-form'].momentum, firstMomentum);
});

test('la continuité refuse une contribution impossible', () => {
    const current = state();
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ teamGoals: 1, opponentGoals: 0, goals: 1, assists: 1 })
    });
    assert.equal(output.primaryScene, null);
    assert.deepEqual(output.diagnostics.rejectedFacts[0].reasons, ['player-contributions-exceed-team-score']);
    assert.equal(current.narrativeState, undefined);
});

test('un callback stocké référence une vraie mémoire de carrière', () => {
    const current = state();
    current.careerMemory.push({ id: 'memory-rival', title: 'Premier duel face à Rival FC', age: 16 });
    const output = new NarrativeEngine().processMatchEnd({ state: current, report: report() });
    assert.equal(output.callbackCommands[0].memoryId, 'memory-rival');
    assert.equal(current.narrativeState.callbacks[0].memoryId, 'memory-rival');
    assert.equal(current.careerMemory.length, 1);
});

test('le schéma 11 crée narrativeState sans réutiliser les notifications', () => {
    const empty = StateManager.createEmpty();
    const base = createBaseState();
    assert.equal(SCHEMA_VERSION, 11);
    assert.equal(empty.narrativeState.version, 1);
    assert.deepEqual(empty.narrativeState.processedFactIds, []);
    assert.equal(base.narrativeState.version, 1);
    assert.notEqual(empty.narrativeState.storyThreads, empty.notifications.threads);
});

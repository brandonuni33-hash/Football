import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeEngine from '../../domain/narrative/narrativeEngine.js';
import NarrativeFactNormalizer from '../../domain/narrative/narrativeFactNormalizer.js';
import { SCHEMA_VERSION, StateManager } from '../../state/stateManager.js';
import { createBaseState } from '../../state/stateFactory.js';
import NarrativeFactCollector from '../../domain/narrative/narrativeFactCollector.js';
import NarrativeOrchestrator from '../../application/narrativeOrchestrator.js';
import NarrativePresenter from '../../application/narrativePresenter.js';
import { BlockSystem } from '../../domain/gameplay/blockSystem.js';

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

test('le schéma courant crée narrativeState sans réutiliser les notifications', () => {
    const empty = StateManager.createEmpty();
    const base = createBaseState();
    assert.equal(SCHEMA_VERSION, 12);
    assert.equal(empty.narrativeState.version, 2);
    assert.deepEqual(empty.narrativeState.processedFactIds, []);
    assert.equal(base.narrativeState.version, 2);
    assert.deepEqual(base.narrativeState.journalEntries, []);
    assert.notEqual(empty.narrativeState.storyThreads, empty.notifications.threads);
});

test('les faits visibles du monde alimentent fils, observations et journal sans exposer le scouting', () => {
    const current = state();
    const resolved = {
        mediaCycle: { post: { id: 'post-1', source: 'Actu Foot', type: 'media', content: 'La performance fait parler.' } },
        coachEvent: { id: 'coach-talk', title: 'Le coach veut te voir', description: 'Un échange est prévu.' },
        transferCycle: {
            activity: [
                { type: 'scouting_started', clubId: 'hidden-club', observationId: 'obs-1', at: 1 },
                { type: 'interest_stage_changed', clubId: 'club-a', interestId: 'interest-a', from: 'serious', to: 'contact', at: 2 },
                { type: 'official_offer', clubId: 'club-a', interestId: 'interest-a', at: 3 }
            ],
            offer: { club: 'Club A', clubId: 'club-a', interestId: 'interest-a', message: 'Club A te veut.' }
        },
        transferOffer: { club: 'Club A', clubId: 'club-a', interestId: 'interest-a' },
        familyBirths: [{ child: { id: 'child-1', firstName: 'Lina', birthDate: '2026-08-01' } }]
    };
    const output = new NarrativeEngine().processBlock({ state: current, report: report(), resolved });
    assert.equal(output.primaryScene.type, 'match.end');
    assert.equal(output.passiveBeats.length, 3);
    assert.ok(output.journalEntries.some(entry => entry.category === 'family'));
    assert.ok(output.journalEntries.some(entry => entry.category === 'transfer'));
    assert.ok(!output.journalEntries.some(entry => entry.text.includes('hidden-club')));
    assert.equal(current.narrativeState.journalEntries.length, 5);
    assert.equal(current.narrativeState.storyThreads['transfer:interest-a'].phase, 'offer');
    assert.equal(current.narrativeState.storyThreads['family-legacy'].phase, 'new-generation');
});

test('le presenter ajoute au plus deux réactions du monde à la scène de match', () => {
    const current = state();
    const engine = new NarrativeEngine();
    const orchestrator = new NarrativeOrchestrator({ engine, presenter: new NarrativePresenter() });
    const presented = orchestrator.processBlock({
        state: current,
        report: report(),
        resolved: {
            event: { id: 'event-1', titre: 'Une invitation', description: 'Une décision arrive.', categorie: 'carriere' },
            coachEvent: { id: 'coach-1', title: 'Discussion', description: 'Le coach appelle.' },
            mediaCycle: { post: { id: 'post-1', source: 'Actu Foot', type: 'media', content: 'Le public réagit.' } }
        }
    });
    assert.equal(presented.primaryScene.type, 'match.end');
    assert.equal(presented.passiveBeats.length, 3);
    assert.equal(presented.primaryScene.beats.filter(beat => beat.kind === 'world-observation').length, 2);
});

test('un bloc sans match peut produire une scène du monde', () => {
    const current = state();
    const output = new NarrativeEngine().processBlock({
        state: current,
        report: { summary: { matchResults: [] } },
        resolved: { event: { id: 'event-1', titre: 'Un appel inattendu', description: 'Le téléphone sonne.', categorie: 'carriere' } }
    });
    assert.equal(output.primaryScene.type, 'world.update');
    assert.equal(output.primaryScene.beats.length, 1);
    assert.equal(current.narrativeState.journalEntries.length, 1);
});

test('BlockSystem attend tous les systèmes du monde avant de lancer la narration', () => {
    const order = [];
    const current = { player: { id: 'p1', age: 20, stats: {}, fitness: 90 }, calendar: { currentSeasonYear: 2026 } };
    const block = new BlockSystem({
        trainingManager: { applyTraining: () => null },
        matchBlockManager: { simulateBlock: () => ({ summary: { scheduledMatches: [], matchResults: [] } }) },
        worldSystem: { recordPlayerMatches: () => order.push('world') },
        socialSystem: { updateSocialCycle: () => order.push('social') },
        mediaSystem: { generatePostAfterBlock: () => (order.push('media'), { post: { id: 'p' }, dilemma: null }) },
        eventEngine: { checkAndTriggerEvent: () => (order.push('event'), null) },
        coachSystem: { checkCoachInteraction: () => (order.push('coach'), null) },
        careerSystem: {
            refreshStage: () => order.push('career'),
            detectRole: () => null,
            evaluatePositionChange: () => null
        },
        transferSystem: { progressMarket: () => (order.push('transfer'), { activity: [], activeInterests: [] }) },
        familyLifeSystem: { evaluateBirths: () => (order.push('family'), []) },
        consequenceSystem: { resolvePending: () => [] },
        narrativeEngine: {
            processBlock: () => {
                order.push('narrative');
                return { primaryScene: { type: 'world.update', beats: [{ text: 'fait' }] }, passiveBeats: [], journalEntries: [] };
            }
        },
        advanceCalendar: () => (order.push('calendar'), { advanced: true }),
        stateManager: { save: () => order.push('save') }
    });
    const result = block.execute(current);
    assert.deepEqual(order, ['world', 'social', 'media', 'event', 'coach', 'career', 'transfer', 'family', 'narrative', 'calendar', 'save']);
    assert.equal(result.narrativeScene.type, 'world.update');
});

test('le collecteur ne publie jamais les étapes de scouting cachées', () => {
    const facts = new NarrativeFactCollector().collectWorldFacts({
        state: state(),
        resolved: { transferCycle: { activity: [{ type: 'scouting_started', clubId: 'secret-club', observationId: 'obs' }] } }
    });
    assert.deepEqual(facts, []);
});

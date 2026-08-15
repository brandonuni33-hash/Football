import test from 'node:test';
import assert from 'node:assert/strict';
import {
    startInteractiveMatch,
    advanceInteractiveMatch,
    commitInteractiveResult
} from '../../domain/match/interactiveMatchRuntime.js';
import { deriveGoalSummary } from '../../domain/match/goalEventResolver.js';
import { UIGateway } from '../../application/uiGateway.js';

const stateFor = () => ({
    player: {
        id: 'player-1',
        firstname: 'Noa',
        lastname: 'Test',
        club: 'FC Test',
        position: 'BU',
        overall: 72,
        origin: 'STREET',
        mental: 72,
        morale: 70,
        fitness: 90,
        attributes: { controle: 84, dribble: 84, tir: 76, passe: 70 },
        stats: {},
        hidden: {},
        temporaryEffects: []
    },
    career: { balance: 0 },
    social: {},
    consequences: [],
    careerMemory: []
});

test('un but de l équipe devient une étape manuelle avant la reprise du match', () => {
    const oldRandom = Math.random;
    Math.random = () => 0;
    try {
        const state = stateFor();
        const session = startInteractiveMatch(state, {
            opponent: 'Rival FC',
            home: true,
            importance: 'normal',
            playerSelection: { started: true, minutes: 90 }
        }, 0);

        const presentations = [];
        let guard = 0;
        while (!session.finished && guard++ < 60) {
            const stepBefore = session.step;
            const result = advanceInteractiveMatch(
                state,
                session,
                stepBefore?.kind === 'decision' ? { choiceIndex: 0 } : {}
            );
            if (result.session?.step?.kind === 'goal') {
                presentations.push(result.session.step.goal);
                assert.equal(result.session.step.goal.matchId, session.id);
                assert.ok(result.session.step.goal.eventId);
            }
        }

        assert.ok(presentations.length > 0);
        assert.equal(session.finished, true);
        assert.ok(Array.isArray(session.result.goalEvents));
        assert.equal(presentations.length, session.result.goalEvents.length);
        assert.equal(new Set(presentations.map(goal => goal.eventId)).size, presentations.length);
        assert.equal(new Set(presentations.map(goal => goal.minute)).size, presentations.length);
        assert.deepEqual(presentations.map(goal => goal.eventId), session.result.goalEvents.map(goal => goal.id));
        assert.equal(session.result.goalEvents.length, session.result.teamGoals + session.result.opponentGoals);
        assert.equal(session.result.interactiveReport.matchId, session.id);
    } finally {
        Math.random = oldRandom;
    }
});

test('un résultat interactif ne peut créditer les statistiques qu une seule fois', () => {
    const oldRandom = Math.random;
    Math.random = () => 0.4;
    try {
        const state = stateFor();
        const session = startInteractiveMatch(state, { opponent:'Rival FC', home:true, importance:'normal', playerSelection:{started:true,minutes:90} }, 0);
        let guard = 0;
        while (!session.finished && guard++ < 80) advanceInteractiveMatch(state,session,session.step?.kind==='decision'?{choiceIndex:0}:{});
        const expected = deriveGoalSummary(session.result.goalEvents,{home:session.home,playerId:state.player.id});
        session.result.score={home:99,away:99};
        session.result.goals=99;
        session.result.assists=99;
        const committed = commitInteractiveResult(state,session.result);
        const once = { ...state.player.stats };
        const progressionOnce = JSON.parse(JSON.stringify(state.player.matchProgression));
        assert.equal(once.goals,expected.goals);
        assert.equal(once.assists,expected.assists);
        assert.equal(committed.progression.applied,true);
        assert.equal(committed.progression.matchId,session.id);
        assert.deepEqual(state.player.matchProgression.current.appliedMatchIds,[session.id]);
        commitInteractiveResult(state,session.result);
        assert.deepEqual(state.player.stats,once);
        assert.deepEqual(state.player.matchProgression,progressionOnce);
        assert.deepEqual(state.committedInteractiveMatchIds,[session.id]);
    } finally {
        Math.random = oldRandom;
    }
});

test('les choix alimentent réellement la mémoire intra-match', () => {
    const oldRandom = Math.random;
    Math.random = () => 0.1;
    try {
        const state = stateFor();
        const session = startInteractiveMatch(state, {
            type: 'rival',
            opponent: 'Rival FC',
            home: true,
            playerSelection: { started: true, minutes: 90 }
        }, 0);

        let guard = 0;
        while (!session.finished && guard++ < 80) {
            advanceInteractiveMatch(
                state,
                session,
                session.step?.kind === 'decision' ? { choiceIndex: 0 } : {}
            );
        }

        assert.equal(session.finished, true);
        assert.ok(session.result.matchMemory);
        assert.ok(session.result.matchMemory.duelsAttempted >= 0);
        assert.ok(session.result.matchMemory.lastChoice);
        assert.ok(Array.isArray(session.appliedMemoryEffects));
    } finally {
        Math.random = oldRandom;
    }
});

test('UIGateway sauvegarde au démarrage et après chaque transition interactive', () => {
    const saves = [];
    const state = { player: { id: 'p1' }, activeMatchSession: null };
    const stateManager = {
        save(current) {
            saves.push(JSON.parse(JSON.stringify(current)));
            return true;
        }
    };
    const interactiveMatchSystem = {
        startInteractiveMatch(_state, match, matchIndex) {
            return {
                id: 'session-1',
                match,
                matchIndex,
                step: { kind: 'narration', phase: 'pre_match' },
                decision: null,
                finished: false
            };
        },
        advanceInteractiveMatch(_state, session) {
            return {
                finished: false,
                session: { ...session, step: { kind: 'narration', phase: 'kickoff' } }
            };
        }
    };
    const engine = { state };
    const application = {
        engine,
        registry: {
            interactiveMatchSystem,
            blockSystem: { stateManager }
        }
    };
    const gateway = new UIGateway({ application, engine });

    gateway.startInteractiveMatch({ opponent: 'B' }, 0);
    assert.equal(saves.length, 1);
    assert.equal(saves[0].activeMatchSession.step.phase, 'pre_match');

    gateway.advanceInteractiveMatch();
    assert.equal(saves.length, 2);
    assert.equal(saves[1].activeMatchSession.step.phase, 'kickoff');
});

test('UIGateway conserve le résultat canonique après prolongation', () => {
    const state = {
        player: { id: 'p1' },
        activeMatchSession: {
            id: 'session-extra-time',
            match: { id: 'fixture-extra-time', minutes: 90, playerSelection: { started: true } },
            step: { kind: 'narration' }
        }
    };
    const canonical = {
        matchId: 'session-extra-time',
        minutesPlayed: 120,
        started: true,
        progression: { applied: true, matchId: 'session-extra-time' }
    };
    const application = {
        engine: { state },
        registry: {
            interactiveMatchSystem: {
                advanceInteractiveMatch() {
                    return { finished: true, result: { matchId: canonical.matchId, minutesPlayed: 120 } };
                },
                commitInteractiveResult() { return structuredClone(canonical); }
            },
            blockSystem: { stateManager: { save() { return true; } } }
        }
    };
    const gateway = new UIGateway({ application, engine: application.engine });
    const output = gateway.advanceInteractiveMatch();
    assert.equal(output.result.minutesPlayed, 120);
    assert.deepEqual(output.result.progression, canonical.progression);
    assert.equal(state.interactiveBlockResults[0].minutesPlayed, 120);
    assert.deepEqual(state.interactiveBlockResults[0].progression, canonical.progression);
});

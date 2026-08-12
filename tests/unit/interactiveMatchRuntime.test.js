import test from 'node:test';
import assert from 'node:assert/strict';
import {
    startInteractiveMatch,
    advanceInteractiveMatch
} from '../../domain/match/interactiveMatchRuntime.js';
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

        let sawGoal = false;
        let guard = 0;
        while (!session.finished && guard++ < 60) {
            const stepBefore = session.step;
            const result = advanceInteractiveMatch(
                state,
                session,
                stepBefore?.kind === 'decision' ? { choiceIndex: 0 } : {}
            );
            if (result.session?.step?.kind === 'goal') {
                sawGoal = true;
                assert.equal(result.session.step.label, '⚽ BUT');
                assert.equal(result.session.step.goal.matchId, session.id);
                assert.ok(Number(result.session.step.score.home) > 0);
            }
        }

        assert.equal(sawGoal, true);
        assert.equal(session.finished, true);
        assert.ok(Array.isArray(session.result.goalEvents));
        assert.equal(session.result.goalEvents.length, session.result.goals);
        assert.equal(session.result.interactiveReport.matchId, session.id);
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

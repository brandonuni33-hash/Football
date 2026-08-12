import test from 'node:test';
import assert from 'node:assert/strict';
import {
    startInteractiveMatch,
    advanceInteractiveMatch
} from '../../domain/match/interactiveMatchController.js';

function state() {
    return {
        player: {
            id: 'player-flow', firstname: 'Alex', lastname: 'Test', club: 'Street FC',
            position: 'BU', overall: 72, potential: 82, morale: 70, fitness: 90,
            attributes: { tir: 74, passe: 66, controle: 70, puissance: 68, vitesse: 73 },
            stats: {}, hidden: {}, temporaryEffects: []
        },
        social: { coachData: { name: 'Coach Rivera' } },
        career: { balance: 0 }, consequences: [], careerMemory: []
    };
}

function fixture() {
    return {
        id: 'final-flow', phase: 'Finale', competitionName: 'Coupe',
        opponent: 'Rival City', opponentStrength: 67, home: true,
        playerSelection: { selected: true, started: true, appearance: 'starter', minutes: 90 }
    };
}

function withRandom(values, callback) {
    const original = Math.random;
    let index = 0;
    Math.random = () => values[index++] ?? .42;
    try { return callback(); } finally { Math.random = original; }
}

test('le match jouable suit toute la séquence narrative dans le bon ordre', () => withRandom(Array(80).fill(.32), () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 0);
    const phases = [session.step.phase];

    let output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);

    assert.equal(output.step.kind, 'decision');
    assert.ok(output.step.choices.length >= 4);

    for (let index = 0; index < session.moments.length; index += 1) {
        output = advanceInteractiveMatch(current, session, { choiceIndex: index === 1 ? 1 : 0 });
        phases.push(output.step.phase);
        if (index === 0) assert.ok(session.modifiers.goal >= .07, 'matchBonuses.goalChance doit influencer le match');

        if (index < session.moments.length - 1) {
            output = advanceInteractiveMatch(current, session);
            phases.push(output.step.phase);
            output = advanceInteractiveMatch(current, session);
            phases.push(output.step.phase);
            output = advanceInteractiveMatch(current, session);
            phases.push(output.step.phase);
            assert.equal(output.step.kind, 'decision');
        }
    }

    assert.equal(output.step.phase, 'full_time_sequence');
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    assert.equal(output.step.kind, 'reactions');
    assert.deepEqual(output.step.items.map(item => item.id), ['locker-room', 'coach', 'media']);

    output = advanceInteractiveMatch(current, session);
    assert.equal(output.finished, true);
    assert.equal(session.finished, true);

    assert.deepEqual(phases.slice(0, 3), ['pre_match', 'kickoff', 'moment_1']);
    assert.equal(phases.at(-3), 'full_time_sequence');
    assert.equal(phases.at(-2), 'final_whistle');
    assert.equal(phases.at(-1), 'reactions');
    for (let index = 1; index <= session.moments.length; index += 1) {
        assert.ok(phases.includes(`consequence_${index}`));
        if (index < session.moments.length) {
            assert.ok(phases.includes('match_continues'));
            assert.ok(phases.includes('unexpected_event'));
            assert.ok(phases.includes(`moment_${index + 1}`));
        }
    }
}));

test('le résultat final reste cohérent avec les contributions et les réactions', () => withRandom(Array(100).fill(.2), () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 2);

    advanceInteractiveMatch(current, session);
    let output = advanceInteractiveMatch(current, session);

    while (!session.result) {
        if (output.step?.kind === 'decision') {
            output = advanceInteractiveMatch(current, session, { choiceIndex: 0 });
        } else {
            output = advanceInteractiveMatch(current, session);
        }
    }

    const result = session.result;
    assert.ok(result);
    assert.equal(result.interactiveFlowVersion, 3);
    assert.equal(result.decisions.length, session.moments.length);
    assert.ok(result.teamGoals >= result.goals + result.assists);
    assert.equal(result.score.home, result.teamGoals);
    assert.equal(result.postMatchReactions.length, 3);
    assert.match(result.postMatchReactions[1].text, /Coach Rivera/);
}));

test('une étape automatique ne choisit jamais une décision à la place du joueur', () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 0);
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session);
    const waiting = advanceInteractiveMatch(current, session);

    assert.equal(waiting.step.phase, 'moment_1');
    assert.equal(waiting.step.kind, 'decision');
    assert.equal(session.decisions.length, 0);
});

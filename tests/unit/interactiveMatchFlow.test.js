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

test('le match jouable suit toute la séquence narrative dans le bon ordre', () => withRandom(Array(40).fill(.32), () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 0);
    const phases = [session.step.phase];

    let output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);

    assert.equal(output.step.kind, 'decision');
    assert.equal(output.step.choices.length, 4);
    output = advanceInteractiveMatch(current, session, { choiceIndex: 0 });
    phases.push(output.step.phase);
    assert.ok(session.modifiers.goal >= .07, 'matchBonuses.goalChance doit influencer le match');

    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    assert.equal(output.step.kind, 'decision');

    output = advanceInteractiveMatch(current, session, { choiceIndex: 1 });
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    output = advanceInteractiveMatch(current, session);
    phases.push(output.step.phase);
    assert.equal(output.step.kind, 'reactions');
    assert.deepEqual(output.step.items.map(item => item.id), ['locker-room', 'coach', 'media']);

    output = advanceInteractiveMatch(current, session);
    assert.equal(output.finished, true);
    assert.equal(session.finished, true);
    assert.deepEqual(phases, [
        'pre_match', 'kickoff', 'moment_1', 'consequence_1', 'match_continues',
        'unexpected_event', 'moment_2', 'full_time_sequence', 'final_whistle', 'reactions'
    ]);
}));

test('le résultat final reste cohérent avec les contributions et les réactions', () => withRandom([
    .1, .2, .8, .1, .2, .3, .1, .2, .3, .1, .2, .3, .1, .2, .3, .1, .2, .3
], () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 2);
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session, { choiceIndex: 0 });
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session);
    advanceInteractiveMatch(current, session, { choiceIndex: 0 });

    const result = session.result;
    assert.ok(result);
    assert.equal(result.interactiveFlowVersion, 2);
    assert.equal(result.decisions.length, 2);
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

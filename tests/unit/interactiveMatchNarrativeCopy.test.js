import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPreMatchStep,
    buildKickoffStep,
    buildContinuationStep,
    buildPostMatchReactions
} from '../../domain/match/interactiveMatchNarrative.js';

function session(overrides = {}) {
    return {
        id: 'copy-test',
        matchIndex: 1,
        team: 'FC Test',
        opponent: 'Rival Test',
        competition: 'Championnat U15 local',
        home: true,
        type: 'league',
        importance: 'normal',
        playerAge: 15,
        playerPosition: 'MC',
        score: { home: 0, away: 0 },
        moments: [28, 63],
        currentMoment: 0,
        decisions: [],
        events: [],
        modifiers: { fatigue: 0 },
        match: { id:'copy-u15', ageCategory: 'U15' },
        ...overrides
    };
}

test('le match jouable ne réutilise plus les anciens fillers', () => {
    const s = session();
    const copy = [buildPreMatchStep(s), buildKickoffStep(s), buildContinuationStep(s)]
        .map(step => `${step.title} ${step.text}`)
        .join(' ');
    assert.doesNotMatch(copy, /Les tribunes se remplissent/i);
    assert.doesNotMatch(copy, /Le ballon roule/i);
    assert.doesNotMatch(copy, /Le match cherche encore son rythme/i);
});

test('une rencontre U15 sépare une affluence crédible de son contexte', () => {
    const preMatch = buildPreMatchStep(session());
    assert.ok(preMatch.attendanceInfo);
    const crowd = Number(preMatch.attendanceInfo.count);
    assert.ok(crowd >= 25 && crowd <= 260, `affluence U15 incohérente: ${crowd}`);
    assert.match(preMatch.attendanceInfo.label, /spectateur/i);
    assert.doesNotMatch(preMatch.text, /spectateur/i);
    assert.doesNotMatch(preMatch.attendanceInfo.context, /stade|tribune|main courante/i);
});

test('les réactions U15 ne créent pas artificiellement une couverture média pro', () => {
    const state = { player: { age: 15 }, social: { formativeCoach: 'Coach Martin' } };
    const reactions = buildPostMatchReactions(state, session(), { result: 'win', rating: 7.4, goals: 1, assists: 0 });
    assert.equal(reactions[2].label, 'BORD DU TERRAIN');
    assert.doesNotMatch(reactions[2].text, /médias|journaliste|presse|stade|tribune/i);
    assert.match(reactions[2].text, /coach|famille|amis|adversaires/i);
});

test('le contexte pro peut produire une affluence nettement supérieure', () => {
    const pro = session({
        id: 'copy-test-pro',
        playerAge: 24,
        competition: 'Ligue professionnelle',
        importance: 'important',
        match: { id:'copy-pro', ageCategory: 'Senior', stadiumCapacity: 42000 }
    });
    const preMatch = buildPreMatchStep(pro);
    const crowd = Number(preMatch.attendanceInfo.count);
    assert.ok(crowd >= 5000 && crowd <= 42000, `affluence pro incohérente: ${crowd}`);
    assert.match(preMatch.attendanceInfo.context, /stade|tribun/i);
});

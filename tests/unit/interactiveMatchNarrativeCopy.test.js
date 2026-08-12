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
        playerPosition: 'MC',
        score: { home: 0, away: 0 },
        moments: [28, 63],
        currentMoment: 0,
        decisions: [],
        events: [],
        modifiers: { fatigue: 0 },
        match: { ageCategory: 'U15' },
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

test('une rencontre U15 conserve une affluence crédible', () => {
    const text = buildPreMatchStep(session()).text;
    const match = text.match(/([\d\s ]+) spectateurs/);
    assert.ok(match, text);
    const crowd = Number(match[1].replace(/\D/g, ''));
    assert.ok(crowd >= 25 && crowd <= 240, `affluence U15 incohérente: ${crowd}`);
});

test('les réactions U15 ne créent pas artificiellement une couverture média pro', () => {
    const state = { player: { age: 15 }, social: { formativeCoach: 'Coach Martin' } };
    const reactions = buildPostMatchReactions(state, session(), { result: 'win', rating: 7.4, goals: 1, assists: 0 });
    assert.equal(reactions[2].label, 'BORD DU TERRAIN');
    assert.doesNotMatch(reactions[2].text, /médias|journaliste|presse/i);
});

test('le contexte pro peut produire une affluence nettement supérieure', () => {
    const pro = session({
        id: 'copy-test-pro',
        competition: 'Ligue professionnelle',
        importance: 'important',
        match: { ageCategory: 'Senior', stadiumCapacity: 42000 }
    });
    const text = buildPreMatchStep(pro).text;
    const match = text.match(/([\d\s ]+) spectateurs/);
    assert.ok(match, text);
    const crowd = Number(match[1].replace(/\D/g, ''));
    assert.ok(crowd >= 5000 && crowd <= 42000, `affluence pro incohérente: ${crowd}`);
});

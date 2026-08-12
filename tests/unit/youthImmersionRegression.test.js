import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreMatchStep } from '../../domain/match/interactiveMatchNarrative.js';
import { decisionNarration } from '../../domain/match/matchDecisionNarration.js';
import { createDirectOpponent } from '../../domain/match/directOpponentSystem.js';
import { startInteractiveMatch, advanceInteractiveMatch } from '../../domain/match/interactiveMatchController.js';
import MediaSystem from '../../domain/media/mediaSystem.js';

function youthSession(id) {
    return {
        id:`session-${id}`,
        matchIndex:0,
        match:{ id, competitionName:'Championnat National U15', attendance:127, ageCategory:'U15' },
        team:'Trélissac FC', opponent:'FC Martigues U15', competition:'Championnat National U15',
        home:true, type:'league', importance:'normal', playerAge:15,
        score:{home:0,away:0}, playerPosition:'BU', modifiers:{fatigue:0}
    };
}

test('l’affluence U15 est séparée du contexte et varie légèrement', () => {
    const first = buildPreMatchStep(youthSession('u15-a'));
    const second = buildPreMatchStep(youthSession('u15-b'));
    assert.ok(first.attendanceInfo);
    assert.match(first.attendanceInfo.label, /spectateur/);
    assert.ok(first.attendanceInfo.count >= 118 && first.attendanceInfo.count <= 136);
    assert.notEqual(first.attendanceInfo.count, second.attendanceInfo.count);
    assert.doesNotMatch(first.text, /127|spectateur/i);
    assert.doesNotMatch(`${first.attendanceInfo.context} ${first.text}`, /stade|tribune|main courante/i);
});

test('une micro-scène U15 ne cite plus le nom du club adverse', () => {
    const directOpponent = createDirectOpponent({ seed:'martigues-test', playerPosition:'BU', strength:55 });
    const text = decisionNarration({ minute:34, index:0, position:'attaquant', age:15, level:'Championnat National U15', competition:'Championnat National U15', opponent:'FC Martigues U15', score:{home:0,away:0}, home:true, confidence:55, fatigue:0, coachTrust:50, directOpponent });
    assert.doesNotMatch(text, /FC Martigues|Martigues U15/i);
    assert.doesNotMatch(text, /main courante/i);
    assert.match(text, /vis-à-vis|défenseur|duel|surface|coéquipier/i);
});

test('l’origine futsal ouvre un choix sans s’afficher comme un trait', () => {
    const state = { player:{ id:'p-futsal', age:15, club:'Trélissac FC', position:'BU', overall:70, origin:'FUTSAL', attributes:{controle:78,dribble:78,tir:70,passe:66,puissance:60,vitesse:72}, stats:{} }, social:{coachData:{name:'Coach'}}, career:{balance:0}, consequences:[], careerMemory:[] };
    // Ce seed force ici une décision de duel normale : les OCC peuvent légitimement remplacer certains moments offensifs.
    const fixture = { id:'futsal-u15-7', competitionName:'Championnat National U15', opponent:'FC Martigues U15', home:true, opponentStrength:55, playerSelection:{selected:true,started:true,minutes:70} };
    const session = startInteractiveMatch(state, fixture, 0);
    advanceInteractiveMatch(state, session);
    const output = advanceInteractiveMatch(state, session);
    const joined = output.step.choices.map(choice => `${choice.text} ${choice.gesture || ''}`).join(' | ');
    assert.match(joined, /Éliminer dans un petit espace/);
    assert.doesNotMatch(joined, /futsal|réflexe futsal|trait futsal/i);
});

test('les médias restent coupés en U15 même après plusieurs matchs', () => {
    const media = new MediaSystem();
    const state = { player:{ id:'u15-media', firstname:'Alex', lastname:'Test', age:15, squadStatus:'U15', careerStage:'youth', stats:{matchesPlayed:12} }, calendar:{currentSeason:1,currentMonth:4}, media:media.initMediaData() };
    const result = media.generatePostAfterBlock(state, { competitionName:'Championnat National U15', matchesPlayed:3, goals:3, assists:1, rating:8.4 });
    assert.equal(result.post, null);
    assert.equal(result.dilemma, null);
    assert.equal(state.media.proCoverageUnlocked, false);
    assert.equal(state.media.feed.length, 0);
});

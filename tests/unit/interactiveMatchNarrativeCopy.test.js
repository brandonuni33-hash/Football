import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildPreMatchStep,
    buildKickoffStep,
    buildDecisionStep,
    buildConsequenceStep,
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
    assert.doesNotMatch(copy, /quelques regards et quelques mots/i);
});

test('une occasion de but peut faire entendre la petite voix sans afficher une étiquette', () => {
    const s = session();
    const decision = {
        minute:34,
        title:'Le dégagement arrive à trente mètres',
        description:'Un ballon repoussé te revient en pleine course.',
        isGoalOpportunity:true,
        choices:[{text:'Frapper'},{text:'Contrôler'},{text:'Donner'}]
    };
    const step = buildDecisionStep(s, decision, 0);
    assert.ok(step.innerVoice);
    assert.equal(typeof step.innerVoice, 'string');
    assert.doesNotMatch(step.innerVoice, /pensée|petite voix/i);
});

test('deux familles de gestes produisent des conséquences réellement différentes', () => {
    const s = session();
    const shot = buildConsequenceStep(s, {
        minute: 34,
        title: 'Tu vas au bout de l’occasion',
        text: 'Le geste réussit.',
        choice: 'Rentrer dans la surface pour frapper',
        gesture: 'Retour intérieur et frappe'
    }, 0);
    const control = buildConsequenceStep(s, {
        minute: 60,
        title: 'Tu vas au bout de l’occasion',
        text: 'Le geste réussit.',
        choice: 'Reproduire le contrôle orienté travaillé à l’entraînement',
        gesture: 'Contrôle orienté travaillé'
    }, 1);
    assert.notEqual(shot.text, control.text);
    assert.match(shot.text, /angle|frappe/i);
    assert.match(control.text, /contrôle|première pression|appui/i);
    assert.doesNotMatch(`${shot.text} ${control.text}`, /tourner les hanches.*demi-mètre|passe\. Ton adversaire doit tourner/i);
});

test('une conséquence réussie ne célèbre pas un but avant sa confirmation', () => {
    const step = buildConsequenceStep(session(), {
        minute: 34,
        title: 'Tu vas au bout de l’occasion',
        text: 'Le geste réussit.',
        choice: 'Frapper',
        gesture: 'Frappe première intention'
    }, 0);
    assert.doesNotMatch(step.innerVoice || '', /ah là là|ouais !!|yes|enfin|wouh|trop content/i);
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

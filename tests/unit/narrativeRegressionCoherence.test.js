import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeBeatComposer from '../../domain/narrative/narrativeBeatComposer.js';
import NarrativeFactCollector from '../../domain/narrative/narrativeFactCollector.js';

function matchFact({ id, index, opponent, goals, assists = 0, rating = 7, teamGoals = 2, opponentGoals = 1 }) {
    return {
        id,
        type:'match.completed',
        metrics:{ matchIndex:index, goals, assists, rating, teamGoals, opponentGoals, playerPlayed:true, started:true, minutesPlayed:70, interactive:false },
        outcome:{ result:teamGoals > opponentGoals ? 'win' : teamGoals < opponentGoals ? 'loss' : 'draw' },
        payload:{ opponent, competitionName:'Championnat National U15', fixture:{} },
        occurredAt:`match-${index}`
    };
}

test('la scène d’un match ne reprend jamais le doublé d’un autre match du bloc', () => {
    const featured = matchFact({ id:'martigues', index:2, opponent:'FC Martigues U15', goals:1, assists:1, rating:5.7, teamGoals:3, opponentGoals:1 });
    const other = matchFact({ id:'ajaccio', index:1, opponent:'AC Ajaccio U15', goals:2, assists:0, rating:7.2, teamGoals:3, opponentGoals:0 });
    const evaluations = new Map([
        [featured.id,{ factId:featured.id, importance:'normal', impactLevel:'decisive' }],
        [other.id,{ factId:other.id, importance:'normal', impactLevel:'decisive' }]
    ]);
    const composer = new NarrativeBeatComposer();
    const output = composer.compose({
        plan:{ primary:{ featuredFact:featured, impactFact:other, facts:[other,featured], evaluation:evaluations.get(featured.id), evaluations, arc:null } },
        context:{ seed:'coherence', player:{ id:'p', age:15, morale:60 }, career:{} },
        memory:{}
    });
    const text = output.primaryScene.beats.map(beat => beat.text).join(' ');
    assert.match(text, /Un but et une passe décisive/i);
    assert.doesNotMatch(text, /doublé|deux buts|2 buts/i);
    assert.equal(output.primaryScene.impactMatchIndex, featured.metrics.matchIndex);
    assert.equal(output.primaryScene.facts.goals, 1);
    assert.equal(output.primaryScene.facts.assists, 1);
});

test('une conséquence ne montre jamais une clé technique comme ATTRIBUTS.VITESSE', () => {
    const collector = new NarrativeFactCollector();
    const state = { player:{ id:'player-1', stats:{matchesPlayed:3} }, calendar:{ currentSeasonYear:2026, currentMonth:4 } };
    const facts = collector.collectWorldFacts({
        state,
        resolved:{ revealedConsequences:[{ id:'c-1', choiceId:'choice-1', label:'attributes.vitesse', narrative:'Tu commences à sentir les effets du travail.', result:{delta:3} }] }
    });
    assert.equal(facts.length, 1);
    assert.doesNotMatch(facts[0].payload.title, /attributes|vitesse\./i);
    assert.match(facts[0].payload.title, /explosivité/i);
});

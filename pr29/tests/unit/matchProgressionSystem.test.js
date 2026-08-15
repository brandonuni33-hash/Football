import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FOOTBALL_ATTRIBUTES, calculateOverall } from '../../domain/player/playerSystem.js';
import {
    MATCH_PROGRESSION_RULES,
    applyMatchProgression
} from '../../domain/player/matchProgressionSystem.js';
import { SimulatedMatchSystem } from '../../domain/match/simulatedMatchSystem.js';
import { simulateShortCareers } from '../../scripts/shortCareerSimulator.js';

function player(overrides = {}) {
    const attributes = Object.fromEntries(FOOTBALL_ATTRIBUTES.map(key => [key, 50]));
    const value = {
        id: 'progression-player',
        age: 14,
        position: 'BU',
        attributes,
        mental: {
            concentration: 60,
            sangFroid: 60,
            decision: 60,
            regularite: 70,
            resistancePression: 60
        },
        hidden: { consistency: 14 },
        potentialProfile: { current: 82 },
        potential: 82,
        stats: {},
        ...overrides
    };
    value.overall = calculateOverall(value);
    return value;
}

function match(matchId, overrides = {}) {
    return {
        matchId,
        played: true,
        playerPlayed: true,
        minutesPlayed: 90,
        rating: 8.8,
        goals: 1,
        assists: 0,
        ...overrides
    };
}

test('les fractions de match s accumulent sans arrondi prématuré', () => {
    const subject = player();
    const initial = subject.attributes.finition;
    const reports = [];
    for (let index = 1; index <= 6; index += 1) {
        reports.push(applyMatchProgression(subject, match(`fraction-${index}`, {
            rating: 7.5,
            goals: 0
        }), {
            chapterId: 'fraction-test',
            focusAttribute: 'finition'
        }));
    }
    assert.equal(reports[0].attributeGain, 0);
    assert.ok(reports[0].fractionalCarry > 0 && reports[0].fractionalCarry < 1);
    assert.ok(subject.attributes.finition > initial);
    assert.equal(subject.matchProgression.current.matches, 6);
    assert.ok(subject.matchProgression.fractions.finition >= 0);
});

test('une tranche de six matchs respecte les plafonds overall et attribut ciblé', () => {
    const subject = player();
    const initialOverall = subject.overall;
    const initialAttribute = subject.attributes.finition;
    for (let index = 1; index <= 6; index += 1) {
        applyMatchProgression(subject, match(`cap-${index}`, {
            rating: 9.4,
            goals: 2,
            assists: 1
        }), {
            chapterId: 'beta-short',
            focusAttribute: 'finition'
        });
    }
    assert.ok(subject.overall - initialOverall <= MATCH_PROGRESSION_RULES.maxOverallGainPerChapter);
    assert.ok(subject.attributes.finition - initialAttribute <= MATCH_PROGRESSION_RULES.maxFocusedAttributeGainPerChapter);
    assert.equal(subject.matchProgression.current.appliedMatchIds.length, 6);
});

test('un match déjà appliqué ne crédite pas deux fois la progression', () => {
    const subject = player();
    const result = match('unique-match');
    const first = applyMatchProgression(subject, result, { chapterId: 'idempotence', focusAttribute: 'finition' });
    const snapshot = JSON.stringify(subject);
    const second = applyMatchProgression(subject, result, { chapterId: 'idempotence', focusAttribute: 'finition' });
    assert.equal(first.applied, true);
    assert.equal(second.applied, false);
    assert.equal(second.reason, 'duplicate-match');
    assert.equal(JSON.stringify(subject), snapshot);
});

test('la sixième apparition reste idempotente avant l ouverture automatique suivante', () => {
    const subject = player();
    for (let index = 1; index <= 6; index += 1) {
        applyMatchProgression(subject, match(`auto-${index}`), { focusAttribute: 'finition' });
    }
    const snapshot = JSON.stringify(subject);
    const duplicate = applyMatchProgression(subject, match('auto-6'), { focusAttribute: 'finition' });
    assert.equal(duplicate.applied, false);
    assert.equal(duplicate.reason, 'duplicate-match');
    assert.equal(JSON.stringify(subject), snapshot);
    const next = applyMatchProgression(subject, match('auto-7'), { focusAttribute: 'finition' });
    assert.equal(next.applied, true);
    assert.equal(next.chapterMatch, 1);
    const oldChapterDuplicate = applyMatchProgression(subject, match('auto-1'), { focusAttribute: 'finition' });
    assert.equal(oldChapterDuplicate.applied, false);
    assert.equal(oldChapterDuplicate.reason, 'duplicate-match');
});

test('une ancienne sauvegarde sans ledger est acceptée et le ledger survit au JSON', () => {
    const legacy = player();
    assert.equal(Object.hasOwn(legacy, 'matchProgression'), false);
    const result = applyMatchProgression(legacy, match('legacy-1'), {
        chapterId: 'legacy',
        focusAttribute: 'finition'
    });
    assert.equal(result.applied, true);
    const restored = JSON.parse(JSON.stringify(legacy));
    const next = applyMatchProgression(restored, match('legacy-2'), {
        chapterId: 'legacy',
        focusAttribute: 'finition'
    });
    assert.equal(next.chapterMatch, 2);
    assert.equal(restored.matchProgression.version, MATCH_PROGRESSION_RULES.ledgerVersion);
});

test('les consommateurs simulés ne fabriquent plus d XP de match', () => {
    for (const relative of ['../../domain/match/simulatedMatchSystem.js']) {
        const source = fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
        assert.match(source, /applyMatchProgression/);
        assert.doesNotMatch(source, /xpMatch|xpGained|PlayerLogic\.applyProgression/);
    }
    assert.equal(fs.existsSync(new URL('../../domain/match/blockMatchSimulator.js', import.meta.url)), false);
});

test('le simulateur de matchs branche son résultat sur le ledger canonique', () => {
    const subject = player();
    const state = {
        player: subject,
        trainingFocus: 'FINITION',
        career: { progressionChapterId: 'consumer-test' },
        calendar: { currentSeasonYear: 2026, currentMonth: 8 }
    };
    const originalRandom = Math.random;
    Math.random = () => .42;
    try {
        const fixture = {
            id: 'fixture-consumer',
            opponent: 'Club Test',
            opponentStrength: 55,
            home: true
        };
        const rows = new SimulatedMatchSystem().simulateMatches(state, [fixture], {
            selectionEntries: [{ matchIndex: 0, selected: true, started: true, minutes: 90 }]
        });
        assert.equal(rows.length, 1);
        assert.equal(rows[0].progression.applied, true);
        assert.equal(rows[0].progression.matchId, 'fixture-consumer');
        assert.equal(rows[0].progression.focusAttribute, 'finition');
        assert.equal(subject.matchProgression.current.matches, 1);
        const statsAfterFirstCommit = structuredClone(subject.stats);
        const duplicate = new SimulatedMatchSystem().simulateMatches(state, [fixture], {
            selectionEntries: [{ matchIndex: 0, selected: true, started: true, minutes: 90 }]
        });
        assert.deepEqual(duplicate, []);
        assert.deepEqual(subject.stats, statsAfterFirstCommit);
        assert.equal(subject.matchProgression.appliedMatchIds.filter(id => id === fixture.id).length, 1);
    } finally {
        Math.random = originalRandom;
    }
});

test('rejouer un bloc déjà committé ne modifie aucun effet secondaire', () => {
    const subject = player({ fitness: 90, morale: 70, clubCountry: 'France', clubLevel: 1 });
    const fixture = {
        id: 'fixture-block-idempotent',
        opponent: 'Club Test',
        opponentStrength: 55,
        home: true,
        month: 8,
        type: 'youth',
        competitionId: 'YOUTH_TEST'
    };
    const state = {
        player: subject,
        trainingFocus: 'FINITION',
        career: { progressionChapterId: 'block-idempotence', balance: 0 },
        calendar: {
            currentSeasonYear: 2026,
            currentMonth: 8,
            seasonMatchCursor: 0,
            seasonSchedule: {
                version: 5,
                seasonYear: 2026,
                category: 'U15',
                matches: [fixture],
                byMonth: { 8: { matches: [fixture] } }
            }
        }
    };
    const originalRandom = Math.random;
    Math.random = () => .42;
    try {
        const system = new SimulatedMatchSystem();
        const first = system.simulateBlock(state);
        assert.equal(first.results.length,1);
        const afterFirst = {
            stats: structuredClone(subject.stats),
            fitness: subject.fitness,
            morale: subject.morale,
            balance: state.career.balance
        };
        const duplicate = system.simulateBlock(state);
        assert.equal(duplicate.summary.duplicateOnly,true);
        assert.deepEqual(duplicate.results,[]);
        assert.deepEqual(subject.stats,afterFirst.stats);
        assert.equal(subject.fitness,afterFirst.fitness);
        assert.equal(subject.morale,afterFirst.morale);
        assert.equal(state.career.balance,afterFirst.balance);
    } finally {
        Math.random = originalRandom;
    }
});

test('le simulateur déterministe valide 1 008 carrières et 6 048 matchs', () => {
    const report = simulateShortCareers();
    assert.equal(report.careerCount, 1008);
    assert.equal(report.matchCount, 6048);
    assert.equal(report.combinations, 9);
    assert.equal(report.valid, true, JSON.stringify(report.failures.slice(0, 5)));
    assert.deepEqual(report.failures, []);
    assert.equal(report.careers[0].matches[0].seed, 1);
    assert.equal(report.careers[0].matches[0].origin, 'CENTRE_FORMATION');
    assert.equal(report.careers[0].matches[0].archetype, 'FINISSEUR');
    assert.equal(report.careers[0].matches[0].match, 1);
    const goalEvents = report.careers.flatMap(career => career.matches.flatMap(row => row.goalEvents));
    assert.ok(goalEvents.some(event => event.teamSide === 'PLAYER_TEAM'));
    assert.ok(goalEvents.some(event => event.teamSide === 'OPPONENT'));
    assert.ok(goalEvents.every(event => event.kind === 'goal' && event.matchId && event.sequence > 0));
});

test('une même matrice de seeds produit exactement le même rapport', () => {
    assert.deepEqual(
        simulateShortCareers({ seedsPerCombination: 1 }),
        simulateShortCareers({ seedsPerCombination: 1 })
    );
});

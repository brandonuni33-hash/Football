import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeEngine from '../../domain/narrative/narrativeEngine.js';

function state(overrides = {}) {
    const playerOverrides = overrides.player || {};
    return {
        player: {
            id: 'player-voice',
            firstname: 'Alex',
            morale: 50,
            fitness: 90,
            stats: {
                matchesPlayed: 1,
                goals: 0,
                assists: 0,
                averageRating: 6.8,
                relationCoach: 50,
                ...(playerOverrides.stats || {})
            },
            ...playerOverrides,
            stats: {
                matchesPlayed: 1,
                goals: 0,
                assists: 0,
                averageRating: 6.8,
                relationCoach: 50,
                ...(playerOverrides.stats || {})
            }
        },
        calendar: { currentSeasonYear: 2026, currentMonth: 8 },
        career: { seasonHistory: overrides.seasonHistory || [] },
        careerMemory: [],
        notifications: { signals: [], threads: [], unreadCount: 0 }
    };
}

function report(overrides = {}) {
    return {
        summary: {
            matchResults: [{
                matchIndex: 0,
                opponent: 'Rival FC',
                competitionName: 'Championnat',
                result: 'win',
                teamGoals: 2,
                opponentGoals: 0,
                rating: 6.8,
                goals: 0,
                assists: 0,
                playerPlayed: true,
                started: true,
                minutesPlayed: 90,
                fixture: { id: 'voice-match-1' },
                ...overrides
            }]
        }
    };
}

function mindsetBeat(output) {
    return output.primaryScene?.beats?.find(beat => beat.kind === 'player-mindset') || null;
}

test('le premier but de carrière reçoit une réaction intime sans être confondu avec un but ordinaire', () => {
    const current = state({ player: { stats: { matchesPlayed: 1, goals: 1, assists: 0, averageRating: 8.1 } } });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ teamGoals: 1, opponentGoals: 0, rating: 8.1, goals: 1 })
    });

    assert.equal(output.primaryScene.facts.firstCareerGoal, true);
    assert.equal(output.primaryScene.title, 'Le premier restera à part');
    assert.match(mindsetBeat(output)?.text || '', /premier/i);
});

test('un but plus tard dans la saison ne peut pas être raconté comme le premier', () => {
    const current = state({ player: { stats: { matchesPlayed: 4, goals: 3, assists: 0, averageRating: 7.3 } } });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ teamGoals: 2, opponentGoals: 0, rating: 7.8, goals: 1 })
    });

    assert.equal(output.primaryScene.facts.firstCareerGoal, false);
    assert.notEqual(output.primaryScene.title, 'Le premier restera à part');
    assert.doesNotMatch(mindsetBeat(output)?.text || '', /premier but de ta carrière/i);
});

test('un ancien but de carrière empêche toute fausse narration de premier but même après une longue carrière', () => {
    const seasonHistory = Array.from({ length: 12 }, (_, index) => ({
        seasonLabel: `${2014 + index}/${2015 + index}`,
        goals: index === 0 ? 1 : 0
    }));
    const current = state({
        player: { stats: { matchesPlayed: 1, goals: 1, assists: 0, averageRating: 7.6 } },
        seasonHistory
    });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ teamGoals: 1, opponentGoals: 0, rating: 7.6, goals: 1 })
    });

    assert.equal(output.primaryScene.facts.firstCareerGoal, false);
    assert.notEqual(output.primaryScene.title, 'Le premier restera à part');
});

test('une grosse prestation dans une défaite garde une émotion contradictoire', () => {
    const current = state({ player: { stats: { matchesPlayed: 5, goals: 2, assists: 1, averageRating: 7.2 } } });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ result: 'loss', teamGoals: 1, opponentGoals: 2, rating: 8.1, goals: 1 })
    });

    const text = mindsetBeat(output)?.text || '';
    assert.ok(text.length > 0);
    assert.match(text, /défaite|résultat|consoler|frustration/i);
});

test('une entrée décisive fait sentir la valeur des minutes données', () => {
    const current = state({ player: { stats: { matchesPlayed: 6, goals: 2, assists: 2, averageRating: 7.0 } } });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ started: false, minutesPlayed: 24, rating: 7.6, assists: 1 })
    });

    const text = mindsetBeat(output)?.text || '';
    assert.ok(text.length > 0);
    assert.match(text, /temps|minutes|entrée|ballon|hiérarchie/i);
});

test('un mauvais match pendant une période de moral bas est traité sans mélodrame', () => {
    const current = state({
        player: { morale: 26, stats: { matchesPlayed: 7, goals: 1, assists: 1, averageRating: 6.1 } }
    });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({ result: 'loss', teamGoals: 0, opponentGoals: 2, rating: 4.9 })
    });

    const text = mindsetBeat(output)?.text || '';
    assert.ok(text.length > 0);
    assert.match(text, /prochain|entraînement|confiance|erreurs|suite|vestiaire/i);
});

test('un match ordinaire ne force aucune introspection', () => {
    const current = state();
    const output = new NarrativeEngine().processMatchEnd({ state: current, report: report() });

    assert.equal(mindsetBeat(output), null);
    assert.equal(output.primaryScene.beats.filter(beat => beat.kind === 'player-mindset').length, 0);
});

test('rester sur le banc dans une période difficile peut laisser une trace discrète', () => {
    const current = state({
        player: { morale: 24, stats: { matchesPlayed: 2, goals: 0, assists: 0, averageRating: 6.0 } }
    });
    const output = new NarrativeEngine().processMatchEnd({
        state: current,
        report: report({
            playerPlayed: false,
            started: false,
            appearance: 'bench',
            minutesPlayed: 0,
            rating: null,
            goals: 0,
            assists: 0
        })
    });

    const text = mindsetBeat(output)?.text || '';
    assert.ok(text.length > 0);
    assert.match(text, /banc|place|coach|rencontre|match/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeEngine from '../../domain/narrative/narrativeEngine.js';

function baseState(overrides = {}) {
    return {
        player: {
            id: 'player-1',
            firstname: 'Alex',
            morale: 50,
            fitness: 90,
            stats: { matchesPlayed: 0, relationCoach: 50 },
            ...(overrides.player || {})
        },
        social: {
            formativeCoach: 'Marc Delmas',
            coachData: { name: 'Marc Delmas', relation: 50, opinion: 'Neutre', hasLeftClub: false },
            ...(overrides.social || {})
        },
        calendar: { currentSeasonYear: 2026, currentMonth: 8 },
        career: { seasonHistory: [] },
        careerMemory: [],
        notifications: { signals: [], threads: [{ id: 'notification-thread' }], unreadCount: 0 }
    };
}

test('une relation forte avec le coach formateur donne un poids personnel à la scène', () => {
    const state = baseState({
        player: { morale: 27, stats: { matchesPlayed: 0, relationCoach: 88 } },
        social: { coachData: { name: 'Marc Delmas', relation: 88, opinion: 'Fier', hasLeftClub: false } }
    });
    const notificationsBefore = structuredClone(state.notifications);
    const output = new NarrativeEngine().processBlock({
        state,
        report: { summary: { matchResults: [] } },
        resolved: {
            coachEvent: {
                id: 'coach-formative-talk',
                title: 'Marc Delmas veut te parler',
                description: 'Après la séance, Marc Delmas te demande de rester quelques minutes.'
            }
        }
    });

    assert.equal(output.primaryScene.type, 'world.update');
    assert.equal(output.primaryScene.title, 'Marc Delmas veut te parler');
    const text = output.primaryScene.beats[0].text;
    assert.match(text, /Après la séance/);
    assert.match(text, /n’est plus seulement un entraîneur/);
    assert.match(text, /ce rendez-vous te travaille déjà/);
    assert.equal(output.journalEntries[0].text, text);
    assert.deepEqual(state.notifications, notificationsBefore);
});

test('un échange coach ordinaire reste sobre quand aucun signal émotionnel ne le justifie', () => {
    const state = baseState();
    const output = new NarrativeEngine().processBlock({
        state,
        report: { summary: { matchResults: [] } },
        resolved: {
            coachEvent: {
                id: 'coach-routine-talk',
                title: 'Point avec le coach',
                description: 'Le coach veut revenir sur ta dernière semaine.'
            }
        }
    });

    assert.equal(output.primaryScene.beats.length, 1);
    assert.equal(output.primaryScene.beats[0].text, 'Le coach veut revenir sur ta dernière semaine.');
});

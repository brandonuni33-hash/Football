import test from 'node:test';
import assert from 'node:assert/strict';
import NarrativeEngine from '../../domain/narrative/narrativeEngine.js';
import CoachSystem from '../../domain/coach/coachSystem.js';

function baseState(overrides = {}) {
    return {
        player: {
            id: 'player-1',
            firstname: 'Alex',
            age: 17,
            morale: 50,
            fitness: 90,
            stats: { matchesPlayed: 0, relationCoach: 50 },
            ...(overrides.player || {})
        },
        social: {
            formativeCoach: 'Marc Delmas',
            youthClubName: 'Academy FC',
            coachData: { name: 'Marc Delmas', relation: 50, opinion: 'Neutre', hasLeftClub: false },
            ...(overrides.social || {})
        },
        calendar: { currentSeasonYear: 2026, currentMonth: 8 },
        career: { seasonHistory: [] },
        careerMemory: [],
        consequences: [],
        notifications: { signals: [], threads: [{ id: 'notification-thread' }], unreadCount: 0 }
    };
}

test('une relation forte avec le coach formateur reste personnelle sans devenir un paragraphe', () => {
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
    assert.equal(text, 'Après la séance, Marc Delmas te demande de rester quelques minutes.');
    assert.doesNotMatch(text, /n’est plus seulement|fatigue rend|autre poids|confiance s’est construite/i);
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

test('un choix coach enrichit la mémoire canonique sans créer de doublon', () => {
    const state = baseState();
    const event = {
        id: 'coach-trust-test',
        title: 'Une discussion importante',
        description: 'Marc Delmas te demande de lui faire confiance.',
        choices: [{
            text: 'Écouter le conseil',
            impacts: { relationCoach: 10, mental: 1 },
            opinionChange: 'Fier',
            response: 'Marc Delmas apprécie que tu l’écoutes.'
        }]
    };

    const result = CoachSystem.resolveCoachChoice(state, 0, event);

    assert.equal(state.careerMemory.length, 1);
    const memory = state.careerMemory[0];
    assert.equal(memory.id, result.memoryId);
    assert.equal(memory.type, 'coach-choice');
    assert.equal(memory.source, 'Coach');
    assert.equal(memory.eventId, 'coach-trust-test');
    assert.equal(memory.coachName, 'Marc Delmas');
    assert.equal(memory.choiceText, 'Écouter le conseil');
    assert.equal(memory.relationIntent, 10);
});

test('un souvenir coach reste discret en formation mais peut revenir plus tard chez les pros', () => {
    const state = baseState({
        player: { age: 20, careerStage: 'professional', squadStatus: 'first team', stats: { matchesPlayed: 12, relationCoach: 50 } }
    });
    CoachSystem.resolveCoachChoice(state, 0, {
        id: 'coach-first-friction',
        title: 'Premier désaccord',
        description: 'Le ton monte après la séance.',
        choices: [{
            text: 'Lui rejeter la faute',
            impacts: { relationCoach: -12, discipline: -4 },
            opinionChange: 'Déçu',
            response: 'Marc Delmas n’apprécie pas ta réponse.'
        }]
    });

    const output = new NarrativeEngine().processBlock({
        state,
        report: { summary: { matchResults: [] } },
        resolved: {
            coachEvent: {
                id: 'coach-follow-up',
                title: 'Marc Delmas te reprend à part',
                description: 'À la fin de la séance, le coach te fait signe de rester.'
            }
        }
    });

    const beat = output.primaryScene.beats[0];
    assert.equal(beat.callbackMemoryId, state.careerMemory[0].id);
    assert.match(beat.text, /première tension/i);
    assert.match(beat.text, /Lui rejeter la faute/);
    assert.match(beat.text, /n’a pas oublié/i);
    assert.doesNotMatch(beat.text, /votre premier|votre précédente/i);
});

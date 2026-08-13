import test from 'node:test';
import assert from 'node:assert/strict';
import { CoachSystem } from '../../domain/coach/coachSystem.js';

function makeState(player = {}) {
    return {
        player: { id:'youth-player', age:15, careerStage:'youth', squadStatus:'U15', club:'Club Formation', fitness:90, stats:{ relationCoach:52 }, ...player },
        social: { formativeCoach:'Coach Martin', youthClubName:'Club Formation', coachData:{ name:'Coach Martin', relation:52, opinion:'Neutre', hasLeftClub:false } },
        career: { seed:'coach-youth-seed' },
        calendar: { currentSeason:2026, currentMonth:9 },
        careerMemory: []
    };
}

function getEvent(state) {
    const original = Math.random;
    Math.random = () => 0.1;
    try { return CoachSystem.checkCoachInteraction(state); }
    finally { Math.random = original; }
}

test('un coach U15 reste personnel et simple', () => {
    const event = getEvent(makeState());
    assert.ok(event);
    assert.match(event.id, /^coach_youth_/);
    assert.ok(event.description.split(/\s+/).length <= 20);
    assert.doesNotMatch(event.description, /tableau|vidéo|placement|hiérarchie|concurrence|demi-espace|bloc adverse/i);
    assert.ok(event.choices.length <= 2);
});

test('un jeune déjà professionnel garde les échanges seniors', () => {
    const event = getEvent(makeState({ age:17, careerStage:'professional', squadStatus:'first team' }));
    assert.ok(event);
    assert.doesNotMatch(event.id, /^coach_youth_/);
});

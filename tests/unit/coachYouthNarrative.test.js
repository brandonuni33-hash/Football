import test from 'node:test';
import assert from 'node:assert/strict';
import { CoachSystem } from '../../domain/coach/coachSystem.js';

function makeState(player = {}) {
    return {
        player: { id:'youth-player', age:15, careerStage:'youth', squadStatus:'U15', club:'Club Formation', fitness:90, stats:{ relationCoach:52 }, ...player },
        social: { formativeCoach:'Coach Martin', youthClubName:'Club Formation', coachData:{ name:'Coach Martin', relation:52, opinion:'Neutre', hasLeftClub:false, seasonsTogether:1, youthPhase:'observing', youthInteractionCount:0 } },
        career: { seed:'coach-youth-seed' },
        calendar: { currentSeasonYear:2026, currentMonth:9 },
        careerMemory: []
    };
}

function getEvent(state) {
    const original = Math.random;
    Math.random = () => 0.1;
    try { return CoachSystem.checkCoachInteraction(state); }
    finally { Math.random = original; }
}

function resolvePhase(state,{phase,count,relation,seasons=1}){
    Object.assign(state.social.coachData,{youthPhase:phase,youthInteractionCount:count,relation,seasonsTogether:seasons});
    state.player.stats.relationCoach=relation;
    return CoachSystem.resolveCoachChoice(state,0,{id:'coach_youth_touch',youthCoach:true,coachPhase:phase,title:'Le coach te regarde',description:'Il te remarque.',choices:[{text:'Écouter',impacts:{relationCoach:0},response:'Tu écoutes.'}]});
}

test('un coach U15 reste personnel et simple', () => {
    const event = getEvent(makeState());
    assert.ok(event);
    assert.match(event.id, /^coach_youth_/);
    assert.equal(event.youthCoach,true);
    assert.equal(event.coachPhase,'observing');
    assert.ok(event.description.split(/\s+/).length <= 20);
    assert.doesNotMatch(event.description, /tableau|vidéo|placement|hiérarchie|concurrence|demi-espace|bloc adverse/i);
    assert.ok(event.choices.length <= 2);
});

test('la relation de formation progresse de observation à joueur remarqué',()=>{
    const current=makeState();
    const result=resolvePhase(current,{phase:'observing',count:1,relation:56});
    assert.equal(current.social.coachData.youthPhase,'noticed');
    assert.equal(result.coachPhaseChanged,true);
    assert.match(result.responseText,/repéré quelque chose/i);
});

test('le coach commence ensuite à suivre personnellement le joueur',()=>{
    const current=makeState();
    const result=resolvePhase(current,{phase:'noticed',count:3,relation:66});
    assert.equal(current.social.coachData.youthPhase,'developing');
    assert.equal(result.coachPhaseChanged,true);
    assert.match(result.responseText,/plus personnellement/i);
});

test('le mentorat demande du temps ensemble et une confiance forte',()=>{
    const current=makeState();
    const result=resolvePhase(current,{phase:'developing',count:5,relation:76,seasons:2});
    assert.equal(current.social.coachData.youthPhase,'mentor');
    assert.equal(result.coachPhaseChanged,true);
    assert.equal(CoachSystem.getCoachData(current).isMentor,true);
    assert.match(result.responseText,/sous son aile/i);
});

test('un jeune déjà professionnel garde les échanges seniors', () => {
    const event = getEvent(makeState({ age:17, careerStage:'professional', squadStatus:'first team' }));
    assert.ok(event);
    assert.doesNotMatch(event.id, /^coach_youth_/);
});

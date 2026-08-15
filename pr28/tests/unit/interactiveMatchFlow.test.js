import test from 'node:test';
import assert from 'node:assert/strict';
import { startInteractiveMatch,advanceInteractiveMatch } from '../../domain/match/interactiveMatchController.js';

function withRandom(values, callback) {
    const original = Math.random;
    let index = 0;
    Math.random = () => values[index++ % values.length] ?? .5;
    try { return callback(); } finally { Math.random = original; }
}
function state() { return { player:{id:'p1',name:'Alex',age:24,club:'Paris',position:'BU',overall:72,fitness:90,morale:60,mental:65,attributes:{controle:70,dribble:72,tir:73,passe:66,vitesse:76,puissance:68},stats:{relationCoach:70}},social:{coachData:{name:'Coach Rivera'}},career:{balance:0},consequences:[],careerMemory:[] }; }
function fixture() { return { id:'match-flow',competitionName:'Ligue 1',competitionType:'league',type:'league',opponent:'Lyon',home:true,opponentStrength:70,playerSelection:{selected:true,started:true,minutes:90} }; }

test('le match jouable commence directement par une décision puis suit les conséquences', () => withRandom(Array(100).fill(.3), () => {
    const current=state(),session=startInteractiveMatch(current,fixture(),0),phases=[];
    let output={session,step:session.step};
    let guard=0;
    while(!output.finished&&guard++<80){
        phases.push(output.step?.phase);
        output=output.step?.kind==='decision'?advanceInteractiveMatch(current,session,{choiceIndex:0}):advanceInteractiveMatch(current,session);
    }
    assert.ok(!phases.includes('pre_match'));
    assert.ok(!phases.includes('kickoff'));
    assert.match(phases[0], /^moment_/);
    assert.ok(phases.some(phase=>String(phase).startsWith('moment_')));
    assert.ok(phases.some(phase=>String(phase).startsWith('consequence_')));
    assert.ok(phases.includes('full_time_sequence'));
    assert.ok(phases.includes('final_whistle'));
    assert.ok(phases.includes('reactions'));
}));

test('le résultat final reste cohérent avec les contributions et les réactions', () => withRandom(Array(100).fill(.2), () => {
    const current = state();
    const session = startInteractiveMatch(current, fixture(), 2);
    advanceInteractiveMatch(current, session);
    let output = advanceInteractiveMatch(current, session);
    while (!session.result) {
        if (output.step?.kind === 'decision') output = advanceInteractiveMatch(current, session, { choiceIndex: 0 });
        else output = advanceInteractiveMatch(current, session);
    }
    const result = session.result;
    assert.ok(result);
    assert.equal(result.interactiveFlowVersion, 5);
    assert.equal(result.decisions.length, session.moments.length);
    assert.equal(result.goalEvents.length, result.teamGoals + result.opponentGoals);
    assert.ok(result.teamGoals >= result.goals + result.assists);
    assert.equal(result.score.home, result.teamGoals);
    assert.equal(result.postMatchReactions.length, 3);
    assert.match(result.postMatchReactions[1].text, /Coach Rivera/);
}));

test('une étape automatique ne choisit jamais une décision à la place du joueur', () => {
    const current=state(),session=startInteractiveMatch(current,fixture(),0);
    let output={step:session.step};
    assert.equal(output.step.kind,'decision');
    const count=session.decisions.length;
    output=advanceInteractiveMatch(current,session);
    assert.equal(output.step.kind,'decision');
    assert.equal(session.decisions.length,count);
});

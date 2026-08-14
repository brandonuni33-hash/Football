import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpponentGoalPresentations,exposeOpponentScoreChange } from '../../domain/match/opponentGoalPresentationSystem.js';

function session(extra={}){return{id:'match-opponent-goal',home:true,team:'FC Test',opponent:'Adversaire',competition:'Ligue 1',score:{home:1,away:1},currentMoment:1,moments:[25,61],step:{id:'resume',kind:'narration',phase:'match_continues',minute:61,title:'Le match continue',text:'Le jeu reprend.'},goalPresentationQueue:[],...extra};}

test('aucun écran n’est créé si le score adverse n’a pas bougé',()=>{
 const s=session();
 assert.deepEqual(buildOpponentGoalPresentations(s,1),[]);
 const result={finished:false,session:s,step:s.step};
 assert.equal(exposeOpponentScoreChange(s,result,1),result);
});

test('un vrai but adverse devient une présentation avec le score canonique',()=>{
 const s=session({score:{home:1,away:2}});
 const items=buildOpponentGoalPresentations(s,1);
 assert.equal(items.length,1);
 assert.equal(items[0].opponentGoal,true);
 assert.deepEqual(items[0].score,{home:1,away:2});
 assert.equal(items[0].matchId,s.id);
});

test('le but adverse interrompt manuellement la reprise sans modifier le score',()=>{
 const s=session({score:{home:1,away:2}}),resume=s.step;
 const result=exposeOpponentScoreChange(s,{finished:false,session:s,step:s.step},1);
 assert.equal(result.finished,false);
 assert.equal(result.step.kind,'goal');
 assert.equal(result.step.label,'⚽ BUT ADVERSE');
 assert.equal(result.step.goal.opponentGoal,true);
 assert.deepEqual(result.step.score,{home:1,away:2});
 assert.equal(s.runtimeResumeStep,resume);
 assert.deepEqual(s.score,{home:1,away:2});
});

test('si un but de ton équipe est déjà affiché, le but adverse attend dans la file',()=>{
 const s=session({score:{home:2,away:2},step:{id:'own-goal',kind:'goal',phase:'goal',minute:61},goalPresentationQueue:[]});
 const current=s.step;
 const result=exposeOpponentScoreChange(s,{finished:false,session:s,step:current},1);
 assert.equal(result.step,current);
 assert.equal(s.goalPresentationQueue.length,1);
 assert.equal(s.goalPresentationQueue[0].opponentGoal,true);
});

test('en U15 la réaction reste au bord du terrain et ne transforme pas le match en grand stade',()=>{
 const s=session({competition:'Championnat U15',playerAge:15,score:{home:0,away:1}});
 const [item]=buildOpponentGoalPresentations(s,0);
 assert.match(`${item.celebration} ${item.stadiumReaction}`,/terrain|ligne|groupe/i);
 assert.doesNotMatch(`${item.celebration} ${item.stadiumReaction}`,/tribunes se lèvent|stade explose/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextualFlowMoment,enrichMatchFlowStep } from '../../domain/match/matchFlowExperienceSystem.js';

function session(position='MC',competition='Ligue 1',extra={}){return{id:'flow-session',playerPosition:position,competition,match:{id:'flow-fixture',competitionName:competition},home:true,score:{home:1,away:1},currentMoment:1,moments:[24,58,79],modifiers:{fatigue:2},events:[],directOpponent:{playerDuelsWon:0,opponentDuelsWon:0},...extra};}
function state(position='MC'){return{player:{position}};}

test('la transition dépend du métier du poste',()=>{
 const step={phase:'match_continues',minute:58,title:'Le match reste ouvert',text:'Texte générique'};
 const mc=buildContextualFlowMoment(state('MC'),session('MC'),step);
 const ag=buildContextualFlowMoment(state('AG'),session('AG'),step);
 assert.notEqual(mc.text,ag.text);
 assert.match(mc.text,/milieu|ligne|ballon|zone|vis-à-vis|possession|disponible/i);
 assert.match(ag.text,/latéral|ligne|large|transversale|vis-à-vis|appel/i);
});

test('le score change la manière de raconter le même poste',()=>{
 const step={phase:'match_continues',minute:72};
 const leading=buildContextualFlowMoment(state('MOC'),session('MOC','Ligue 1',{score:{home:2,away:0}}),step);
 const trailing=buildContextualFlowMoment(state('MOC'),session('MOC','Ligue 1',{score:{home:0,away:2}}),step);
 assert.notEqual(leading.text,trailing.text);
 assert.notEqual(leading.title,trailing.title);
});

test('la mémoire du duel peut revenir naturellement dans la transition',()=>{
 const s=session('AG','Ligue 1',{events:[{title:'Le duel tourne pour toi',text:'Ton vis-à-vis doit se retourner.',minute:52}],directOpponent:{playerDuelsWon:2,opponentDuelsWon:0}});
 const flow=buildContextualFlowMoment(state('AG'),s,{phase:'match_continues',minute:61});
 assert.match(flow.text,/vis-à-vis|adversaire direct|latéral|distance|duel|recul/i);
});

test('une scène U15 reste au bord du terrain et sans grand stade',()=>{
 const s=session('MC','Championnat U15',{playerAge:15,unexpectedContext:{id:'crowd_surge',text:'fallback'}});
 const step={phase:'unexpected_event',minute:48,text:'fallback'};
 const enriched=enrichMatchFlowStep(state('MC'),s,step);
 assert.match(enriched.text,/parents|ligne|coach|terrain/i);
 assert.doesNotMatch(enriched.text,/stade explose|tribunes se lèvent|médias/i);
});

test('un temps faible raconte aussi le travail sans ballon selon le poste',()=>{
 const s=session('BU','Ligue 1',{unexpectedContext:{id:'tempo_drop',text:'fallback'}});
 const enriched=enrichMatchFlowStep(state('BU'),s,{phase:'unexpected_event',minute:64,text:'fallback'});
 assert.match(enriched.text,/touches très peu|centraux|bloc|ballon/i);
});

test('les phases qui ne sont pas des respirations ne sont jamais réécrites',()=>{
 const s=session('MC');
 const step={phase:'goal',kind:'goal',text:'BUT',title:'BUT !'};
 assert.equal(enrichMatchFlowStep(state('MC'),s,step),step);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isProfessionalMatch, professionalNarrativeMode, enrichProfessionalStep, enrichProfessionalOutcome, applyProfessionalResultMemory } from '../../domain/match/proMatchExperienceSystem.js';

function session(competition='Ligue 1', extra={}){
  return {id:'pro-layer-test',competition,home:true,playerPosition:'MOC',score:{home:0,away:0},match:{competitionName:competition},modifiers:{fatigue:0},events:[],directOpponent:{playerDuelsWon:0,opponentDuelsWon:0},...extra};
}

test('la couche riche est coupée pour toutes les compétitions jeunes',()=>{
  const state={player:{careerStage:'pro',squadStatus:'first_team',position:'MOC'}};
  for(const name of ['UEFA Youth League','Coupe du Monde U20','Championnat National U15','Académie U19']){
    assert.equal(isProfessionalMatch(state,session(name)),false,name);
  }
});

test('un vrai match senior active la couche pro même pour un jeune qui débute tôt',()=>{
  const state={player:{age:17,careerStage:'pro',squadStatus:'first_team',position:'MOC'}};
  assert.equal(isProfessionalMatch(state,session('Ligue 1')),true);
});

test('un match jeune ne reçoit ni consigne pro ni temps faible enrichi',()=>{
  const state={player:{careerStage:'youth',position:'MOC'}};
  const s=session('UEFA Youth League');
  const step={phase:'kickoff',kind:'narration',text:'Le match commence.'};
  assert.equal(enrichProfessionalStep(state,s,step),step);
  assert.equal(s.proExperience,undefined);
});

test('l’avant-match pro reçoit un détail de football concret sans créer de choix',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session();
  const original={phase:'pre_match',kind:'narration',text:'Le vestiaire se prépare.',choices:[]};
  const enriched=enrichProfessionalStep(state,s,original);
  assert.ok(enriched.text.length>original.text.length);
  assert.deepEqual(enriched.choices,[]);
  assert.match(enriched.text,/pressing|tableau|recevoir|milieu/i);
});

test('le coup d’envoi pro reçoit une consigne courte du coach',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session();
  const step=enrichProfessionalStep(state,s,{phase:'kickoff',kind:'narration',text:'Le match commence.'});
  assert.match(step.text,/coach|consigne/i);
  assert.ok(s.proExperience.coachInstruction);
});

test('les quatre modes gardent le silence quand aucun contexte ne mérite une intervention',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session('Ligue 1',{score:{home:2,away:0},modifiers:{fatigue:1}});
  assert.equal(professionalNarrativeMode(state,s,{phase:'match_continues',kind:'narration',minute:44,text:'Le match continue.'}),'silent');
  assert.equal(professionalNarrativeMode(state,s,{phase:'moment_1',kind:'decision',minute:44,text:'Tu reçois.'}),'decision');
});

test('les décisions pro construisent une mémoire de séquence sans changer les choix',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session();
  const choices=[{text:'A'},{text:'B'},{text:'C'}];
  const step={phase:'moment_1',kind:'decision',minute:72,text:'Tu reçois entre les lignes.',description:'Tu reçois entre les lignes.',choices};
  const enriched=enrichProfessionalStep(state,s,step);
  assert.equal(enriched.choices,choices);
  assert.equal(enriched.choices.length,3);
  assert.equal(s.proExperience.sequence,1);
  assert.ok(enriched.text.length>step.text.length);
});

test('la profondeur pro tient compte du duel, de la fatigue et évite les répétitions immédiates',()=>{
  const state={player:{careerStage:'pro',position:'AG'}};
  const s=session('Premier League',{playerPosition:'AG',score:{home:1,away:1},modifiers:{fatigue:8},directOpponent:{playerDuelsWon:3,opponentDuelsWon:1}});
  const first=enrichProfessionalStep(state,s,{phase:'moment_1',kind:'decision',minute:76,text:'Tu reçois côté gauche.',description:'Tu reçois côté gauche.',choices:[{text:'A'},{text:'B'}]});
  const second=enrichProfessionalStep(state,s,{phase:'moment_2',kind:'decision',minute:84,text:'Tu reçois encore.',description:'Tu reçois encore.',choices:[{text:'A'},{text:'B'}]});
  assert.match(first.text,/vis-à-vis|latéral|neuf|milieu|jambes|cuisses|souffle/i);
  assert.notEqual(first.text,second.text);
  assert.ok(s.proExperience.recentLines.length>0);
  assert.ok(s.proExperience.recentThemes.length>0);
});

test('un échec pro peut garder la pression sans inventer un but ou un carton',()=>{
  const state={player:{careerStage:'pro',position:'AG'}};
  const s=session('Premier League',{playerPosition:'AG'});
  const event={minute:68,title:'L’occasion se referme',text:'Le défenseur revient et l’occasion disparaît.',choice:'Crochet'};
  const enriched=enrichProfessionalOutcome(state,s,event);
  assert.equal(enriched.secondaryOutcome,'retained_pressure');
  assert.doesNotMatch(enriched.text,/but|carton|penalty/i);
});

test('la mémoire de résultat pro ne conserve que des repères issus des faits du match',()=>{
  const state={player:{careerStage:'pro',position:'AG'}};
  const s=session('Ligue 1',{opponent:'Rival FC',events:[{minute:88,isGoalOpportunity:true,gesture:'Petit pont',text:'Une dernière occasion.'}],directOpponent:{playerDuelsWon:4,opponentDuelsWon:1}});
  s.proExperience={version:2,sequence:2,recentThemes:['coach','sequence'],recentLines:[],coachInstruction:'Fixe-le avant de partir.',bodyWarnings:0,lastBodyMinute:null,lastInterventionMinute:88,signatureCandidates:[]};
  const result={matchId:'m-pro',opponent:'Rival FC',competitionName:'Ligue 1',result:'win',score:{home:2,away:1},rating:8.1,goals:1,assists:0,goalEvents:[{minute:54}],events:s.events,directOpponent:s.directOpponent};
  applyProfessionalResultMemory(state,s,result);
  assert.equal(result.professionalMatchLayer,true);
  assert.ok(result.signatureMoments.length>=1);
  assert.ok(result.signatureMoments.length<=3);
  assert.deepEqual(result.proNarrativeMemory.score,{home:2,away:1});
  assert.equal(result.proNarrativeMemory.goals,1);
  assert.equal(result.proNarrativeMemory.coachInstruction,'Fixe-le avant de partir.');
  assert.ok(result.proNarrativeMemory.signatureMoments.every(item=>['late_pressure','signature_gesture','goal_memory','duel_dominance'].includes(item.kind)));
});

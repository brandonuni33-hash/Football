import test from 'node:test';
import assert from 'node:assert/strict';
import { isProfessionalMatch, enrichProfessionalStep, enrichProfessionalOutcome, applyProfessionalResultMemory } from '../../domain/match/proMatchExperienceSystem.js';

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

test('le coup d’envoi pro reçoit une consigne courte du coach',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session();
  const step=enrichProfessionalStep(state,s,{phase:'kickoff',kind:'narration',text:'Le match commence.'});
  assert.match(step.text,/coach|consigne/i);
  assert.ok(s.proExperience.coachInstruction);
});

test('les décisions pro construisent une mémoire de séquence sans changer les choix',()=>{
  const state={player:{careerStage:'pro',position:'MOC'}};
  const s=session();
  const step={phase:'decision',kind:'decision',minute:72,text:'Tu reçois entre les lignes.',description:'Tu reçois entre les lignes.',choices:[{text:'A'},{text:'B'},{text:'C'}]};
  const enriched=enrichProfessionalStep(state,s,step);
  assert.equal(enriched.choices.length,3);
  assert.equal(s.proExperience.sequence,1);
  assert.ok(enriched.text.length>step.text.length);
});

test('un échec pro peut garder la pression sans inventer un but ou un carton',()=>{
  const state={player:{careerStage:'pro',position:'AG'}};
  const s=session('Premier League',{playerPosition:'AG'});
  const event={minute:68,title:'L’occasion se referme',text:'Le défenseur revient et l’occasion disparaît.',choice:'Crochet'};
  const enriched=enrichProfessionalOutcome(state,s,event);
  assert.equal(enriched.secondaryOutcome,'retained_pressure');
  assert.doesNotMatch(enriched.text,/but|carton|penalty/i);
});

test('les moments signatures ne sont enregistrés que sur un match pro',()=>{
  const state={player:{careerStage:'pro',position:'AG'}};
  const s=session('Ligue 1',{events:[{minute:88,isGoalOpportunity:true,gesture:'Petit pont',text:'Une dernière occasion.'}],directOpponent:{playerDuelsWon:4,opponentDuelsWon:1}});
  const result={matchId:'m-pro',events:s.events,directOpponent:s.directOpponent};
  applyProfessionalResultMemory(state,s,result);
  assert.equal(result.professionalMatchLayer,true);
  assert.ok(result.signatureMoments.length>=1);
  assert.ok(result.signatureMoments.length<=3);
});

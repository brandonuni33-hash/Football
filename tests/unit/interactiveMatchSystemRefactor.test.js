import test from 'node:test';
import assert from 'node:assert/strict';
import { startInteractiveMatch,advanceInteractiveMatch } from '../../domain/match/interactiveMatchSystem.js';
import { ageAppropriateMatchPresentation,choicePresentation,matchPresentationTier } from '../../ui/interactiveMatchFlowController.js';

function state(position='MC',stage='pro'){
 return{player:{id:'p-refactor',firstname:'Noa',lastname:'Test',club:'FC Test',position,overall:74,careerStage:stage,squadStatus:stage==='pro'?'first_team':'academy',origin:'STREET',mental:70,morale:70,fitness:92,attributes:{controle:78,dribble:78,tir:71,passe:79},stats:{},hidden:{},temporaryEffects:[]},career:{balance:0},social:{},consequences:[],careerMemory:[]};
}
function fixture(id,competition='Ligue 1'){return{id,competitionName:competition,competition,opponent:'Adversaire',home:true,importance:'normal',playerSelection:{started:true,minutes:90},minutes:90};}
function reachDecision(st,session){let result={finished:false,session,step:session.step};for(let guard=0;guard<12&&session.step?.kind!=='decision'&&!session.finished;guard++)result=advanceInteractiveMatch(st,session,{});return result;}
const wordCount=value=>String(value||'').trim().split(/\s+/).filter(Boolean).length;
function presentationDecision(extra={}){return{phase:'moment_1',kind:'decision',label:'MOMENT 1/1',minute:47,competition:'Championnat National U15',home:true,score:{home:0,away:0},title:"47' · Ton duel commence vraiment",text:'À la 47e, tu décroches pour recevoir puis te retournes dans le mouvement. Ton vis-à-vis doit pivoter, un second défenseur hésite à sortir et un coéquipier attaque déjà la profondeur. Pendant une seconde, trois solutions existent en même temps.',choices:[{text:'Prendre l’appel dans son dos'},{text:'Décrocher pour l’attirer puis repartir'},{text:'Venir au contact, protéger puis remettre'}],...extra};}
function u15State(position='BU'){return{player:{age:15,position,careerStage:'youth',squadStatus:'academy'}};}

test('le manager réellement utilisé par l UI applique le rythme pro enrichi',()=>{
 const st=state('MC','pro'),session=startInteractiveMatch(st,fixture('runtime-pro-rhythm'),0);
 assert.equal(session.professionalRhythm,true);
 assert.ok(session.moments.length>=3&&session.moments.length<=4);
});

test('le runtime jouable peut réellement servir une scène MID à un MC',()=>{
 let found=false;
 for(let i=0;i<40&&!found;i++){
  const st=state('MC','pro'),session=startInteractiveMatch(st,fixture(`runtime-mid-${i}`),0);
  const result=reachDecision(st,session);
  const id=result.session?.decision?.opportunityId||session.decision?.opportunityId||'';
  if(/^MID-/.test(id))found=true;
 }
 assert.equal(found,true);
});

test('le runtime jouable peut réellement servir une scène WNG à un ailier',()=>{
 let found=false;
 for(let i=0;i<40&&!found;i++){
  const st=state('AG','pro'),session=startInteractiveMatch(st,fixture(`runtime-wing-${i}`),0);
  const result=reachDecision(st,session);
  const id=result.session?.decision?.opportunityId||session.decision?.opportunityId||'';
  if(/^WNG-/.test(id))found=true;
 }
 assert.equal(found,true);
});

test('une compétition jeune ne reçoit pas artificiellement le rythme pro',()=>{
 const st=state('MC','youth'),session=startInteractiveMatch(st,fixture('runtime-youth','Championnat National U15'),0);
 assert.notEqual(session.professionalRhythm,true);
 assert.ok(session.moments.length>=1&&session.moments.length<=2);
});

test('un but adverse canonique devient une étape manuelle dans le manager jouable',()=>{
 const oldRandom=Math.random;Math.random=()=>0;
 try{
  const st=state('BU','pro'),session=startInteractiveMatch(st,fixture('runtime-opponent-goal'),0);
  let sawOpponentGoal=false;
  for(let guard=0;guard<80&&!session.finished;guard++){
   const action=session.step?.kind==='decision'?{choiceIndex:0}:{};
   const result=advanceInteractiveMatch(st,session,action);
   if(result.step?.label==='⚽ BUT ADVERSE'){
    sawOpponentGoal=true;
    assert.equal(result.step.goal.opponentGoal,true);
    assert.ok(Number(result.step.score.away)>0);
    break;
   }
  }
  assert.equal(sawOpponentGoal,true);
 }finally{Math.random=oldRandom;}
});

test('un match U15 simplifie fortement la lecture du moment',()=>{
 const shown=ageAppropriateMatchPresentation(presentationDecision(),u15State('BU'));
 assert.equal(shown.presentationTier,'u15');
 assert.equal(shown.label,'À TOI');
 assert.equal(shown.title,'Un espace dans son dos');
 assert.ok(wordCount(shown.text)<=18);
 assert.doesNotMatch(shown.text,/rapport de force|demi-espace|entre les lignes|profondeur|pivoter|fixer/i);
});

test('les choix U15 deviennent courts et visuels sans toucher au choix canonique',()=>{
 const raw=presentationDecision(),shown=ageAppropriateMatchPresentation(raw,u15State('BU'));
 assert.deepEqual(shown.choices.map(choice=>choice.text),raw.choices.map(choice=>choice.text));
 assert.deepEqual(shown.choices.map(choice=>choice.displayTitle),['Partir dans son dos','L’attirer vers toi','Protéger le ballon']);
 assert.ok(shown.choices.every(choice=>choice.displayIcon&&choice.displaySubtitle));
});

test('un U17 garde davantage de détail mais pas un paragraphe tactique',()=>{
 const st={player:{age:17,position:'MC',careerStage:'youth',squadStatus:'academy'}};
 const shown=ageAppropriateMatchPresentation(presentationDecision({competition:'Championnat National U17'}),st);
 assert.equal(shown.presentationTier,'youth');
 assert.ok(wordCount(shown.text)<=38);
 assert.doesNotMatch(shown.title,/^47'/);
});

test('un joueur de 17 ans réellement en Ligue 1 garde la profondeur pro',()=>{
 const st={player:{age:17,position:'MOC',careerStage:'pro',squadStatus:'first_team',contract:{type:'professional'}}};
 const raw=presentationDecision({competition:'Ligue 1',title:"47' · Le rapport de force a changé",text:'Texte tactique professionnel conservé pour ce niveau.'});
 assert.equal(matchPresentationTier(st,raw),'pro');
 const shown=ageAppropriateMatchPresentation(raw,st);
 assert.equal(shown.text,raw.text);
 assert.equal(shown.title,raw.title);
});

test('une respiration U15 raconte du football simple',()=>{
 const raw={phase:'match_continues',kind:'narration',minute:62,competition:'Championnat National U15',home:true,score:{home:1,away:1},title:'Les distances changent',text:'Tu changes de hauteur entre deux possessions et ton vis-à-vis doit choisir ce qu’il abandonne.',choices:[]};
 const shown=ageAppropriateMatchPresentation(raw,u15State('MC'));
 assert.equal(shown.title,'Le jeu continue');
 assert.match(shown.text,/milieu|replaces|ballon/i);
 assert.doesNotMatch(shown.text,/vis-à-vis|hauteur|possessions|abandonne/i);
});

test('les choix pros gagnent un repère visuel sans perdre leur précision',()=>{
 const choice={text:'Fixer jusqu’au dernier instant avant de choisir',gesture:'Feinte de corps'};
 const shown=choicePresentation(choice,'pro');
 assert.equal(shown.displayTitle,choice.text);
 assert.equal(shown.displaySubtitle,'Feinte de corps');
 assert.ok(shown.displayIcon);
});

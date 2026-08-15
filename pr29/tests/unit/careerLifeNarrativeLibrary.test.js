import test from 'node:test';
import assert from 'node:assert/strict';
import { MEDIA_DILEMMAS, familyEventText, mediaPostText, stableCareerPick } from '../../domain/narrative/careerLifeNarrativeLibrary.js';
import { MediaSystem } from '../../domain/media/mediaSystem.js';
import { FamilyLifeSystem } from '../../domain/family/familyLifeSystem.js';
import { CoachSystem } from '../../domain/coach/coachSystem.js';

test('les variantes carrière sont stables pour un même contexte',()=>{
  const pool=['a','b','c','d'];
  assert.equal(stableCareerPick('seed','same',pool),stableCareerPick('seed','same',pool));
});

test('les médias racontent différemment un doublé et un mauvais match',()=>{
  const big=mediaPostText({seed:'p1',key:'m1',name:'Alex Test',goals:2,rating:8});
  const poor=mediaPostText({seed:'p1',key:'m2',name:'Alex Test',goals:0,assists:0,rating:5.1});
  assert.match(big,/2 buts|frappe fort|Difficile d'ignorer|circuler son nom/i);
  assert.match(poor,/compliquée|retrait|oublier|peser|sans relief/i);
  assert.notEqual(big,poor);
});

test('les dilemmes médias incluent une réponse narrative aux choix',()=>{
  assert.ok(MEDIA_DILEMMAS.length>=4);
  for(const dilemma of MEDIA_DILEMMAS) for(const choice of dilemma.choices) assert.ok(choice.response?.length>20);
});

test('une naissance produit un texte intime distinct du football',()=>{
  const text=familyEventText({seed:'family-1',event:'birth',name:'Lucas'});
  assert.match(text,/Lucas/);
  assert.match(text,/naître|naissance|téléphone|main|important/i);
  assert.doesNotMatch(text,/score|but|passe décisive|entraînement/i);
});

test('un événement familial conserve sa narration dans la mémoire',()=>{
  const system=new FamilyLifeSystem();
  const state={player:{id:'p1'},family:{members:[],children:[],events:[],couples:[]},relationships:{}};
  const couple=system.createCouple({state,playerId:'p1',partnerId:'p2',relationshipId:null});
  const event=system.applyEvent({state,couple,event:'separation',context:{careerPressure:80}});
  assert.ok(event.narrativeText);
  assert.match(event.narrativeText,/discussion|conversation|séparation|fissur|décision|deux/i);
});

test('le coach peut créer une scène de tension lorsque la relation est basse',()=>{
  const old=Math.random; Math.random=()=>0.1;
  try{
    const state={player:{id:'p1',club:'Club A',origin:'academy',fitness:90,stats:{relationCoach:25}},social:{youthClubName:'Club A',coachData:{name:'Coach Martin',relation:25,opinion:'Déçu',hasLeftClub:false}},careerMemory:[],calendar:{currentMonth:4,currentSeason:1}};
    const seen=new Set();
    for(let i=0;i<8;i++){ const event=CoachSystem.checkCoachInteraction(state); if(event)seen.add(event.id); state.calendar.currentMonth+=1; }
    assert.ok(seen.has('coach_tension'));
  }finally{Math.random=old;}
});

test('les médias restent muets avant les pros puis utilisent la bibliothèque après',()=>{
  const media=new MediaSystem();
  const youth={player:{id:'p1',firstname:'Alex',lastname:'Test',age:16,squadStatus:'En formation',careerStage:'youth',stats:{matchesPlayed:5}},calendar:{currentMonth:2},media:media.initMediaData()};
  assert.equal(media.generatePostAfterBlock(youth,{competitionName:'Championnat National U17',goals:2,rating:8}).post,null);
  const pro={player:{id:'p1',firstname:'Alex',lastname:'Test',age:21,squadStatus:'Équipe première',careerStage:'pro',stats:{matchesPlayed:1}},calendar:{currentMonth:3,currentSeason:1},media:media.initMediaData()};
  const result=media.generatePostAfterBlock(pro,{competitionName:'Ligue 1',goals:1,assists:1,rating:8});
  assert.ok(result.post?.content);
  assert.match(result.post.content,/Alex Test/);
});

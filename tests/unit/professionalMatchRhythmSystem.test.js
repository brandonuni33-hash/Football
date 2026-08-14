import test from 'node:test';
import assert from 'node:assert/strict';
import { professionalDecisionMoments,applyProfessionalMatchRhythm } from '../../domain/match/professionalMatchRhythmSystem.js';

function session(competition='Ligue 1',extra={}){return{id:'rhythm-test',competition,type:'normal',importance:'normal',match:{id:'fixture-rhythm',competitionName:competition,playerSelection:{started:true,minutes:90}},moments:[30,60],...extra};}

test('les compétitions jeunes gardent le rythme de base',()=>{
 const state={player:{careerStage:'pro',squadStatus:'first_team'}};
 const s=session('UEFA Youth League');
 assert.equal(professionalDecisionMoments(state,s),null);
 applyProfessionalMatchRhythm(state,s);
 assert.deepEqual(s.moments,[30,60]);
 assert.equal(s.professionalRhythm,undefined);
});

test('un match pro normal reçoit trois ou quatre moments jouables',()=>{
 const state={player:{careerStage:'pro',position:'MOC'}};
 const s=session('Ligue 1');
 const moments=professionalDecisionMoments(state,s);
 assert.ok(moments.length>=3&&moments.length<=4);
 assert.ok(moments.every((minute,index)=>minute>=10&&minute<=86&&(index===0||minute>moments[index-1])));
});

test('une grosse affiche pro ouvre davantage de séquences',()=>{
 const state={player:{careerStage:'pro',position:'AG'}};
 const s=session('Champions League',{type:'final',importance:'exceptional'});
 const moments=professionalDecisionMoments(state,s);
 assert.ok(moments.length>=5&&moments.length<=6);
});

test('un remplaçant pro ne reçoit que des moments dans son temps réellement joué',()=>{
 const state={player:{careerStage:'pro',position:'MC'}};
 const s=session('Ligue 1',{match:{id:'fixture-sub',competitionName:'Ligue 1',playerSelection:{started:false,minutes:25}},moments:[75]});
 const moments=professionalDecisionMoments(state,s);
 assert.ok(moments.length>=2&&moments.length<=4);
 assert.ok(moments.every(minute=>minute>=68&&minute<=88));
});

test('le rythme pro est déterministe pour le même match',()=>{
 const state={player:{careerStage:'pro',position:'MOC'}};
 const a=professionalDecisionMoments(state,session('Ligue 1'));
 const b=professionalDecisionMoments(state,session('Ligue 1'));
 assert.deepEqual(a,b);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { MIDFIELD_PLAY_OPPORTUNITIES,isExclusiveMidfieldPosition,selectMidfieldPlayOpportunity,buildMidfieldPlayDecision } from '../../domain/match/midfieldPlayOpportunityLibrary.js';

test('la bibliothèque contient exactement 60 occasions de jeu MC MOC',()=>{
 assert.equal(MIDFIELD_PLAY_OPPORTUNITIES.length,60);
 assert.equal(new Set(MIDFIELD_PLAY_OPPORTUNITIES.map(x=>x.id)).size,60);
 assert.deepEqual(MIDFIELD_PLAY_OPPORTUNITIES.map(x=>x.id),Array.from({length:60},(_,i)=>`MID-${String(i+1).padStart(3,'0')}`));
 for(const item of MIDFIELD_PLAY_OPPORTUNITIES){assert.deepEqual(item.positions,['MC','MOC']);assert.equal(item.choices.length,3);assert.ok(item.description.length>30);assert.ok(new Set(item.choices.map(c=>c.style)).size>=2);}
});

test('la sélection est strictement réservée aux MC et MOC',()=>{
 assert.equal(isExclusiveMidfieldPosition('MC'),true);assert.equal(isExclusiveMidfieldPosition('MOC'),true);
 for(const position of ['BU','AD','AG','DC','DG','DD','GK'])assert.equal(selectMidfieldPlayOpportunity({seed:'x',position,minute:50}),null);
 assert.ok(selectMidfieldPlayOpportunity({seed:'mc',position:'MC',minute:50}));
 assert.ok(selectMidfieldPlayOpportunity({seed:'moc',position:'MOC',minute:50}));
});

test('une décision de milieu conserve le scénario et trois choix',()=>{
 const source=MIDFIELD_PLAY_OPPORTUNITIES[20];const d=buildMidfieldPlayDecision(source,{minute:63});
 assert.equal(d.opportunityId,'MID-021');assert.match(d.title,/63'/);assert.equal(d.choices.length,3);assert.ok(d.choices.every(c=>c.isMidfieldPlay));
});

test('les scènes contextuelles restent verrouillées hors contexte',()=>{
 const ordinary=Array.from({length:200},(_,i)=>selectMidfieldPlayOpportunity({seed:`ordinary-${i}`,index:i,position:'MC',minute:70,scoreFor:1,scoreAgainst:1,fatigue:20})).filter(Boolean);
 assert.ok(ordinary.every(x=>!x.extraTimeOnly&&!x.requiresFatigue&&!x.requiresLead&&!x.requiresTrailing&&!x.requiresCoachSignal&&!x.requiresPreviousMistake&&!x.requiresPlaymakingMomentum));
});

test('la prolongation ouvre bien la scène spécifique MID-059 dans le pool éligible',()=>{
 const eligible=MIDFIELD_PLAY_OPPORTUNITIES.find(x=>x.id==='MID-059');assert.ok(eligible.extraTimeOnly);assert.ok(eligible.requiresFatigue);
 const seen=Array.from({length:1000},(_,i)=>selectMidfieldPlayOpportunity({seed:`extra-${i}`,index:i,position:'MOC',minute:108,scoreFor:2,scoreAgainst:2,fatigue:80,extraTime:true})).filter(Boolean);
 assert.ok(seen.some(x=>x.id==='MID-059'));
});

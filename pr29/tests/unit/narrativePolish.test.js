import test from 'node:test';
import assert from 'node:assert/strict';
import { NarrativePresenter } from '../../application/narrativePresenter.js';
import { MediaSystem } from '../../domain/media/mediaSystem.js';
import { MatchChoiceManager } from '../../domain/match/matchChoiceManager.js';
import { CoachSystem } from '../../domain/coach/coachSystem.js';

test('le journal reste chronologique du haut vers le bas',()=>{
  const presenter=new NarrativePresenter();
  const state={narrativeState:{journalEntries:[
    {id:'first',title:'Premier pas',text:'Début'},
    {id:'second',title:'Deuxième étape',text:'Suite'}
  ]}};
  assert.deepEqual(presenter.getJournal(state).map(item=>item.id),['first','second']);
});

test('la presse ne publie rien avant une première apparition professionnelle',()=>{
  const media=new MediaSystem();
  const state={
    player:{id:'p1',firstname:'Alex',lastname:'Test',squadStatus:'En formation',stats:{matchesPlayed:4}},
    calendar:{currentMonth:9},
    media:media.initMediaData()
  };
  const result=media.generatePostAfterBlock(state,{matchesPlayed:1,goals:2,rating:8});
  assert.equal(result.post,null);
  assert.equal(state.media.feed.length,0);
  assert.equal(state.media.followers,0);
});

test('les choix de match sont adaptés au poste',()=>{
  const old=Math.random; Math.random=()=>0;
  try{
    const gk=MatchChoiceManager.getMatchDilemma('classic','Rival','GK');
    const defender=MatchChoiceManager.getMatchDilemma('classic','Rival','DC');
    const midfielder=MatchChoiceManager.getMatchDilemma('classic','Rival','MC');
    const attacker=MatchChoiceManager.getMatchDilemma('classic','Rival','BU');
    assert.match(gk.title,/surface|relance/i);
    assert.match(defender.title,/attaquant|relance/i);
    assert.match(midfielder.title,/espace|tempo/i);
    assert.match(attacker.title,/défense|dos au but/i);
    assert.notEqual(gk.choices[0].text,attacker.choices[0].text);
  }finally{Math.random=old;}
});

test('le coach évite de répéter immédiatement le même échange',()=>{
  const old=Math.random; Math.random=()=>0.1;
  try{
    const state={
      player:{id:'p1',club:'Club A',origin:'academy',fitness:90,stats:{relationCoach:50}},
      social:{youthClubName:'Club A',coachData:{name:'Coach Martin',relation:50,opinion:'Neutre',hasLeftClub:false}},
      careerMemory:[{type:'coach-choice',eventId:'coach_role_detail',source:'Coach'}]
    };
    const event=CoachSystem.checkCoachInteraction(state);
    assert.ok(event);
    assert.notEqual(event.id,'coach_role_detail');
  }finally{Math.random=old;}
});

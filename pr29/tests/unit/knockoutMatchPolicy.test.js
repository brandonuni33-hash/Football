import test from 'node:test';
import assert from 'node:assert/strict';
import { isKnockoutMatch, tieBreakerRules, resolveKnockoutTie } from '../../domain/match/knockoutMatchPolicy.js';
import { youthLeagueEligible, u20WorldCupEligible, buildYouthLeagueFixtures, buildU20WorldCupFixtures } from '../../domain/competition/youthTournamentSystem.js';

test('league matches never allow extra time or penalties', () => {
  const match={type:'league',competitionType:'league',phase:'season'};
  assert.equal(isKnockoutMatch(match),false);
  assert.deepEqual(tieBreakerRules(match),{eligible:false,extraTime:false,penalties:false,maxMinutes:90});
  const resolved=resolveKnockoutTie({match,teamGoals:1,opponentGoals:1,seed:'league-draw'});
  assert.equal(resolved.wentToExtraTime,false);
  assert.equal(resolved.wentToPenalties,false);
  assert.equal(resolved.teamGoals,1);
  assert.equal(resolved.opponentGoals,1);
});

test('group and league phases never allow a tiebreak even in tournaments', () => {
  for(const match of [
    {type:'international',phase:'group',round:'Phase de groupes',requiresWinner:true},
    {type:'continental_youth',phase:'league_phase',round:'Phase de ligue',requiresWinner:true},
    {type:'international_youth',phase:'group_stage',round:'Phase de groupes'}
  ]){
    assert.equal(tieBreakerRules(match).eligible,false);
  }
});

test('knockout tie is resolved after 90 minutes and can reach a shootout', () => {
  const match={id:'cup-r16',type:'cup',phase:'knockout',round:'Huitièmes de finale',requiresWinner:true};
  const rules=tieBreakerRules(match);
  assert.equal(rules.eligible,true);
  assert.equal(rules.extraTime,true);
  assert.equal(rules.penalties,true);
  let foundShootout=null;
  for(let i=0;i<200&&!foundShootout;i++){
    const result=resolveKnockoutTie({match,teamGoals:1,opponentGoals:1,seed:`tie-${i}`});
    assert.equal(result.wentToExtraTime,true);
    if(result.wentToPenalties)foundShootout=result;
  }
  assert.ok(foundShootout,'at least one deterministic seed should reach penalties');
  assert.notEqual(foundShootout.penaltyScore.team,foundShootout.penaltyScore.opponent);
});

test('Youth League eligibility is restricted to eligible European youth players', () => {
  assert.equal(youthLeagueEligible({age:17,clubCountry:'France',clubLevel:1}),true);
  assert.equal(youthLeagueEligible({age:15,clubCountry:'France',clubLevel:1}),false);
  assert.equal(youthLeagueEligible({age:17,clubCountry:'Brésil',clubLevel:1}),false);
  const fixtures=buildYouthLeagueFixtures({age:17,clubCountry:'France',clubLevel:1,club:'Paris'} ,2027);
  assert.ok(fixtures.some(match=>match.phase==='league_phase'));
  const knockout=fixtures.find(match=>match.phase==='knockout');
  assert.ok(knockout?.requiresWinner);
  assert.equal(tieBreakerRules(fixtures[0]).eligible,false);
  assert.equal(tieBreakerRules(knockout).eligible,true);
});

test('U20 World Cup is age-limited, biennial, with group draws allowed', () => {
  const player={age:19,country:'France'};
  assert.equal(u20WorldCupEligible(player,2027),true);
  assert.equal(u20WorldCupEligible(player,2028),false);
  assert.equal(u20WorldCupEligible({age:21,country:'France'},2027),false);
  const fixtures=buildU20WorldCupFixtures(player,2027);
  assert.equal(fixtures.filter(match=>match.phase==='group').length,3);
  assert.equal(tieBreakerRules(fixtures.find(match=>match.phase==='group')).eligible,false);
  assert.equal(tieBreakerRules(fixtures.find(match=>match.phase==='knockout')).eligible,true);
});

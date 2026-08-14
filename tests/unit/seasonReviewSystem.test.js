import test from 'node:test';
import assert from 'node:assert/strict';
import SeasonSystem from '../../domain/career/seasonSystem.js';
import CalendarSystem from '../../domain/calendar/calendarSystem.js';
import { recordClubSeasonResults, evaluateClubSeasonObjective } from '../../domain/career/clubSeasonObjectiveSystem.js';

function state(){return{
  player:{id:'p1',club:'Club Formation',clubPrestige:50,age:15,overall:61,isYouthPlayer:true,fitness:83,stats:{matchesPlayed:18,starts:15,goals:7,assists:5,averageRating:7.2,relationCoach:68}},
  calendar:{currentSeasonYear:2026,currentMonth:7,currentPeriod:'Fin de saison',seasonSchedule:{}},
  career:{seasonHistory:[]},
  social:{youthClubName:'Club Formation',coachData:{name:'Coach Martin',relation:68,hasLeftClub:false,seasonsTogether:1,youthPhase:'noticed'}},
  cups:{},cupHistory:[]
};}

const report={summary:{matchResults:[
  {fixture:{id:'m1'},teamGoals:2,opponentGoals:0},
  {fixture:{id:'m2'},teamGoals:1,opponentGoals:1},
  {fixture:{id:'m3'},teamGoals:0,opponentGoals:1}
]}};

test('les résultats du club évaluent un objectif sans inventer de classement',()=>{
  const current=state();
  recordClubSeasonResults(current,report);
  recordClubSeasonResults(current,report);
  const objective=evaluateClubSeasonObjective(current);
  assert.equal(objective.matches,3);
  assert.equal(objective.wins,1);
  assert.equal(objective.draws,1);
  assert.equal(objective.losses,1);
  assert.equal(objective.pointsPerMatch,1.33);
  assert.equal(objective.status,'reached');
});

test('la fin de saison fige les chiffres avant reset et les conserve dans seasonHistory',()=>{
  const current=state();
  recordClubSeasonResults(current,report);
  const system=new SeasonSystem({
    playerLogic:{ensure:()=>{}},
    potentialSystem:{finalizeSeason:()=>({}),advanceAge:player=>{player.age+=1;}},
    careerSystem:{refreshStage:()=>{}},
    cupSystem:{finalizeSeason:()=>[]},
    worldSystem:{getClub:()=>null,CLUB_DATABASE:[],normalizeCareerClub:()=>({strength:70})},
    awardsSystem:{finalizeSeason:()=>null}
  });
  const result=system.finalize(current);
  assert.equal(result.seasonSummary.seasonLabel,'2026/2027');
  assert.equal(result.seasonSummary.matches,18);
  assert.equal(result.seasonSummary.goals,7);
  assert.equal(result.seasonSummary.assists,5);
  assert.equal(result.seasonSummary.averageRating,7.2);
  assert.equal(result.seasonSummary.clubObjective.status,'reached');
  assert.equal(current.career.seasonHistory.length,1);
  assert.deepEqual(current.career.seasonHistory[0],result.seasonSummary);
  assert.equal(current.player.stats.matchesPlayed,0);
  assert.equal(current.player.stats.goals,0);
  assert.equal(current.social.coachData.seasonsTogether,2);
  assert.equal(current.career.clubSeasonPerformance,undefined);
});

test('le calendrier expose le bilan exactement au passage de saison',()=>{
  const current=state(),summary={seasonLabel:'2026/2027',goals:7,assists:5};
  const calendar=new CalendarSystem({
    worldSystem:{isOffSeason:()=>true,finalizeSeason:()=>null,resetSeasonTables:()=>{}},
    competitionSystem:{getPeriodName:()=> 'Pré-saison',ensureSeasonSchedule:()=>{}},
    seasonReset:()=>({seasonSummary:summary}),
    familySystem:{advanceSeason:()=>{}}
  });
  const result=calendar.advance(current);
  assert.equal(result.seasonChanged,true);
  assert.deepEqual(result.seasonSummary,summary);
  assert.equal(result.year,2027);
});

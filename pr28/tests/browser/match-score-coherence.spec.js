import { test, expect } from '@playwright/test';

test('score et contributions proviennent de deux événements distincts, même à la même minute', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const {
      appendGoalEvent, deriveGoalSummary, scoreAfterGoal,
      GOAL_ACTOR_TYPE, GOAL_TEAM_SIDE, PLAYER_GOAL_CONTRIBUTION
    } = await import('/domain/match/goalEventResolver.js');
    const session = { id:'browser-same-minute', home:true, playerId:'p1', goalEvents:[], score:{home:0,away:0} };
    const player = { actorType:GOAL_ACTOR_TYPE.PLAYER, actorId:'p1', displayName:'Alex' };
    const teammate = { actorType:GOAL_ACTOR_TYPE.TEAMMATE, actorId:'mate', displayName:'Sam' };
    const opponent = { actorType:GOAL_ACTOR_TYPE.OPPONENT, actorId:'opp', displayName:'Rival' };
    const first = appendGoalEvent(session,{minute:90,teamSide:GOAL_TEAM_SIDE.PLAYER,scorer:player,assist:teammate,source:{type:'INTERACTIVE_DECISION'},playerContribution:PLAYER_GOAL_CONTRIBUTION.GOAL});
    const second = appendGoalEvent(session,{minute:90,teamSide:GOAL_TEAM_SIDE.OPPONENT,scorer:opponent,source:{type:'BACKGROUND_SIMULATION'}});
    return {
      ids:session.goalEvents.map(event=>event.id),
      minutes:session.goalEvents.map(event=>event.minute),
      scores:session.goalEvents.map(event=>scoreAfterGoal(session.goalEvents,event.id,{home:true})),
      summary:deriveGoalSummary(session.goalEvents,{home:true,playerId:'p1'}),
      firstId:first.id,
      secondId:second.id
    };
  });

  expect(result.firstId).not.toBe(result.secondId);
  expect(new Set(result.ids).size).toBe(2);
  expect(result.minutes).toEqual([90,90]);
  expect(result.scores).toEqual([{home:1,away:0},{home:1,away:1}]);
  expect(result.summary).toEqual({score:{home:1,away:1},teamGoals:1,opponentGoals:1,goals:1,assists:0,result:'draw'});
});

test('le récapitulatif affiche discrètement buts et passes décisives', async ({ page }) => {
  await page.goto('/index.html');

  const result = await page.evaluate(async () => {
    const { BlockResultController } = await import('/ui/blockResultController.js');
    const controller = new BlockResultController({ renderDashboard() {} }, {});
    controller.showNarrativeScene({
      title: 'Récapitulatif',
      importance: 'normal',
      beats: [],
      matches: [{
        opponent: 'Club Test', competition: 'Championnat', score: '2-1',
        goals: 1, assists: 1, playerPlayed: true, started: true,
        impactLabel: 'Impact décisif', appearanceLabel: 'Titulaire · 90 min'
      }]
    });
    const root = document.querySelector('[data-narrative-scene]');
    const contribution = root?.querySelector('[data-player-contributions]');
    return { text: contribution?.textContent?.replace(/\s+/g, ' ').trim() || '' };
  });

  expect(result.text).toContain('⚽ 1');
  expect(result.text).toContain('🎯 1');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { GOAL_OPPORTUNITY_CHOICES, buildGoalOpportunityDecision } from '../../domain/match/goalOpportunityChoiceLibrary.js';
import { buildPositionPlayDecision } from '../../domain/match/positionPlayDecisionSystem.js';
import { choicePresentation } from '../../ui/interactiveMatchFlowController.js';

const penalty = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-014');

test('un penalty normal expose exactement trois choix de frappe vivants',()=>{
  assert.ok(penalty);
  const decision=buildGoalOpportunityDecision(penalty,{minute:47});
  assert.equal(decision.isPenalty,true);
  assert.equal(decision.choices.length,3);
  const displayed=decision.choices.map(choice=>choicePresentation(choice,'u15'));
  assert.deepEqual(displayed.map(choice=>choice.displayTitle),['Plein axe','Choisir un coin','Piquer au milieu']);
  assert.deepEqual(displayed.map(choice=>choice.displaySubtitle),['Assumer la puissance','Privilégier la précision','Prendre le gardien à contretemps']);
  assert.equal(displayed.some(choice=>/centrer|protéger|contrôle orienté/i.test(`${choice.displayTitle} ${choice.displaySubtitle}`)),false);
  assert.equal(displayed.some(choice=>/faire ton choix/i.test(choice.displaySubtitle)),false);
});

test('la couche de jeu par poste ne remplace jamais un penalty',()=>{
  const current=buildGoalOpportunityDecision(penalty,{minute:47});
  const session={id:'penalty-match',currentMoment:0,score:{home:0,away:0},home:false,decision:{minute:47},events:[]};
  const replacement=buildPositionPlayDecision({player:{age:20,position:'MOC',careerStage:'professional'}},session,current);
  assert.equal(replacement,null);
});

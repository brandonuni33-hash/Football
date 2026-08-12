import test from 'node:test';
import assert from 'node:assert/strict';
import { GOAL_OPPORTUNITY_CHOICES, buildGoalOpportunityDecision, selectGoalOpportunity } from '../../domain/match/goalOpportunityChoiceLibrary.js';

test('goal opportunity catalog contains 40 authored scenarios with exactly three choices', () => {
  assert.equal(GOAL_OPPORTUNITY_CHOICES.length, 40);
  assert.equal(new Set(GOAL_OPPORTUNITY_CHOICES.map(item => item.id)).size, 40);
  for (const item of GOAL_OPPORTUNITY_CHOICES) {
    assert.match(item.id, /^OCC-0\d\d$/);
    assert.ok(item.title.length > 3);
    assert.ok(item.description.length > 20);
    assert.equal(item.choices.length, 3);
    assert.ok(new Set(item.choices.map(choice => choice.style)).size >= 2);
  }
});

test('goal opportunity selector never gives a scoring scenario to a goalkeeper', () => {
  for (let index = 0; index < 50; index += 1) assert.equal(selectGoalOpportunity({ seed:`keeper-${index}`, index, minute:60, position:'GK' }), null);
});

test('goal opportunity selector can surface attacking opportunities', () => {
  const found = Array.from({ length:100 }, (_, index) => selectGoalOpportunity({ seed:`attacker-${index}`, index, minute:55, position:'BU', scoreFor:1, scoreAgainst:1 })).filter(Boolean);
  assert.ok(found.length > 20);
});

test('playable goal decision keeps authored scenario text', () => {
  const source = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-005');
  const decision = buildGoalOpportunityDecision(source, { minute:63 });
  assert.equal(decision.opportunityId, 'OCC-005');
  assert.match(decision.title, /63'/);
  assert.match(decision.description, /un seul défenseur/);
  assert.equal(decision.choices.length, 3);
});

test('last-minute scenario stays youth-safe', () => {
  const scenario = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-009');
  assert.ok(!scenario.description.toLowerCase().includes('stade'));
  assert.ok(!scenario.description.toLowerCase().includes('tribune'));
  assert.match(scenario.description, /Autour du terrain/);
});

test('OCC-040 exists as the dedicated shootout choice', () => {
  const scenario=GOAL_OPPORTUNITY_CHOICES.find(item=>item.id==='OCC-040');
  assert.ok(scenario);
  assert.equal(scenario.choices.length,3);
  assert.ok(scenario.choices.some(choice=>/Panenka|petit pont/i.test(choice.text)));
});

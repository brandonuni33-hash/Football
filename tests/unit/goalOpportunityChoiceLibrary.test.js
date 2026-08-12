import { describe, expect, it } from 'vitest';
import { GOAL_OPPORTUNITY_CHOICES, buildGoalOpportunityDecision, selectGoalOpportunity, countGoalOpportunities } from '../../domain/match/goalOpportunityChoiceLibrary.js';

describe('goalOpportunityChoiceLibrary', () => {
  it('contains the 40 authored goal opportunities with exactly three choices each', () => {
    expect(countGoalOpportunities()).toBe(40);
    expect(GOAL_OPPORTUNITY_CHOICES).toHaveLength(40);
    expect(new Set(GOAL_OPPORTUNITY_CHOICES.map(item => item.id)).size).toBe(40);
    expect(GOAL_OPPORTUNITY_CHOICES[0].id).toBe('OCC-001');
    expect(GOAL_OPPORTUNITY_CHOICES.at(-1).id).toBe('OCC-040');
    for (const item of GOAL_OPPORTUNITY_CHOICES) {
      expect(item.id).toMatch(/^OCC-0\d\d$/);
      expect(item.title.length).toBeGreaterThan(3);
      expect(item.description.length).toBeGreaterThan(20);
      expect(item.choices).toHaveLength(3);
      expect(new Set(item.choices.map(choice => choice.style)).size).toBeGreaterThanOrEqual(2);
    }
  });

  it('never gives a scoring-choice scenario to a goalkeeper', () => {
    for (let index = 0; index < 50; index += 1) {
      expect(selectGoalOpportunity({ seed: `keeper-${index}`, index, minute: 60, position: 'GK' })).toBeNull();
    }
  });

  it('can surface opportunities for attacking players', () => {
    const found = Array.from({ length: 100 }, (_, index) => selectGoalOpportunity({
      seed: `attacker-${index}`, index, minute: 55, position: 'BU', scoreFor: 1, scoreAgainst: 1
    })).filter(Boolean);
    expect(found.length).toBeGreaterThan(20);
  });

  it('keeps the authored scenario text when building the playable decision', () => {
    const source = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-033');
    const decision = buildGoalOpportunityDecision(source, { minute: 63 });
    expect(decision.opportunityId).toBe('OCC-033');
    expect(decision.title).toContain("63'");
    expect(decision.description).toContain('trois attaquants');
    expect(decision.choices).toHaveLength(3);
  });

  it('does not use pro-stadium wording in the last-minute scenario', () => {
    const scenario = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-009');
    expect(scenario.description.toLowerCase()).not.toContain('stade');
    expect(scenario.description.toLowerCase()).not.toContain('tribune');
    expect(scenario.description).toContain('Autour du terrain');
  });

  it('keeps context-only scenarios out when their context is absent', () => {
    const wet = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-023');
    const corner = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-031');
    const shootout = GOAL_OPPORTUNITY_CHOICES.find(item => item.id === 'OCC-040');
    expect(wet.requiresWetPitch).toBe(true);
    expect(corner.requiresSetPieceTaker).toBe(true);
    expect(shootout.shootoutOnly).toBe(true);

    const normalResults = Array.from({ length: 500 }, (_, index) => selectGoalOpportunity({
      seed: `normal-${index}`, index, minute: 70, position: 'BU', scoreFor: 1, scoreAgainst: 1
    })).filter(Boolean).map(item => item.id);
    expect(normalResults).not.toContain('OCC-023');
    expect(normalResults).not.toContain('OCC-031');
    expect(normalResults).not.toContain('OCC-040');
  });
});

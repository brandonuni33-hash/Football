// Street to Pro — catalogue unifié des occasions de but jouables.
// Les bibliothèques sont découpées par blocs de 20 pour pouvoir monter proprement jusqu'à OCC-200.

import { GOAL_OPPORTUNITY_CHOICES_V1 } from './goalOpportunityChoiceLibraryV1.js';
import { GOAL_OPPORTUNITY_CHOICES_V2 } from './goalOpportunityChoiceLibraryV2.js';

export const GOAL_OPPORTUNITY_CHOICES = Object.freeze([
  ...GOAL_OPPORTUNITY_CHOICES_V1,
  ...GOAL_OPPORTUNITY_CHOICES_V2
]);

function hashIndex(seed, max) {
  let hash = 2166136261;
  for (const char of String(seed || 'goal-opportunity')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return max ? (hash >>> 0) % max : 0;
}

export function goalOpportunityPositionGroup(position = '') {
  const value = String(position || '').toUpperCase();
  if (['GK','GB','G','GARDIEN','GOALKEEPER'].includes(value)) return 'goalkeeper';
  if (['DC','CB','DD','RB','DG','LB','D','DÉFENSEUR','DEFENSEUR','LATÉRAL','LATERAL'].includes(value)) return 'defender';
  if (['MC','CM','MOC','CAM','MD','MG','M','MDC','CDM','MILIEU','MILIEU RELAYEUR'].includes(value)) return 'midfielder';
  if (['AD','RW','AG','LW','AILIER'].includes(value)) return 'winger';
  return 'attacker';
}

function chanceForGroup(group) {
  if (group === 'attacker' || group === 'winger') return 72;
  if (group === 'midfielder') return 52;
  if (group === 'defender') return 24;
  return 0;
}

function contextAllows(item, context) {
  const { minute, scoreFor, scoreAgainst, fatigue, directOpponent, wetPitch, setPieceTaker, shootout } = context;
  if (item.minMinute && minute < item.minMinute) return false;
  if (item.requiresDraw && scoreFor !== scoreAgainst) return false;
  if (item.requiresFatigue && Number(fatigue || 0) < 55) return false;
  if (item.requiresWetPitch && wetPitch !== true) return false;
  if (item.requiresSetPieceTaker && setPieceTaker !== true) return false;
  if (item.shootoutOnly && shootout !== true) return false;
  if (!item.shootoutOnly && shootout === true) return false;
  if (item.requiresDuelAdvantage) {
    const won = Number(directOpponent?.playerDuelsWon || 0);
    const lost = Number(directOpponent?.opponentDuelsWon || 0);
    if (!(won >= 1 && won > lost)) return false;
  }
  return true;
}

export function selectGoalOpportunity({
  seed,
  index = 0,
  minute = 0,
  position = '',
  scoreFor = 0,
  scoreAgainst = 0,
  fatigue = 0,
  directOpponent = null,
  wetPitch = false,
  setPieceTaker = false,
  shootout = false
} = {}) {
  const group = goalOpportunityPositionGroup(position);
  const trigger = hashIndex(`${seed}:${index}:trigger`, 100);
  if (trigger >= chanceForGroup(group)) return null;

  const context = { minute, scoreFor, scoreAgainst, fatigue, directOpponent, wetPitch, setPieceTaker, shootout };
  const candidates = GOAL_OPPORTUNITY_CHOICES.filter(item => item.groups.includes(group) && contextAllows(item, context));
  if (!candidates.length) return null;

  const weighted = [];
  for (const item of candidates) {
    for (let i = 0; i < Number(item.weight || 1); i += 1) weighted.push(item);
  }
  return weighted[hashIndex(`${seed}:${index}:${minute}:occasion`, weighted.length)] || null;
}

export function buildGoalOpportunityDecision(opportunity, { minute = 0 } = {}) {
  if (!opportunity) return null;
  return {
    opportunityId: opportunity.id,
    title: `${minute}' · ${opportunity.title}`,
    description: opportunity.description,
    choices: opportunity.choices.map(item => ({ ...item, opportunityId: opportunity.id }))
  };
}

export function countGoalOpportunities() {
  return GOAL_OPPORTUNITY_CHOICES.length;
}

export default { GOAL_OPPORTUNITY_CHOICES, selectGoalOpportunity, buildGoalOpportunityDecision, goalOpportunityPositionGroup, countGoalOpportunities };

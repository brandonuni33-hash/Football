// Street to Pro — catalogue unifié des occasions de but jouables.
// Les bibliothèques sont découpées par blocs de 20 pour pouvoir monter proprement jusqu'à OCC-200.

import { GOAL_OPPORTUNITY_CHOICES_V1 } from './goalOpportunityChoiceLibraryV1.js';
import { GOAL_OPPORTUNITY_CHOICES_V2 } from './goalOpportunityChoiceLibraryV2.js';
import { GOAL_OPPORTUNITY_CHOICES_V3 } from './goalOpportunityChoiceLibraryV3.js';
import { GOAL_OPPORTUNITY_CHOICES_V4 } from './goalOpportunityChoiceLibraryV4.js';
import { GOAL_OPPORTUNITY_CHOICES_V5 } from './goalOpportunityChoiceLibraryV5.js';
import { GOAL_OPPORTUNITY_CHOICES_V6 } from './goalOpportunityChoiceLibraryV6.js';

export const GOAL_OPPORTUNITY_CHOICES = Object.freeze([
  ...GOAL_OPPORTUNITY_CHOICES_V1,
  ...GOAL_OPPORTUNITY_CHOICES_V2,
  ...GOAL_OPPORTUNITY_CHOICES_V3,
  ...GOAL_OPPORTUNITY_CHOICES_V4,
  ...GOAL_OPPORTUNITY_CHOICES_V5,
  ...GOAL_OPPORTUNITY_CHOICES_V6
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

const SPECIAL_REQUIREMENTS = new Set([
  'requiresDraw','requiresFatigue','requiresWetPitch','requiresSetPieceTaker','requiresDuelAdvantage'
]);

function genericRequirementKey(requirement) {
  const suffix = requirement.slice('requires'.length);
  return suffix ? suffix[0].toLowerCase() + suffix.slice(1) : '';
}

function contextAllows(item, context) {
  const { minute, scoreFor, scoreAgainst, fatigue, directOpponent, wetPitch, setPieceTaker, shootout } = context;
  if (item.minMinute && minute < item.minMinute) return false;
  if (item.maxMinute && minute > item.maxMinute) return false;
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
  // Les scènes liées à un fait précis (recruteur connu, retour de suspension,
  // prolongation, consigne coach, etc.) restent invisibles tant que ce fait
  // n'est pas fourni par l'état canonique. On n'invente jamais le contexte.
  for (const [key, required] of Object.entries(item)) {
    if (!required || !/^requires[A-Z]/.test(key) || SPECIAL_REQUIREMENTS.has(key)) continue;
    const contextKey = genericRequirementKey(key);
    if (context[contextKey] !== true) return false;
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
  shootout = false,
  ...contextSignals
} = {}) {
  const group = goalOpportunityPositionGroup(position);
  const trigger = hashIndex(`${seed}:${index}:trigger`, 100);
  if (trigger >= chanceForGroup(group)) return null;

  const context = { minute, scoreFor, scoreAgainst, fatigue, directOpponent, wetPitch, setPieceTaker, shootout, ...contextSignals };
  const candidates = GOAL_OPPORTUNITY_CHOICES.filter(item => item.groups.includes(group) && contextAllows(item, context));
  if (!candidates.length) return null;

  const weighted = [];
  for (const item of candidates) {
    for (let i = 0; i < Number(item.weight || 1); i += 1) weighted.push(item);
  }
  return weighted[hashIndex(`${seed}:${index}:${minute}:occasion`, weighted.length)] || null;
}

function presentedOpportunityChoices(opportunity) {
  const source = opportunity.choices || [];
  if (opportunity.id !== 'OCC-014' || source.length < 3) return source.map(item => ({ ...item, opportunityId: opportunity.id }));
  return [
    { ...source[0], text:'Frapper fort plein axe', gesture:'Plein axe', opportunityId:opportunity.id, displayTitle:'Plein axe', displaySubtitle:'Assumer la puissance', displayIcon:'◎', displayTone:'attack' },
    { ...source[1], text:'Placer dans un coin', gesture:'Contre-pied', opportunityId:opportunity.id, displayTitle:'Choisir un coin', displaySubtitle:'Privilégier la précision', displayIcon:'◉', displayTone:'control' },
    { ...source[2], text:'Piquer doucement au milieu', gesture:'Ballon piqué', opportunityId:opportunity.id, displayTitle:'Piquer au milieu', displaySubtitle:'Prendre le gardien à contretemps', displayIcon:'⌁', displayTone:'technical' }
  ];
}

export function buildGoalOpportunityDecision(opportunity, { minute = 0 } = {}) {
  if (!opportunity) return null;
  const isPenalty = opportunity.id === 'OCC-014' || opportunity.id === 'OCC-040';
  return {
    opportunityId: opportunity.id,
    title: `${minute}' · ${opportunity.title}`,
    description: opportunity.id === 'OCC-014' ? 'Le ballon est posé. Le gardien bouge sur sa ligne. Tu choisis ta manière de le frapper.' : opportunity.description,
    choices: presentedOpportunityChoices(opportunity),
    isSetPiece:Boolean(opportunity.setPiece || opportunity.shootoutOnly),
    isPenalty,
    shootoutOnly:Boolean(opportunity.shootoutOnly)
  };
}

export function countGoalOpportunities() {
  return GOAL_OPPORTUNITY_CHOICES.length;
}

export default { GOAL_OPPORTUNITY_CHOICES, selectGoalOpportunity, buildGoalOpportunityDecision, goalOpportunityPositionGroup, countGoalOpportunities };

// Street to Pro — règle canonique des prolongations et tirs au but.
// Une égalité ne déclenche JAMAIS de prolongation en championnat ou en phase de ligue/poules.

const GROUP_PHASES = new Set(['group','groups','group_stage','league_phase','league','season','regular_season']);
const KNOCKOUT_WORDS = /knockout|élimination|elimination|huiti|quart|demi|finale|final|playoff|barrage|round of|1\/16|1\/8|1\/4|1\/2/i;

export function isGroupOrLeagueMatch(match = {}) {
  const type = String(match.competitionType || match.type || '').toLowerCase();
  const phase = String(match.phase || match.stage || '').toLowerCase();
  if (type === 'league' || type === 'youth') return !match.knockout;
  return GROUP_PHASES.has(phase) || /phase de (poules|groupes)|phase de ligue/i.test(String(match.round || ''));
}

export function isKnockoutMatch(match = {}) {
  if (!match || isGroupOrLeagueMatch(match)) return false;
  if (match.knockout === true || match.requiresWinner === true) return true;
  const type = String(match.competitionType || match.type || '').toLowerCase();
  const phase = String(match.phase || match.stage || '');
  const round = String(match.round || match.europeanRound || '');
  if (type === 'cup' && !/group|poule|league/i.test(`${phase} ${round}`)) return true;
  return KNOCKOUT_WORDS.test(`${phase} ${round}`);
}

export function tieBreakerRules(match = {}) {
  const eligible = isKnockoutMatch(match);
  return {
    eligible,
    extraTime: eligible && match.extraTime !== false,
    penalties: eligible && match.penalties !== false,
    maxMinutes: eligible && match.extraTime !== false ? 120 : 90
  };
}

function hash(seed) {
  let value = 2166136261;
  for (const char of String(seed || 'tie-break')) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); }
  return value >>> 0;
}

// Résolution déterministe utilisable par les matchs simulés et par le contrôleur interactif.
// Le score à 90 minutes reste conservé dans regulationScore.
export function resolveKnockoutTie({ match = {}, teamGoals = 0, opponentGoals = 0, seed = '', playerEdge = 0 } = {}) {
  const rules = tieBreakerRules(match);
  const regulationScore = { teamGoals: Number(teamGoals) || 0, opponentGoals: Number(opponentGoals) || 0 };
  if (!rules.eligible || regulationScore.teamGoals !== regulationScore.opponentGoals) {
    return { ...regulationScore, regulationScore, wentToExtraTime: false, wentToPenalties: false, penaltyScore: null };
  }

  let own = regulationScore.teamGoals;
  let opp = regulationScore.opponentGoals;
  const h = hash(`${match.id || ''}|${seed}|ET`);
  const ownExtra = ((h % 100) < 31 + Math.max(-12, Math.min(12, Number(playerEdge) || 0))) ? 1 : 0;
  const oppExtra = (((h >>> 8) % 100) < 29) ? 1 : 0;
  own += ownExtra;
  opp += oppExtra;

  if (own !== opp || !rules.penalties) {
    return { teamGoals: own, opponentGoals: opp, regulationScore, wentToExtraTime: true, wentToPenalties: false, penaltyScore: null };
  }

  const shoot = hash(`${match.id || ''}|${seed}|PENS`);
  let ownPens = 3 + (shoot % 3);
  let oppPens = 3 + ((shoot >>> 6) % 3);
  if (ownPens === oppPens) {
    if (((shoot >>> 12) % 100) < 50 + Math.max(-15, Math.min(15, Number(playerEdge) || 0))) ownPens += 1;
    else oppPens += 1;
  }
  return {
    teamGoals: own,
    opponentGoals: opp,
    regulationScore,
    wentToExtraTime: true,
    wentToPenalties: true,
    penaltyScore: { team: ownPens, opponent: oppPens },
    shootoutWinner: ownPens > oppPens ? 'team' : 'opponent'
  };
}

export default { isGroupOrLeagueMatch, isKnockoutMatch, tieBreakerRules, resolveKnockoutTie };

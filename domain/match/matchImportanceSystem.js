// domain/match/matchImportanceSystem.js
// Détermine l'enjeu réel d'une rencontre à partir du contexte de carrière.
// Ce système ne décide pas du résultat : il décide seulement de l'importance et du mode jouable.

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

const LEVELS = Object.freeze([
    { min: 80, level: 'exceptional', playableChance: 1 },
    { min: 60, level: 'major', playableChance: .78 },
    { min: 35, level: 'important', playableChance: .38 },
    { min: 15, level: 'normal', playableChance: .08 },
    { min: 0, level: 'low', playableChance: .02 }
]);

function levelFor(score) { return LEVELS.find(item => score >= item.min) || LEVELS.at(-1); }
function isDerby(match) { return Boolean(match?.isDerby || match?.rival || match?.rivalry || Number(match?.rivalryLevel) > 0); }
function competitionWeight(match) {
    const id = String(match?.competitionId || '').toUpperCase();
    const type = String(match?.competitionType || match?.type || '').toLowerCase();
    if (id.includes('WORLD_CUP') || id.includes('EURO')) return 32;
    if (id.includes('CHAMPIONS_LEAGUE')) return 28;
    if (id.includes('EUROPA_LEAGUE')) return 22;
    if (id.includes('CUP') || type === 'cup') return 16;
    if (type === 'continental') return 20;
    return 5;
}
function roundWeight(match) {
    const text = `${match?.round || ''} ${match?.phase || ''}`.toLowerCase();
    if (text.includes('final')) return 45;
    if (text.includes('demi')) return 34;
    if (text.includes('quart')) return 27;
    if (text.includes('barrage') || text.includes('play')) return 20;
    return 0;
}
function seasonWeight(month) {
    const m = num(month);
    if (m === 5) return 10;
    if (m === 4) return 6;
    return 0;
}
function rivalWeight(match) { return isDerby(match) ? 24 : clamp(num(match?.rivalryLevel), 0, 5) * 4; }
function opponentWeight(match) {
    const strength = num(match?.opponentStrength ?? match?.opponentOverall);
    if (!strength) return 0;
    return clamp((strength - 65) * .55, 0, 18);
}
function tableContext(state, match) {
    const table = state?.world?.standings || state?.standings || state?.leagueTable || state?.competition?.standings;
    if (!Array.isArray(table) || !state?.player) return { score: 0, reason: null };
    const own = table.find(row => row.clubId === state.player.clubId || row.id === state.player.clubId || row.club === state.player.club);
    const opponent = table.find(row => row.clubId === match?.opponentClubId || row.id === match?.opponentClubId || row.club === match?.opponent);
    if (!own || !opponent) return { score: 0, reason: null };
    const ownRank = num(own.rank || own.position);
    const oppRank = num(opponent.rank || opponent.position);
    const pointsGap = Math.abs(num(own.points) - num(opponent.points));
    if ((ownRank && oppRank && Math.abs(ownRank - oppRank) <= 2) || pointsGap <= 4) return { score: 22, reason: 'adversaire_direct' };
    if ((ownRank <= 6 && oppRank <= 6) || (ownRank >= 16 && oppRank >= 16)) return { score: 14, reason: 'course_classement' };
    return { score: 0, reason: null };
}
function playerContext(state, match) {
    const player = state?.player || {};
    let score = 0;
    const reasons = [];
    if (player.heartClub && (match?.opponentClubId === player.heartClub || match?.opponent === player.heartClub)) { score += 14; reasons.push('club_de_coeur'); }
    if (player.previousClubId && match?.opponentClubId === player.previousClubId) { score += 18; reasons.push('ancien_club'); }
    if (player.pendingRecordTarget) { score += 8; reasons.push('record_personnel'); }
    if (num(player.fame) >= 70 || num(player.reputation) >= 75) score += 4;
    return { score, reasons };
}

export function evaluateMatchImportance(state, match, options = {}) {
    const reasons = [];
    const components = {};
    const add = (name, value, reason = null) => { const amount = Math.max(0, num(value)); components[name] = amount; if (reason && amount > 0) reasons.push(reason); return amount; };
    let score = 0;
    score += add('competition', competitionWeight(match), String(match?.competitionId || '').toUpperCase().includes('CHAMPIONS_LEAGUE') ? 'ligue_des_champions' : null);
    score += add('round', roundWeight(match), roundWeight(match) >= 27 ? 'phase_decisive' : null);
    score += add('rivalry', rivalWeight(match), isDerby(match) ? 'rivalite' : null);
    score += add('opponent', opponentWeight(match), opponentWeight(match) >= 10 ? 'adversaire_repute' : null);
    score += add('season', seasonWeight(match?.month), seasonWeight(match?.month) >= 6 ? 'fin_de_saison' : null);
    const table = tableContext(state, match); score += add('table', table.score, table.reason); if (table.reason) reasons.push(table.reason);
    const personal = playerContext(state, match); score += add('career', personal.score); reasons.push(...personal.reasons);
    if (options.forceLevel) score = Math.max(score, LEVELS.find(item => item.level === options.forceLevel)?.min || 0);
    const result = levelFor(clamp(score));
    const playableChance = options.playableChance !== undefined ? clamp(options.playableChance, 0, 1) : result.playableChance;
    const frequencyPenalty = clamp(num(options.playableMatchesInWindow) * .18, 0, .72);
    const adjustedChance = clamp(playableChance * (1 - frequencyPenalty), 0, 1);
    return {
        score: Math.round(clamp(score)),
        level: result.level,
        playableChance: Number(adjustedChance.toFixed(3)),
        playable: options.preview === true ? null : Math.random() < adjustedChance,
        reasons: [...new Set(reasons)],
        components,
        context: { opponent: match?.opponent || null, competition: match?.competitionName || match?.competitionId || null, month: match?.month || null }
    };
}

export const MatchImportanceSystem = Object.freeze({ evaluate: evaluateMatchImportance, levels: LEVELS });
export default MatchImportanceSystem;

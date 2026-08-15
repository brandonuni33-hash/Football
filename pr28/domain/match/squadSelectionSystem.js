// domain/match/squadSelectionSystem.js
// Détermine le statut sportif du joueur et sa sélection pour chaque rencontre.
// Une seule source de vérité pour : Hors groupe, Remplaçant, Rotation,
// Titulaire, Joueur important et Joueur clé.

import { WorldSystem } from '../world/worldSystem.js';

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const SQUAD_STATUSES = Object.freeze([
    'Hors groupe',
    'Remplaçant',
    'Rotation',
    'Titulaire',
    'Joueur important',
    'Joueur clé'
]);

const STATUS_PROFILES = Object.freeze({
    'Hors groupe': { starter: .02, substitute: .08, bench: .35 },
    'Remplaçant': { starter: .12, substitute: .58, bench: .25 },
    'Rotation': { starter: .45, substitute: .40, bench: .12 },
    'Titulaire': { starter: .76, substitute: .18, bench: .05 },
    'Joueur important': { starter: .88, substitute: .10, bench: .02 },
    'Joueur clé': { starter: .95, substitute: .04, bench: .01 }
});

function stableRandom(seedText = '') {
    let h = 2166136261;
    for (const char of String(seedText)) {
        h ^= char.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    h >>>= 0;
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function clubStrength(player) {
    const youthPrestige = n(player?.youthClubData?.prestige || player?.careerProfile?.clubPrestige);
    if (Number(player?.age) < 18 || player?.isYouthPlayer) {
        return clamp(45 + youthPrestige * .30, 48, 74);
    }
    const club = WorldSystem.getClub(player?.clubId || player?.club);
    return clamp(club?.strength || player?.clubStrength || 68, 50, 95);
}

function expectedOverall(player) {
    const strength = clubStrength(player);
    if (Number(player?.age) < 18 || player?.isYouthPlayer) return clamp(strength - 17, 34, 58);
    return clamp(strength - 8, 48, 90);
}

function recentForm(player) {
    const rating = n(player?.stats?.averageRating);
    if (!rating) return 0;
    return clamp((rating - 6.5) * 8, -14, 16);
}

function coachTrust(player) {
    const relation = n(player?.stats?.relationCoach ?? player?.relationCoach ?? 50);
    return clamp((relation - 50) * .16, -8, 8);
}

function contractRoleBias(player) {
    const role = String(player?.contract?.role || player?.contractRole || player?.rolePropose || '').toLowerCase();
    if (role.includes('clé') || role.includes('key')) return 12;
    if (role.includes('important')) return 8;
    if (role.includes('titulaire')) return 5;
    if (role.includes('rotation')) return 0;
    if (role.includes('rempla')) return -5;
    return 0;
}

export function evaluateSquadStatus(state) {
    const player = state?.player;
    if (!player) return { status: 'Hors groupe', score: 0, expectedOverall: 0, clubStrength: 0 };

    const overall = n(player.overall || player.general || 40);
    const expected = expectedOverall(player);
    const youth = Number(player.age) < 18 || player.isYouthPlayer === true;
    const firstProWindow = !youth && Number(player.age) <= 20;

    let score = 50;
    score += (overall - expected) * (youth ? 2.1 : 2.35);
    score += recentForm(player);
    score += coachTrust(player);
    score += contractRoleBias(player);

    // En formation on accorde naturellement davantage de temps de jeu.
    if (youth) score += 8;
    // Au premier contrat pro, la concurrence devient nettement plus forte.
    if (firstProWindow) score -= 6;
    if (player.isInjured) score = 0;

    score = clamp(score, 0, 100);
    let status = 'Hors groupe';
    if (score >= 88) status = 'Joueur clé';
    else if (score >= 76) status = 'Joueur important';
    else if (score >= 62) status = 'Titulaire';
    else if (score >= 48) status = 'Rotation';
    else if (score >= 30) status = 'Remplaçant';

    player.squadStatus = status;
    player.squadStatusScore = Math.round(score);
    return { status, score: Math.round(score), expectedOverall: expected, clubStrength: clubStrength(player) };
}

function appearanceFor(state, fixture, statusInfo) {
    const player = state?.player || {};
    if (player.isInjured) return { appearance: 'out', minutes: 0, selected: false, started: false };

    const profile = { ...(STATUS_PROFILES[statusInfo.status] || STATUS_PROFILES['Remplaçant']) };
    const youth = Number(player.age) < 18 || player.isYouthPlayer === true;
    if (youth) {
        profile.starter = clamp(profile.starter + .08, 0, .98);
        profile.substitute = clamp(profile.substitute + .04, 0, 1 - profile.starter);
        profile.bench = clamp(profile.bench, 0, 1 - profile.starter - profile.substitute);
    }

    const roll = stableRandom(`${player.id || player.firstname || 'player'}|${fixture?.id || fixture?.opponent || 'match'}|selection`);
    const minuteRoll = stableRandom(`${fixture?.id || fixture?.opponent || 'match'}|${player.id || 'player'}|minutes`);

    if (roll < profile.starter) {
        return { appearance: 'starter', minutes: Math.round(68 + minuteRoll * 22), selected: true, started: true };
    }
    if (roll < profile.starter + profile.substitute) {
        return { appearance: 'substitute', minutes: Math.round(15 + minuteRoll * 25), selected: true, started: false };
    }
    if (roll < profile.starter + profile.substitute + profile.bench) {
        return { appearance: 'bench', minutes: 0, selected: false, started: false };
    }
    return { appearance: 'out', minutes: 0, selected: false, started: false };
}

export function buildSquadSelectionPlan(state, fixtures = []) {
    const matches = Array.isArray(fixtures) ? fixtures : [];
    const statusInfo = evaluateSquadStatus(state);
    const key = `${state?.calendar?.currentSeasonYear ?? 'season'}:${state?.calendar?.currentMonth ?? 'month'}:${matches.length}`;
    const entries = matches.map((fixture, matchIndex) => ({
        matchIndex,
        fixture,
        ...appearanceFor(state, fixture, statusInfo)
    }));
    return { key, ...statusInfo, entries };
}

export function getSquadSelectionPlan(state, fixtures = []) {
    const matches = Array.isArray(fixtures) ? fixtures : [];
    const key = `${state?.calendar?.currentSeasonYear ?? 'season'}:${state?.calendar?.currentMonth ?? 'month'}:${matches.length}`;
    const cached = state?.matchSelectionPlan;
    if (cached?.key === key && Array.isArray(cached.entries)) {
        return {
            ...cached,
            entries: cached.entries.map(entry => ({ ...entry, fixture: matches[entry.matchIndex] || null }))
        };
    }

    const planned = buildSquadSelectionPlan(state, matches);
    if (state) {
        state.matchSelectionPlan = {
            ...planned,
            entries: planned.entries.map(({ fixture, ...entry }) => entry)
        };
    }
    return planned;
}

export const SquadSelectionSystem = Object.freeze({
    statuses: SQUAD_STATUSES,
    evaluateStatus: evaluateSquadStatus,
    planBlock: buildSquadSelectionPlan,
    getPlan: getSquadSelectionPlan
});

export default SquadSelectionSystem;

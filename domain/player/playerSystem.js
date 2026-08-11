// domain/player/playerSystem.js
// Modèle joueur canonique : une seule source de vérité.
import { PotentialSystem } from './potentialSystem.js';

export const FOOTBALL_ATTRIBUTES = [
    'vitesse', 'acceleration', 'endurance', 'puissance', 'finition', 'tir',
    'passe', 'controle', 'dribble', 'vision', 'placement', 'defense'
];

export const MENTAL_ATTRIBUTES = [
    'concentration', 'sangFroid', 'decision', 'regularite', 'resistancePression'
];

const clamp = (value, min = 1, max = 99) =>
    Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
const average = values =>
    values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const ORIGINS = {
    CENTRE_FORMATION: { d: { vitesse: 5, acceleration: 4, endurance: 8, puissance: 8, finition: 2, tir: 2, passe: 12, controle: 0, dribble: -5, vision: 8, placement: 10, defense: 10 } },
    CLUB_AMATEUR: { d: { vitesse: 8, acceleration: 7, endurance: 5, puissance: 5, finition: -2, tir: -2, passe: -8, controle: 4, dribble: 10, vision: -5, placement: -4, defense: -5 } },
    FUTSAL: { d: { vitesse: 5, acceleration: 8, endurance: -4, puissance: -10, finition: 6, tir: 6, passe: 12, controle: 15, dribble: 22, vision: 12, placement: 3, defense: -8 } },
    STREET: { d: { vitesse: 12, acceleration: 14, endurance: -3, puissance: -8, finition: 5, tir: 5, passe: -12, controle: 10, dribble: 25, vision: 2, placement: -8, defense: -15 } },
    ATHLETE: { d: { vitesse: 15, acceleration: 14, endurance: 15, puissance: 18, finition: -12, tir: -12, passe: -10, controle: -5, dribble: -15, vision: -3, placement: 0, defense: -3 } },
    DEBUTANT_TARDIF: { d: { vitesse: 10, acceleration: 8, endurance: 8, puissance: 8, finition: -10, tir: -10, passe: -15, controle: -10, dribble: -18, vision: -5, placement: -10, defense: -10 } },
    FILS_DE_PRO: { d: { vitesse: 3, acceleration: 3, endurance: 2, puissance: 2, finition: 8, tir: 8, passe: 10, controle: 7, dribble: 8, vision: 8, placement: 7, defense: 5 } }
};

const ROLE_WEIGHTS = {
    attacker: { finition: .25, tir: .12, dribble: .14, vitesse: .10, acceleration: .08, controle: .08, vision: .07, placement: .10, endurance: .02, puissance: .02, passe: .02 },
    midfielder: { passe: .18, vision: .16, controle: .13, dribble: .11, endurance: .09, placement: .10, defense: .07, tir: .06, vitesse: .04, acceleration: .03, finition: .03 },
    defender: { defense: .22, placement: .15, puissance: .13, endurance: .11, vitesse: .08, acceleration: .06, passe: .10, controle: .06, vision: .04, tir: .02, finition: .01 },
    goalkeeper: { defense: .24, placement: .18, puissance: .12, endurance: .08, passe: .08, vision: .08, controle: .05, vitesse: .05, acceleration: .04, tir: .02, finition: .01 }
};

function roleOf(position) {
    const value = String(position || '').toUpperCase();
    if (['GK', 'GB', 'G'].includes(value)) return 'goalkeeper';
    if (['DC', 'CB', 'DD', 'DG', 'RB', 'LB', 'D', 'LAT'].includes(value)) return 'defender';
    if (['MC', 'CM', 'MOC', 'CAM', 'MD', 'MG', 'M', 'MDEF', 'MOFF'].includes(value)) return 'midfielder';
    return 'attacker';
}

function normalizeOrigin(origin) {
    return ORIGINS[origin] ? origin : 'CENTRE_FORMATION';
}

export function ensure(player) {
    if (!player) return null;
    player.attributes ||= {};
    for (const key of FOOTBALL_ATTRIBUTES) {
        player.attributes[key] = clamp(player.attributes[key] ?? 50);
    }

    // The canonical model uses `player.mental` as an object containing
    // concentration, decision, etc. Older systems sometimes used the same
    // property as a single numeric mental score. Normalize that legacy shape
    // before any nested mental attribute is accessed.
    if (!player.mental || typeof player.mental !== 'object' || Array.isArray(player.mental)) {
        const legacyMental = clamp(player.mental ?? player.stats?.mental ?? 50);
        player.stats ||= {};
        player.stats.mental = legacyMental;
        player.mental = {};
    }

    player.mental ||= {};
    player.hidden ||= {};
    player.hidden.consistency = clamp(player.hidden.consistency ?? 12, 1, 16);
    for (const key of MENTAL_ATTRIBUTES) {
        player.mental[key] = clamp(player.mental[key] ?? 50);
    }
    player.mental.regularite = clamp(
        player.mental.regularite ?? player.hidden.consistency * 5.5
    );
    player.potentialProfile ||= PotentialSystem.createProfile(player.potential);
    player.potential = player.potentialProfile.current;
    player.overall = calculateOverall(player);
    return player;
}

export function get(player, key, fallback = 50) {
    ensure(player);
    if (FOOTBALL_ATTRIBUTES.includes(key)) return clamp(player.attributes[key] ?? fallback);
    if (MENTAL_ATTRIBUTES.includes(key)) return clamp(player.mental[key] ?? fallback);
    return clamp(fallback);
}

export function calculateOverall(player) {
    if (!player.attributes) player.attributes = {};
    for (const key of FOOTBALL_ATTRIBUTES) {
        player.attributes[key] = clamp(player.attributes[key] ?? 50);
    }
    const weights = ROLE_WEIGHTS[roleOf(player.position)];
    return clamp(Object.entries(weights).reduce(
        (sum, [key, weight]) => sum + (player.attributes[key] ?? 50) * weight,
        0
    ));
}

function ageFactor(age) {
    if (age <= 15) return 1.18;
    if (age <= 17) return 1.12;
    if (age <= 21) return 1.04;
    if (age <= 24) return .90;
    if (age <= 27) return .74;
    if (age <= 30) return .54;
    if (age <= 34) return .30;
    return .16;
}

function performanceQuality(rating, goals = 0, assists = 0) {
    const value = Number(rating) || 0;
    if (value <= 0) return 0;
    const ratingQuality = Math.max(0, value - 5.75) * .18;
    const goalQuality = Math.min(2, Number(goals) || 0) * .035;
    const assistQuality = Math.min(2, Number(assists) || 0) * .02;
    return Math.min(.65, ratingQuality + goalQuality + assistQuality);
}

export function applyProgression(
    player,
    { rating = 0, xp = 0, goals = 0, assists = 0, type = 'match', ageTick = false } = {}
) {
    ensure(player);

    let effectiveRating = Number(rating) || 0;
    if (!effectiveRating && Number(xp) > 0) {
        effectiveRating = (Number(xp) / 40) - 1.75;
    }
    if (type !== 'match' && type !== 'finSaison') return player;
    if (type === 'finSaison' && !effectiveRating) return player;

    const potential = Number(player.potential) || player.overall;
    const currentOverall = Number(player.overall) || 0;
    const remainingGap = Math.max(0, potential - currentOverall);
    if (remainingGap <= 0) {
        if (ageTick) applyAgeTick(player);
        player.overall = calculateOverall(player);
        return player;
    }

    const quality = performanceQuality(effectiveRating, goals, assists);
    const ageMultiplier = ageFactor(Number(player.age) || 14);
    const gapFactor = Math.min(1, remainingGap / 12);
    const regularity = Math.min(1, Math.max(.65, Number(player.mental?.regularite ?? 60) / 100));
    const consistency = Math.min(1, Math.max(.65, Number(player.hidden?.consistency ?? 12) / 16));
    const stimulus = quality * ageMultiplier * gapFactor * regularity * consistency;

    if (stimulus > 0) {
        const weights = ROLE_WEIGHTS[roleOf(player.position)];
        const ranked = Object.entries(weights).sort((a, b) => b[1] - a[1]);
        const budget = stimulus * 15.5;

        for (const [key, weight] of ranked) {
            const focus = Math.min(1, Math.max(.08, weight / .25));
            const gain = budget * focus;
            if (gain > .01) {
                player.attributes[key] = Math.min(
                    99,
                    Number(player.attributes[key] || 50) + gain
                );
            }
        }
    }

    if (ageTick) applyAgeTick(player);
    player.overall = calculateOverall(player);
    return player;
}

function applyAgeTick(player) {
    const age = Math.min(42, Number(player.age) || 14);
    player.age = Math.min(42, age + 1);
    if (player.age >= 31) {
        player.attributes.vitesse = clamp(player.attributes.vitesse - (player.age - 30) * .15);
        player.attributes.acceleration = clamp(player.attributes.acceleration - (player.age - 30) * .15);
        player.attributes.endurance = clamp(player.attributes.endurance - (player.age - 30) * .12);
    }
}

export function describe(player) {
    ensure(player);
    return {
        football: { ...player.attributes },
        mental: { ...player.mental },
        overall: player.overall,
        potential: player.potential
    };
}

export function createPlayer({
    firstname = 'Joueur',
    lastname = 'Inconnu',
    nationality = 'France',
    position = 'BU',
    origin = 'CENTRE_FORMATION',
    age = 14
} = {}) {
    const originData = ORIGINS[normalizeOrigin(origin)];
    const potentialProfile = PotentialSystem.createProfile();
    const player = {
        id: Date.now() + randomInt(0, 999999),
        firstname,
        lastname,
        nationality,
        country: nationality,
        position,
        age: Math.max(14, Number(age) || 14),
        origin: normalizeOrigin(origin),
        attributes: {},
        mental: {},
        hidden: {
            consistency: randomInt(8, 16),
            bigMatchPlayer: randomInt(8, 16),
            injuryProneness: randomInt(4, 12)
        },
        potentialProfile,
        potential: potentialProfile.current,
        overall: 0,
        morale: 80,
        fitness: 90,
        stats: {
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            successfulPasses: 0,
            tackles: 0,
            cleanSheets: 0,
            yellowCards: 0,
            averageRating: 0
        },
        xp: 0,
        canRetire: false,
        careerEnded: false
    };

    for (const key of FOOTBALL_ATTRIBUTES) {
        player.attributes[key] = clamp(
            40 + (originData.d[key] || 0) + randomInt(-4, 4)
        );
    }

    player.mental = {
        concentration: clamp(55 + (originData.d.placement || 0) * .25 + randomInt(-6, 6)),
        sangFroid: clamp(52 + (originData.d.finition || 0) * .15 + randomInt(-6, 6)),
        decision: clamp(50 + (originData.d.vision || 0) * .3 + randomInt(-6, 6)),
        regularite: clamp(player.hidden.consistency * 5.5),
        resistancePression: 50
    };
    player.mental.resistancePression = clamp(
        average([
            player.mental.concentration,
            player.mental.sangFroid,
            player.mental.regularite
        ])
    );
    player.overall = calculateOverall(player);
    return player;
}

export default {
    FOOTBALL_ATTRIBUTES,
    MENTAL_ATTRIBUTES,
    createPlayer,
    ensure,
    get,
    calculateOverall,
    applyProgression,
    describe
};

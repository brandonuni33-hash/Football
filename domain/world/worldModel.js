// domain/world/worldModel.js
// Contrats de données du monde simulé. Aucune narration, aucun résultat de match.

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const integer = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.round(Number(value)) : fallback;

export const WORLD_MODEL_VERSION = 1;

export const SIMULATION_DEPTH = Object.freeze({
    BUBBLE: 'BUBBLE',
    ACTIVE: 'ACTIVE',
    GLOBAL: 'GLOBAL'
});

export const MATURITY_PROFILE = Object.freeze({
    EARLY: 'EARLY',
    NORMAL: 'NORMAL',
    LATE: 'LATE'
});

export const SQUAD_STATUS = Object.freeze({
    YOUTH: 'YOUTH',
    PROSPECT: 'PROSPECT',
    ROTATION: 'ROTATION',
    STARTER: 'STARTER',
    KEY: 'KEY',
    RESERVE: 'RESERVE'
});

export const CONTRACT_TYPE = Object.freeze({
    YOUTH: 'YOUTH',
    ACADEMY: 'ACADEMY',
    PROFESSIONAL: 'PROFESSIONAL',
    FREE: 'FREE'
});

export function createWorldPlayerRecord(input = {}) {
    const age = clamp(integer(input.age, 18), 14, 42);
    const currentLevel = clamp(integer(input.currentLevel ?? input.overall, 50), 1, 99);
    const dynamicPotential = clamp(integer(input.dynamicPotential ?? input.potential, Math.max(currentLevel, 70)), currentLevel, 99);
    const rawCeiling = clamp(integer(input.rawCeiling, Math.max(dynamicPotential, currentLevel)), currentLevel, 99);

    return {
        id: String(input.id || ''),
        firstName: String(input.firstName || input.firstname || ''),
        lastName: String(input.lastName || input.lastname || ''),
        nationality: String(input.nationality || input.country || 'France'),
        age,
        position: String(input.position || 'MC'),
        clubId: input.clubId ? String(input.clubId) : null,
        squadId: input.squadId ? String(input.squadId) : null,
        currentLevel,
        development: {
            dynamicPotential,
            rawCeiling,
            developmentSpeed: clamp(Number(input.developmentSpeed ?? 1), 0.5, 1.5),
            maturityProfile: Object.values(MATURITY_PROFILE).includes(input.maturityProfile) ? input.maturityProfile : MATURITY_PROFILE.NORMAL
        },
        sporting: {
            status: Object.values(SQUAD_STATUS).includes(input.status) ? input.status : SQUAD_STATUS.ROTATION,
            form: clamp(integer(input.form, 50), 1, 99),
            fitness: clamp(integer(input.fitness, 90), 0, 100),
            injured: input.injured === true,
            injuryDaysRemaining: Math.max(0, integer(input.injuryDaysRemaining, 0))
        },
        contract: createContractRecord(input.contract),
        detail: {
            depth: Object.values(SIMULATION_DEPTH).includes(input.depth) ? input.depth : SIMULATION_DEPTH.GLOBAL,
            materialized: input.materialized === true
        }
    };
}

export function createContractRecord(input = null) {
    if (!input) return { type: CONTRACT_TYPE.FREE, clubId: null, startSeason: null, endSeason: null, wageBand: null };
    return {
        type: Object.values(CONTRACT_TYPE).includes(input.type) ? input.type : CONTRACT_TYPE.FREE,
        clubId: input.clubId ? String(input.clubId) : null,
        startSeason: Number.isFinite(Number(input.startSeason)) ? integer(input.startSeason) : null,
        endSeason: Number.isFinite(Number(input.endSeason)) ? integer(input.endSeason) : null,
        wageBand: input.wageBand == null ? null : clamp(integer(input.wageBand), 1, 5)
    };
}

export function createClubWorldProfile(catalogClub = {}) {
    return {
        id: String(catalogClub.id || ''),
        name: String(catalogClub.name || ''),
        country: String(catalogClub.country || ''),
        leagueId: String(catalogClub.leagueId || ''),
        tier: Math.max(1, integer(catalogClub.tier, 1)),
        sportingLevel: clamp(integer(catalogClub.strength, 50), 1, 99),
        prestige: clamp(integer(catalogClub.prestige, 1), 1, 5),
        academyQuality: clamp(integer(catalogClub.centerStars, 1), 1, 5),
        finances: clamp(integer(catalogClub.finances, 1), 1, 5),
        recruitmentProfile: String(catalogClub.recruitmentProfile || 'balanced'),
        proPathway: clamp(integer(catalogClub.proPathway ?? catalogClub.centerStars, 1), 1, 5)
    };
}

export function createWorldModelState(existing = null) {
    return {
        version: WORLD_MODEL_VERSION,
        players: existing?.players && typeof existing.players === 'object' ? { ...existing.players } : {},
        squads: existing?.squads && typeof existing.squads === 'object' ? { ...existing.squads } : {},
        clubDepth: existing?.clubDepth && typeof existing.clubDepth === 'object' ? { ...existing.clubDepth } : {},
        relevantClubIds: Array.isArray(existing?.relevantClubIds) ? [...new Set(existing.relevantClubIds.map(String))] : [],
        lastActivationReason: existing?.lastActivationReason || null
    };
}

export function validateWorldPlayerRecord(player) {
    if (!player?.id) return false;
    if (!Number.isFinite(Number(player.currentLevel))) return false;
    if (Number(player.currentLevel) < 1 || Number(player.currentLevel) > 99) return false;
    if (Number(player.development?.dynamicPotential) < Number(player.currentLevel)) return false;
    if (Number(player.development?.rawCeiling) < Number(player.currentLevel)) return false;
    return true;
}

export default {
    WORLD_MODEL_VERSION,
    SIMULATION_DEPTH,
    MATURITY_PROFILE,
    SQUAD_STATUS,
    CONTRACT_TYPE,
    createWorldPlayerRecord,
    createContractRecord,
    createClubWorldProfile,
    createWorldModelState,
    validateWorldPlayerRecord
};

// state.js
// Persistence centralisée et tolérante aux anciennes sauvegardes.

const STORAGE_KEY = 'street_to_pro_save_v3';
export const SCHEMA_VERSION = 8;

const DEFAULT_STATE = {
    schemaVersion: SCHEMA_VERSION,
    player: null,
    trainingFocus: 'TECHNIQUE',
    social: null,
    media: null,
    career: {
        balance: 0,
        seasonHistory: [],
        totalCareerIncome: 0
    },
    calendar: {
        currentMonth: 8,
        currentSeasonYear: 2026,
        currentPeriod: 'Pré-saison & reprise',
        seasonSchedule: null,
        seasonMatchCursor: 0
    },
    seasonPhase: 'pre_season',
    pendingEvent: null,
    pendingCoachEvent: null,
    pendingMediaDilemma: null,
    pendingTransferOffer: null,
    world: { version: 1, leagues: {}, lastSeasonFinalized: null }
};

function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function mergeDeep(base, source) {
    if (!source || typeof source !== 'object') return base;
    for (const [key, value] of Object.entries(source)) {
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            base[key] &&
            typeof base[key] === 'object' &&
            !Array.isArray(base[key])
        ) {
            mergeDeep(base[key], value);
        } else {
            base[key] = value;
        }
    }
    return base;
}

function migrate(raw) {
    const state = mergeDeep(cloneDefault(), raw || {});
    state.schemaVersion = SCHEMA_VERSION;
    state.social ||= null;
    state.media ||= null;

    // Compatibilité avec les anciennes sauvegardes.
    if (!state.career) state.career = cloneDefault().career;
    if (!Array.isArray(state.career.seasonHistory)) state.career.seasonHistory = [];
    if (!state.calendar) state.calendar = cloneDefault().calendar;
    state.calendar.seasonSchedule ||= null;
    state.calendar.seasonMatchCursor = Number.isFinite(Number(state.calendar.seasonMatchCursor))
        ? Number(state.calendar.seasonMatchCursor)
        : 0;
    state.world ||= { version: 1, leagues: {}, lastSeasonFinalized: null };

    // Migration des sauvegardes vers le système de conséquences.
    if (state.player) {
        state.player.stats ||= {};
        state.player.attributes ||= {};
        state.player.temporaryEffects =
            Array.isArray(state.player.temporaryEffects)
                ? state.player.temporaryEffects
                : [];

        state.player.age = Math.max(14, Number(state.player.age) || 14);
        state.player.potentialProfile ||= null;
        state.player.progression ||= null;
        state.player.hidden ||= {};
        state.player.stats.relationCoach = Number.isFinite(Number(state.player.stats.relationCoach)) ? Number(state.player.stats.relationCoach) : 50;
        state.player.stats.vestiaire = Number.isFinite(Number(state.player.stats.vestiaire)) ? Number(state.player.stats.vestiaire) : 50;
        state.player.canRetire = state.player.age >= 34;
        state.player.careerEnded = state.player.age >= 42;
        state.pendingPositionProposal ||= null;
        state.careerStructure ||= state.player?.careerProfile || null;
    }

    return state;
}

export const StateManager = {
    STORAGE_KEY,

    load() {
        try {
            if (typeof localStorage === 'undefined') return null;
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.player) return null;

            return migrate(parsed);
        } catch (error) {
            console.error('Erreur lors du chargement de la sauvegarde :', error);
            return null;
        }
    },

    save(gameState) {
        if (!gameState) return false;

        try {
            if (typeof localStorage === 'undefined') return false;
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                ...gameState,
                schemaVersion: SCHEMA_VERSION
            }));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            return false;
        }
    },

    clear() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de la sauvegarde :', error);
        }
    },

    createEmpty() {
        return cloneDefault();
    }
};
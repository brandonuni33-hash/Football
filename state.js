
// state.js
// Persistence centralisée et tolérante aux anciennes sauvegardes.

const STORAGE_KEY = 'street_to_pro_save_v3';
const SCHEMA_VERSION = 4;

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
        currentPeriod: 'Pré-saison & Début de championnat'
    },
    seasonPhase: 'pre_season',
    pendingEvent: null,
    pendingCoachEvent: null,
    pendingMediaDilemma: null,
    pendingTransferOffer: null
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

    // Compatibilité avec les anciennes sauvegardes.
    if (!state.career) state.career = cloneDefault().career;
    if (!Array.isArray(state.career.seasonHistory)) state.career.seasonHistory = [];
    if (!state.calendar) state.calendar = cloneDefault().calendar;

    // Migration des sauvegardes vers le système de conséquences.
    if (state.player) {
        state.player.stats ||= {};
        state.player.attributes ||= {};
        state.player.temporaryEffects =
            Array.isArray(state.player.temporaryEffects)
                ? state.player.temporaryEffects
                : [];
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

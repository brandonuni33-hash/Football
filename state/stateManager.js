// state/stateManager.js
// Persistence centrale et migration vers le modèle joueur canonique.
import { ensure as ensurePlayer } from '../domain/player/playerSystem.js';

const STORAGE_KEY = 'street_to_pro_save_v3';
export const SCHEMA_VERSION = 9;

const DEFAULT_STATE = {
    schemaVersion: SCHEMA_VERSION,
    player: null,
    trainingFocus: 'TECHNIQUE',
    social: null,
    media: null,
    career: { balance: 0, seasonHistory: [], totalCareerIncome: 0 },
    calendar: { currentMonth: 8, currentSeasonYear: 2026, currentPeriod: 'Pré-saison & reprise', seasonSchedule: null, seasonMatchCursor: 0 },
    seasonPhase: 'pre_season',
    pendingEvent: null,
    pendingCoachEvent: null,
    pendingMediaDilemma: null,
    pendingTransferOffer: null,
    world: { version: 1, leagues: {}, lastSeasonFinalized: null }
};

const cloneDefault = () => JSON.parse(JSON.stringify(DEFAULT_STATE));
const clamp = (value, min = 1, max = 99) => Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
const avg = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);

function mergeDeep(base, source) {
    if (!source || typeof source !== 'object') return base;
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) mergeDeep(base[key], value);
        else base[key] = value;
    }
    return base;
}

function migrateLegacyAttributes(player) {
    const a = player.attributes || {};
    if (a.acceleration !== undefined && a.endurance !== undefined && a.finition !== undefined && a.controle !== undefined && a.vision !== undefined && a.placement !== undefined) return;
    const vitesse = clamp(a.vitesse ?? 50);
    const tir = clamp(a.tir ?? 50);
    const passe = clamp(a.passe ?? a.passes ?? 50);
    const dribble = clamp(a.dribble ?? 50);
    const defense = clamp(a.defense ?? 50);
    const physique = clamp(a.physique ?? 50);
    const mental = clamp(a.mental ?? a.tete ?? 50);

    player.attributes = {
        vitesse,
        acceleration: clamp(vitesse + (dribble - 50) * .25),
        endurance: clamp(avg([physique, vitesse, mental])),
        puissance: physique,
        finition: tir,
        tir,
        passe,
        controle: clamp(avg([dribble, passe, mental])),
        dribble,
        vision: clamp(avg([passe, mental])),
        placement: clamp(avg([defense, mental])),
        defense
    };
    player.mental ||= {
        concentration: mental,
        sangFroid: clamp(avg([mental, tir])),
        decision: clamp(avg([mental, passe, dribble])),
        regularite: clamp((player.hidden?.consistency ?? 12) * 5.5),
        resistancePression: mental
    };
}

function migrate(raw) {
    const state = mergeDeep(cloneDefault(), raw || {});
    state.schemaVersion = SCHEMA_VERSION;
    state.social ??= null;
    state.media ??= null;
    state.career ??= cloneDefault().career;
    if (!Array.isArray(state.career.seasonHistory)) state.career.seasonHistory = [];
    state.calendar ??= cloneDefault().calendar;
    state.calendar.seasonSchedule ??= null;
    state.calendar.seasonMatchCursor = Number.isFinite(Number(state.calendar.seasonMatchCursor)) ? Number(state.calendar.seasonMatchCursor) : 0;
    state.world ??= { version: 1, leagues: {}, lastSeasonFinalized: null };

    if (state.player) {
        state.player.stats ??= {};
        state.player.attributes ??= {};
        state.player.temporaryEffects = Array.isArray(state.player.temporaryEffects) ? state.player.temporaryEffects : [];
        state.player.age = Math.max(14, Number(state.player.age) || 14);
        state.player.potentialProfile ??= null;
        state.player.hidden ??= {};
        migrateLegacyAttributes(state.player);
        state.player.stats.relationCoach = Number.isFinite(Number(state.player.stats.relationCoach)) ? Number(state.player.stats.relationCoach) : 50;
        state.player.stats.vestiaire = Number.isFinite(Number(state.player.stats.vestiaire)) ? Number(state.player.stats.vestiaire) : 50;
        ensurePlayer(state.player);
        state.player.canRetire = state.player.age >= 34;
        state.player.careerEnded = state.player.age >= 42;
        state.pendingPositionProposal ??= null;
        state.careerStructure ??= state.player?.careerProfile || null;
        delete state.player.progression;
        delete state.player.attributesV2;
    }

    return state;
}

export const StateManager = {
    STORAGE_KEY,
    SCHEMA_VERSION,
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
            const clean = { ...gameState, schemaVersion: SCHEMA_VERSION, player: { ...gameState.player } };
            delete clean.player.progression;
            delete clean.player.attributesV2;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde :', error);
            return false;
        }
    },
    clear() {
        try {
            if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Erreur lors de la suppression de la sauvegarde :', error);
        }
    },
    createEmpty() {
        return cloneDefault();
    }
};

export default StateManager;

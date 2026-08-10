// state/stateFactory.js
// Créateur de State neutre pour la future architecture.
// Les systèmes historiques restent responsables de compléter player/social/media.

import { STATE_SCHEMA_VERSION } from './stateSchema.js';

export function createBaseState(overrides = {}) {
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
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
            currentSeasonYear: new Date().getFullYear(),
            currentPeriod: 'Pré-saison & reprise',
            seasonSchedule: null,
            seasonMatchCursor: 0
        },
        seasonPhase: 'pre_season',
        pendingEvent: null,
        pendingCoachEvent: null,
        pendingMediaDilemma: null,
        pendingTransferOffer: null,
        pendingPositionProposal: null,
        world: {
            version: 1,
            leagues: {},
            lastSeasonFinalized: null
        },
        cups: {},
        cupHistory: [],
        careerStructure: null,
        notifications: [],
        ...overrides
    };
}

export default createBaseState;

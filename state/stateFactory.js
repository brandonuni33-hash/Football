// state/stateFactory.js
// Créateur de State neutre pour la future architecture.
// Les systèmes historiques restent responsables de compléter player/social/media.

import { STATE_SCHEMA_VERSION } from './stateSchema.js';

export function createBaseState(overrides = {}) {
    return {
        schemaVersion: STATE_SCHEMA_VERSION,
        player: null,
        activePlayerId: null,
        careerGeneration: 1,
        trainingFocus: 'TECHNIQUE',
        social: null,
        media: null,
        career: {
            balance: 0,
            seasonHistory: [],
            totalCareerIncome: 0
        },
        family: {
            members: [],
            couples: [],
            children: [],
            events: []
        },
        relationships: {},
        relationshipNetwork: [],
        relationshipMemory: [],
        careerMemory: [],
        generationHistory: [],
        secondGeneration: {
            unlocked: [],
            active: null,
            completed: []
        },
        familyLegacy: [],
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
        scouting: {
            observations: [],
            interests: [],
            shortlist: [],
            clubNeeds: {}
        },
        transferInterests: [],
        clubTransferNeeds: {},
        transferMarket: {
            activity: [],
            lastCycle: null
        },
        world: {
            version: 1,
            leagues: {},
            lastSeasonFinalized: null
        },
        cups: {},
        cupHistory: [],
        careerStructure: null,
        notifications: { signals: [], threads: [], unreadCount: 0 },
        ...overrides
    };
}

export default createBaseState;

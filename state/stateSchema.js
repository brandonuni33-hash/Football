// state/stateSchema.js
// Contrat documentaire du State applicatif.
// Ce fichier ne remplace pas encore state.js : il définit la cible de migration.

export const STATE_SCHEMA_VERSION = 11;

export const STATE_KEYS = Object.freeze([
    'schemaVersion',
    'player',
    'activePlayerId',
    'careerGeneration',
    'trainingFocus',
    'social',
    'media',
    'career',
    'family',
    'relationships',
    'relationshipNetwork',
    'relationshipMemory',
    'careerMemory',
    'narrativeState',
    'generationHistory',
    'secondGeneration',
    'familyLegacy',
    'calendar',
    'seasonPhase',
    'pendingEvent',
    'pendingCoachEvent',
    'pendingMediaDilemma',
    'pendingTransferOffer',
    'pendingPositionProposal',
    'scouting',
    'transferInterests',
    'clubTransferNeeds',
    'transferMarket',
    'world',
    'cups',
    'cupHistory',
    'careerStructure',
    'notifications'
]);

export function isState(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

export default STATE_KEYS;

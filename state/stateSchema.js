// state/stateSchema.js
// Contrat documentaire du State applicatif.
// Ce fichier ne remplace pas encore state.js : il définit la cible de migration.

export const STATE_SCHEMA_VERSION = 8;

export const STATE_KEYS = Object.freeze([
    'schemaVersion',
    'player',
    'trainingFocus',
    'social',
    'media',
    'career',
    'calendar',
    'seasonPhase',
    'pendingEvent',
    'pendingCoachEvent',
    'pendingMediaDilemma',
    'pendingTransferOffer',
    'pendingPositionProposal',
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

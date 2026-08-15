// domain/relationship/relationshipTypes.js

export const RELATIONSHIP_TYPES = Object.freeze({
    AGENT: 'agent',
    COACH: 'coach',
    FAMILY: 'family',
    TEAMMATE: 'teammate',
    CLUB: 'club',
    SCOUT: 'scout',
    MEDIA: 'media',
    RIVAL: 'rival',
    SUPPORTER: 'supporter'
});

export const RELATIONSHIP_AXES = Object.freeze([
    'trust',
    'affection',
    'respect',
    'loyalty',
    'communication',
    'tension'
]);

export const RELATIONSHIP_STATES = Object.freeze([
    'unknown',
    'acquaintance',
    'developing',
    'close',
    'strained',
    'broken',
    'hostile'
]);

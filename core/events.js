// core/events.js
// Catalogue central des événements applicatifs/domaines.
// Utiliser ces constantes plutôt que de multiplier les chaînes littérales.

export const EVENTS = Object.freeze({
    GAME_STARTED: 'game.started',
    GAME_BLOCK_STARTED: 'game.block.started',
    GAME_BLOCK_COMPLETED: 'game.block.completed',

    PLAYER_CREATED: 'player.created',
    PLAYER_ATTRIBUTE_CHANGED: 'player.attribute.changed',
    PLAYER_INJURED: 'player.injury.created',
    PLAYER_RECOVERED: 'player.recovered',

    MATCH_STARTED: 'match.started',
    MATCH_COMPLETED: 'match.completed',

    SEASON_STARTED: 'career.season.started',
    SEASON_COMPLETED: 'career.season.completed',
    CAREER_STAGE_CHANGED: 'career.stage.changed',
    CAREER_ENDED: 'career.ended',

    SCOUTING_OBSERVATION_STARTED: 'scouting.observation.started',
    SCOUTING_OBSERVATION_COMPLETED: 'scouting.observation.completed',
    SCOUTING_INTEREST_CREATED: 'scouting.interest.created',
    SCOUTING_TRIAL_OFFERED: 'scouting.trial.offered',

    TRANSFER_INTEREST_CREATED: 'transfer.interest.created',
    TRANSFER_OFFER_CREATED: 'transfer.offer.created',
    TRANSFER_OFFER_ACCEPTED: 'transfer.offer.accepted',
    TRANSFER_OFFER_REJECTED: 'transfer.offer.rejected',
    TRANSFER_COMPLETED: 'transfer.completed',

    LOAN_PROPOSAL_CREATED: 'loan.proposal.created',
    LOAN_ACCEPTED: 'loan.accepted',
    LOAN_REJECTED: 'loan.rejected',
    LOAN_STARTED: 'loan.started',
    LOAN_COMPLETED: 'loan.completed',
    LOAN_RECALLED: 'loan.recalled',

    CONTRACT_EXPIRING: 'contract.expiring',
    CONTRACT_SIGNED: 'contract.signed',

    RELATIONSHIP_CREATED: 'relationship.created',
    RELATIONSHIP_CHANGED: 'relationship.changed',
    RELATIONSHIP_CONFLICT: 'relationship.conflict',
    RELATIONSHIP_ADVICE: 'relationship.advice',

    AGENT_INTEREST_CREATED: 'agent.interest.created',
    AGENT_SIGNED: 'agent.signed',
    AGENT_TERMINATED: 'agent.terminated'
});

export default EVENTS;

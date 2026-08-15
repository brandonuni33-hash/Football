// core/eventContracts.js
// Contrats de payload des événements métier.
// Ce fichier est volontairement descriptif : il fixe la forme attendue entre
// producteurs et consommateurs sans ajouter de logique métier.

export const EVENT_CONTRACTS = Object.freeze({
    'game.block.completed': ['state', 'result'],
    'career.season.started': ['state', 'season', 'playerId'],
    'career.season.completed': ['state', 'season', 'playerId'],
    'relationship.changed': ['state', 'relation', 'score', 'playerId'],
    'relationship.advice': ['state', 'relation', 'advice', 'playerId'],
    'relationship.conflict': ['state', 'relation'],
    'media.post.created': ['state', 'playerId', 'post'],
    'media.dilemma.created': ['state', 'playerId', 'dilemma'],
    'media.dilemma.resolved': ['state', 'playerId', 'dilemmaId', 'choiceIndex'],
    'transfer.offer.accepted': ['state', 'playerId', 'oldClub', 'newClub', 'salary'],
    'transfer.offer.rejected': ['playerId', 'club'],
    'transfer.completed': ['state', 'playerId', 'oldClub', 'newClub', 'salary'],
    'scouting.observation.started': ['state', 'playerId', 'clubId', 'observerId'],
    'scouting.observation.completed': ['state', 'playerId', 'clubId', 'observerId'],
    'scouting.interest.created': ['state', 'playerId', 'clubId', 'level'],
    'scouting.trial.offered': ['state', 'playerId', 'clubId'],
    'loan.proposal.created': ['state', 'playerId', 'clubId'],
    'loan.accepted': ['state', 'playerId', 'clubId'],
    'loan.rejected': ['state', 'playerId', 'clubId'],
    'loan.started': ['state', 'playerId', 'fromClubId', 'toClubId'],
    'loan.completed': ['state', 'playerId', 'clubId'],
    'loan.recalled': ['state', 'playerId', 'clubId'],
    'contract.expiring': ['state', 'playerId', 'clubId', 'monthsRemaining'],
    'contract.signed': ['state', 'playerId', 'clubId', 'contractId'],
    'agent.interest.created': ['state', 'playerId', 'agentId'],
    'agent.signed': ['state', 'playerId', 'agentId'],
    'agent.terminated': ['state', 'playerId', 'agentId']
});

export function getEventContract(eventName) {
    return EVENT_CONTRACTS[eventName] || null;
}

export default EVENT_CONTRACTS;

// domain/match/matchSystem.js
// Façade de domaine pour la simulation des blocs de match.
// Les règles historiques restent dans MatchBlockManager pendant la migration.

export class MatchSystem {
    constructor(matchBlockManager) {
        if (!matchBlockManager?.simulateBlock) {
            throw new Error('MatchSystem requires a match block manager');
        }
        this.legacy = matchBlockManager;
    }

    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        return this.legacy.simulateBlock(state, trainingFocus, userMatchChoice);
    }
}

export default MatchSystem;

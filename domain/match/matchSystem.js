// domain/match/matchSystem.js
// Façade de domaine pour la simulation des blocs de match.
// Le moteur de performance commun recalibre les matchs simulés à partir
// des attributs, de la forme, du mental, de la régularité et du contexte.

import { recalibrateReport } from './matchPerformanceEngine.js';

export class MatchSystem {
    constructor(matchBlockManager) {
        if (!matchBlockManager?.simulateBlock) {
            throw new Error('MatchSystem requires a match block manager');
        }
        this.legacy = matchBlockManager;
    }

    simulateBlock(state, trainingFocus = 'TECHNIQUE', userMatchChoice = null) {
        const report = this.legacy.simulateBlock(state, trainingFocus, userMatchChoice);
        return recalibrateReport(state?.player, report, { trainingFocus, interactive: Boolean(userMatchChoice) });
    }
}

export default MatchSystem;

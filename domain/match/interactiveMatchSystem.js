// domain/match/interactiveMatchSystem.js
// Façade canonique pour les matchs interactifs.
// L'implémentation historique de matchBlock.js reste encapsulée ici pendant
// sa future décomposition en session/decision/resultat/statistics.

import { MatchBlockManager } from '../../matchBlock.js';

export const InteractiveMatchSystem = MatchBlockManager;
export default InteractiveMatchSystem;

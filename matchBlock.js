// managers/matchBlock.js

export const MatchBlockManager = {
    simulateBlock(state) {
        const p = state.player.attributes; // Accès aux attributs 1-20

        // 1. Calcul de la Constance (Impact sur la variabilité)
        // Plus la constance est élevée (proche de 20), plus la variation est faible (performance stable)
        // Plus elle est basse (proche de 1), plus les notes oscillent fortement (hauts et bas)
        const volatility = 4.0 - (p.consistency / 20 * 2.5); 
        
        // 2. Calcul du risque de blessure
        // On définit un seuil de risque. Si 20/20, risque presque nul. Si 1/20, risque maximal.
        // On ajoute un facteur fitness : si le joueur est fatigué, le risque augmente.
        const injuryChance = (21 - p.injuryProneness) * 0.15; // Score de base
        const fatigueFactor = state.player.fitness < 50 ? 2 : 1;
        const isInjured = Math.random() * 100 < (injuryChance * fatigueFactor);

        const results = Array.from({ length: 4 }, () => ({
            // La note oscille autour d'une base de 7.0 avec la volatilité calculée
            rating: parseFloat((6.0 + (Math.random() * volatility)).toFixed(1)),
            goals: Math.random() > 0.85 ? 1 : 0,
            assists: Math.random() > 0.8 ? 1 : 0
        }));

        // ... reste de la logique (totaux, finances, moral) ...

        return {
            results,
            isInjured, // On retourne l'état de blessure
            summary: { /* ... */ }
        };
    }
};

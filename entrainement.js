// entrainement.js
export const TrainingManager = {
    // Configuration des différents focus possibles
    FOCUS_TYPES: {
        PHYSIQUE: { 
            name: "Physique", 
            fitnessCost: 8, 
            ratingBonus: 0.2, 
            injuryRisk: 1.15 // Augmente légèrement le risque
        },
        TECHNIQUE: { 
            name: "Technique", 
            fitnessCost: 4, 
            ratingBonus: 0.4, 
            injuryRisk: 1.0 
        },
        REPOS: { 
            name: "Repos", 
            fitnessCost: -15, // Gain de fitness
            ratingBonus: -0.3, // Moins performant le week-end
            injuryRisk: 0.8 
        }
    },

    /**
     * Récupère les données d'effet selon le focus choisi
     */
    getEffect(focusKey) {
        return this.FOCUS_TYPES[focusKey] || { fitnessCost: 5, ratingBonus: 0, injuryRisk: 1.0 };
    }
};

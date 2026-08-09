// entrainement.js
export const TrainingManager = {
    // Configuration des différents focus possibles avec leurs attributs cibles et descriptions
    FOCUS_TYPES: {
        PHYSIQUE: { 
            name: "Physique", 
            description: "Développe l'endurance, la vitesse et la robustesse physique dans les duels.",
            fitnessCost: 8, 
            ratingBonus: 0.2, 
            injuryRisk: 1.15,
            primaryStats: ['physique', 'vitesse'],
            secondaryStats: ['defense']
        },
        TECHNIQUE: { 
            name: "Technique", 
            description: "Améliore le toucher de balle, la qualité de passe et la précision des dribbles.",
            fitnessCost: 4, 
            ratingBonus: 0.4, 
            injuryRisk: 1.0,
            primaryStats: ['dribble', 'passe'],
            secondaryStats: ['tir']
        },
        OFFENSIF: { 
            name: "Finition & Attaque", 
            description: "Travaille les tirs au but, les appels tranchants et la spontanéité offensive.",
            fitnessCost: 6, 
            ratingBonus: 0.5, 
            injuryRisk: 1.05,
            primaryStats: ['tir', 'vitesse'],
            secondaryStats: ['dribble']
        },
        DEFENSIF: { 
            name: "Tactique & Défense", 
            description: "Renforce le placement tactique, l'interception et la rigueur défensive.",
            fitnessCost: 5, 
            ratingBonus: 0.3, 
            injuryRisk: 1.0,
            primaryStats: ['defense', 'mental'],
            secondaryStats: ['physique']
        },
        REPOS: { 
            name: "Repos", 
            description: "Permet de recharger les batteries, de récupérer de la forme et d'éviter les blessures.",
            fitnessCost: -15, // Gain de fitness
            ratingBonus: -0.3, 
            injuryRisk: 0.8,
            primaryStats: [],
            secondaryStats: []
        }
    },

    /**
     * Récupère les données d'effet selon le focus choisi
     */
    getEffect(focusKey) {
        return this.FOCUS_TYPES[focusKey] || { fitnessCost: 5, ratingBonus: 0, injuryRisk: 1.0, primaryStats: [], secondaryStats: [] };
    },

    /**
     * Applique l'entraînement mensuel sur le joueur (Forme + Attributs + Global)
     * @param {Object} player - L'objet joueur du state
     * @param {String} focusKey - La clé du focus (ex: 'TECHNIQUE', 'PHYSIQUE')
     */
    applyTraining(player, focusKey) {
        const effect = this.getEffect(focusKey);

        // 1. Gestion de la forme (Fitness)
        player.fitness = Math.max(0, Math.min(100, player.fitness - effect.fitnessCost));

        // 2. Progression des attributs (uniquement si ce n'est pas "REPOS")
        if (focusKey !== 'REPOS' && player.attributes) {
            const allTargetStats = [...effect.primaryStats, ...effect.secondaryStats];

            allTargetStats.forEach(statKey => {
                if (player.attributes[statKey] !== undefined) {
                    const currentVal = player.attributes[statKey];

                    // Ne dépasse pas le potentiel max du joueur
                    if (currentVal >= (player.potential || 99)) return;

                    // Plus de chance de progresser sur les stats principales que secondaires
                    const isPrimary = effect.primaryStats.includes(statKey);
                    const threshold = isPrimary ? 0.75 : 0.40;

                    if (Math.random() < threshold) {
                        const gain = Math.random() < 0.2 ? 2 : 1; // Rare boost de +2
                        player.attributes[statKey] = Math.min(player.potential || 99, currentVal + gain);
                    }
                }
            });

            // 3. Recalcul automatique de l'Overall (OVR) basé sur la moyenne des attributs
            const attrs = player.attributes;
            const statKeys = ['vitesse', 'tir', 'passe', 'dribble', 'defense', 'physique', 'mental'];
            const sum = statKeys.reduce((acc, key) => acc + (attrs[key] || player.overall), 0);
            player.overall = Math.round(sum / statKeys.length);
        }

        console.log(`🏋️‍♂️ Entraînement [${effect.name}] appliqué. Nouvelle forme : ${player.fitness}%, OVR : ${player.overall}`);
    }
};

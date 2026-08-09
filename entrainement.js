const TrainingSystem = {
    // Définition des types d'entraînement et de leurs impacts sur les statistiques et la forme
    programs: {
        technique: {
            name: "Technique & Agilité",
            fitnessCost: 15,
            primaryStats: ["dribble", "controle", "passes"],
            secondaryStats: ["agilite", "acceleration"]
        },
        physique: {
            name: "Renforcement Physique",
            fitnessCost: 25,
            primaryStats: ["endurance", "force", "vitesse"],
            secondaryStats: ["detente", "agilite"]
        },
        tir: {
            name: "Finition & Attaque",
            fitnessCost: 20,
            primaryStats: ["finition", "tirs_de_loin", "placement"],
            secondaryStats: ["puissance", "volants"]
        },
        defensif: {
            name: "Bouclier Défensif",
            fitnessCost: 20,
            primaryStats: ["tacle", "marquage", "agressivite"],
            secondaryStats: ["interception", "force"]
        },
        repos: {
            name: "Récupération Active",
            fitnessCost: -30, // Restaure de la forme
            primaryStats: [],
            secondaryStats: []
        }
    },

    // Fonction principale pour exécuter un entraînement
    executeTraining(player, programKey) {
        const effect = this.programs[programKey];
        if (!effect) {
            return { success: false, message: "Programme d'entraînement inconnu." };
        }

        // 1. Gestion de la forme physique (fitness)
        player.fitness = Math.max(0, Math.min(100, (player.fitness || 80) - effect.fitnessCost));

        // Si c'est un repos, on applique uniquement la récupération
        if (programKey === 'repos') {
            return {
                focus: effect.name,
                fitnessChange: -effect.fitnessCost,
                statIncreases: {},
                message: `Séance de "${effect.name}" effectuée avec succès.`
            };
        }

        // 2. Progression des statistiques cibles
        const statIncreases = {};
        
        const increaseStat = (statName, amount) => {
            if (!player.stats) player.stats = {};
            const current = player.stats[statName] || 40;
            const maxVal = player.potential || 99;
            if (current < maxVal) {
                player.stats[statName] = Math.min(maxVal, current + amount);
                statIncreases[statName] = (statIncreases[statName] || 0) + amount;
            }
        };

        // Appliquer les gains pour les stats primaires (hausse de 1 à 2 points)
        effect.primaryStats.forEach(stat => {
            const gain = Math.random() < 0.7 ? 1 : 2;
            increaseStat(stat, gain);
        });

        // Appliquer les gains pour les stats secondaires (hausse de 1 point avec 50% de chance)
        effect.secondaryStats.forEach(stat => {
            if (Math.random() < 0.5) {
                increaseStat(stat, 1);
            }
        });

        // 3. Recalcul de l'OVR général du joueur
        const statValues = Object.values(player.stats);
        if (statValues.length > 0) {
            const sum = statValues.reduce((a, b) => a + b, 0);
            player.overall = Math.round(sum / statValues.length);
        }

        return {
            success: true,
            focus: effect.name,
            fitnessChange: -effect.fitnessCost,
            statIncreases,
            message: `Entraînement "${effect.name}" effectué avec succès.`
        };
    }
};

// Export si tu utilises des modules Node.js / ES6
// export default TrainingSystem;

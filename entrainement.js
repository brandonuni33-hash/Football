export const TrainingManager = {
    // Définition des types d'entraînement et de leurs impacts
    programs: {
        TECHNIQUE: {
            name: "Technique & Agilité",
            fitnessCost: 15,
            ratingBonus: 0.2,
            goalBonus: 0.05,
            assistBonus: 0.05,
            primaryStats: ["dribble", "controle", "passes"],
            secondaryStats: ["agilite", "acceleration"]
        },
        PHYSIQUE: {
            name: "Renforcement Physique",
            fitnessCost: 25,
            ratingBonus: 0.0,
            goalBonus: 0.0,
            assistBonus: 0.0,
            primaryStats: ["endurance", "force", "vitesse"],
            secondaryStats: ["detente", "agilite"]
        },
        TIR: {
            name: "Finition & Attaque",
            fitnessCost: 20,
            ratingBonus: 0.1,
            goalBonus: 0.1,
            assistBonus: 0.0,
            primaryStats: ["finition", "tirs_de_loin", "placement"],
            secondaryStats: ["puissance"]
        },
        DEFENSIF: {
            name: "Bouclier Défensif",
            fitnessCost: 20,
            ratingBonus: 0.1,
            goalBonus: 0.0,
            assistBonus: 0.0,
            primaryStats: ["tacle", "marquage", "agressivite"],
            secondaryStats: ["interception", "force"]
        },
        REPOS: {
            name: "Récupération Active",
            fitnessCost: -30,
            ratingBonus: 0.0,
            goalBonus: 0.0,
            assistBonus: 0.0,
            primaryStats: [],
            secondaryStats: []
        }
    },

    // Méthode appelée par matchBlock.js
    getEffect(focusKey) {
        // Sécurité si la clé est en minuscules ou inconnue
        const key = (focusKey || 'TECHNIQUE').toUpperCase();
        return this.programs[key] || this.programs.TECHNIQUE;
    },

    // Fonction principale pour exécuter un entraînement manuel si besoin
    executeTraining(player, programKey) {
        const effect = this.getEffect(programKey);

        // 1. Gestion de la forme physique
        player.fitness = Math.max(0, Math.min(100, (player.fitness || 80) - effect.fitnessCost));

        if (programKey === 'REPOS' || programKey === 'repos') {
            return {
                success: true,
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

        effect.primaryStats.forEach(stat => {
            const gain = Math.random() < 0.7 ? 1 : 2;
            increaseStat(stat, gain);
        });

        effect.secondaryStats.forEach(stat => {
            if (Math.random() < 0.5) {
                increaseStat(stat, 1);
            }
        });

        // 3. Recalcul de l'OVR général du joueur
        const statValues = Object.values(player.stats).filter(val => typeof val === 'number');
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

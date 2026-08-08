// player.js
import { ORIGINS } from './constants.js';

export const PlayerLogic = {
    generateRandomName: (nationality) => {
        // Idéalement étendu avec un dictionnaire par nationalité
        const firstNames = ['Lucas', 'Hugo', 'Enzo', 'Kylian', 'Theo', 'Rayan'];
        const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard'];
        const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
        return `${r(firstNames)} ${r(lastNames)}`;
    },

    createPlayerProfile: (formData) => {
        const originData = ORIGINS[formData.originId];
        
        // Base stats
        let stats = {
            technique: 50,
            physique: 50,
            mental: 50,
            tactique: 50,
            vitesse: 50,
            puissance: 50,
            dribble: 50
        };

        // Application des modificateurs d'origine
        if (originData && originData.modifiers) {
            for (const [key, value] of Object.entries(originData.modifiers)) {
                if (stats[key] !== undefined) stats[key] += value;
            }
        }

        const ovr = PlayerLogic.calculateOVR(stats, originData?.modifiers?.ovrBase || 0);

        return {
            id: crypto.randomUUID ? crypto.randomUUID() : Date.now(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            nationality: formData.nationality,
            height: formData.height,
            weight: formData.weight,
            position: formData.position,
            origin: formData.originId,
            trait: originData.trait,
            favoriteClub: formData.favoriteClub,
            currentClub: formData.startingClub,
            stats: stats,
            ovr: ovr,
            relations: {
                coach: 50,
                dressingRoom: 50,
                arrogance: 20,
                discipline: 80
            }
        };
    },

    calculateOVR: (stats, baseModifier = 0) => {
        // Algorithme basique : moyenne des stats + modificateur
        const values = Object.values(stats);
        const sum = values.reduce((a, b) => a + b, 0);
        return Math.round((sum / values.length) + baseModifier);
    }
};

// player.js
import { ORIGINS } from './constants.js';

export const PlayerLogic = {
    generateRandomName: () => {
        const firstNames = ['Lucas', 'Hugo', 'Enzo', 'Kylian', 'Theo', 'Rayan', 'Diego', 'Mateo'];
        const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Silva', 'Gomez'];
        const r = (arr) => arr[Math.floor(Math.random() * arr.length)];
        return `${r(firstNames)} ${r(lastNames)}`;
    },

    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    createPlayerProfile: (formData) => {
        const originData = ORIGINS[formData.originId];
        
        let baseOvr = PlayerLogic.randomInt(35, 50);
        if (originData.mults.basePenalty) {
            baseOvr += originData.mults.basePenalty;
        }

        let pot = PlayerLogic.randomInt(70, 99);
        if (pot > 98) {
            if (Math.random() < 0.985) {
                pot = PlayerLogic.randomInt(88, 95);
            }
        }

        let stats = {
            technique: baseOvr,
            physique: baseOvr,
            mental: baseOvr,
            charisme: 50,
            reputation: formData.originId === 'FILS_DE_PRO' ? 80 : 10,
            discipline: 50,
            relationCoach: 50,
            vestiaire: 50
        };

        if (originData.mults) {
            if (originData.mults.technique) stats.technique = Math.round(stats.technique * originData.mults.technique);
            if (originData.mults.physique) stats.physique = Math.round(stats.physique * originData.mults.physique);
            if (originData.mults.mental) stats.mental = Math.round(stats.mental * originData.mults.mental);
            if (originData.mults.discipline) stats.discipline = Math.round(stats.discipline * originData.mults.discipline);
        }

        for (let key in stats) {
            stats[key] = Math.min(100, Math.max(1, stats[key]));
        }

        const finalOvr = Math.round((stats.technique + stats.physique + stats.mental) / 3);

        let hiddenStats = {
            regularite: PlayerLogic.randomInt(1, 20),
            matchImportant: PlayerLogic.randomInt(1, 20),
            blessure: PlayerLogic.randomInt(1, 20)
        };

        return {
            id: Date.now(),
            firstName: formData.firstName,
            lastName: formData.lastName,
            nationality: formData.nationality,
            position: formData.position,
            origin: formData.originId,
            trait: originData.trait,
            ovr: finalOvr,
            pot: pot,
            stats: stats,
            hidden: hiddenStats
        };
    }
};

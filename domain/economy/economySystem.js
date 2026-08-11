// domain/economy/economySystem.js
import { TransferMarket } from '../transfer/transferSystem.js';

export const EconomyManager = {
    calculateMarketValue(player) {
        return TransferMarket.calculateMarketValue(player);
    },
    calculateContractOffer(club, player) {
        if (player?.careerProfile?.stage && player?.contract?.weeklySalary) return { ...player.contract };
        const weeklySalary = Math.round(100 + Math.random() * 200);
        const signingBonus = Math.round(this.calculateMarketValue(player) * 0.05);
        return { weeklySalary, signingBonus, durationYears: Math.floor(Math.random() * 3) + 2, type: player?.age >= 18 ? 'professionnel' : player?.age >= 16 ? 'semi_pro' : 'jeune' };
    },
    processBlockFinances(state, matchPerformance = null) {
        if (!state.player || !state.career) return;
        const blockSalary = (state.player.salary || 0) * 4;
        let matchBonus = 0;
        if (matchPerformance) {
            if (matchPerformance.rating >= 7.5) matchBonus += 1000;
            if (matchPerformance.goals > 0) matchBonus += matchPerformance.goals * 400;
            if (matchPerformance.assists > 0) matchBonus += matchPerformance.assists * 250;
        }
        const totalIncome = blockSalary + matchBonus;
        state.career.balance += totalIncome;
        let eventMessage = null;
        if (Math.random() < 0.08 && (state.player.fame || 10) > 30) {
            const sponsorBonus = (state.player.fame || 10) * 100;
            state.career.balance += sponsorBonus;
            eventMessage = `Contrat publicitaire local signé : +${sponsorBonus} €`;
        }
        return { blockSalary, matchBonus, totalIncome, eventMessage };
    },
    applyLifestyleChoice(state, choiceType) {
        const costs = {
            modeste: { cost: 0, moraleEffect: 0, fitnessEffect: 0, fameEffect: 0, label: 'Logement du centre de formation' },
            appartement: { cost: 2500, moraleEffect: 6, fitnessEffect: 3, fameEffect: 2, label: 'Appartement indépendant' },
            preparateur_perso: { cost: 6000, moraleEffect: 4, fitnessEffect: 8, fameEffect: 1, attributeBonus: { type: 'injuryProneness', value: 1 }, label: 'Préparateur physique personnel' },
            voiture_luxe: { cost: 12000, moraleEffect: 15, fitnessEffect: -3, fameEffect: 8, label: 'Berline de sport' }
        };
        const choice = costs[choiceType];
        if (!choice) return { success: false, message: 'Choix invalide.' };
        if (state.career.balance >= choice.cost) {
            state.career.balance -= choice.cost;
            state.player.morale = Math.min(100, Math.max(0, (state.player.morale || 50) + choice.moraleEffect));
            state.player.fitness = Math.min(100, Math.max(0, (state.player.fitness || 80) + choice.fitnessEffect));
            state.player.fame = Math.max(0, (state.player.fame || 10) + choice.fameEffect);
            if (choice.attributeBonus) {
                const attrKey = choice.attributeBonus.type;
                if (attrKey === 'injuryProneness' && state.player.hidden) state.player.hidden.injuryProneness = Math.min(20, Math.max(1, (state.player.hidden.injuryProneness || 10) + choice.attributeBonus.value));
                else if (state.player.attributes?.[attrKey] !== undefined) state.player.attributes[attrKey] = Math.min(99, Math.max(1, state.player.attributes[attrKey] + choice.attributeBonus.value));
            }
            return { success: true, message: `Validé : ${choice.label} (-${choice.cost} €)` };
        }
        return { success: false, message: 'Fonds insuffisants !' };
    }
};
export default EconomyManager;

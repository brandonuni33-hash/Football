// economy.js

export const EconomyManager = {
    // 1. Calcul de la valeur marchande du joueur (OVR + Âge)
    calculateMarketValue(player) {
        const baseValue = Math.max(10000, Math.pow(player.overall - 50, 3) * 5000);
        const ageMultiplier = player.age < 22 ? 1.5 : (player.age > 30 ? 0.6 : 1.0);
        return Math.round(baseValue * ageMultiplier);
    },

    // 2. Offre de contrat initiale (basée sur le prestige du club de l'étape 5)
    calculateContractOffer(club, player) {
        const prestigeFactor = club.prestige / 50;
        const ovrFactor = Math.max(1, player.overall - 50);
        
        const weeklySalary = Math.round(ovrFactor * prestigeFactor * 400 + (Math.random() * 200));
        const signingBonus = Math.round(this.calculateMarketValue(player) * 0.05);

        return {
            weeklySalary,
            signingBonus,
            durationYears: Math.floor(Math.random() * 3) + 2
        };
    },

    // 3. Gestion de la paie hebdomadaire + Primes de match potentielles
    processWeeklyFinances(state, matchPerformance = null) {
        if (!state.player || !state.career) return;

        let weeklyIncome = state.player.salary || 0;
        let matchBonus = 0;

        // Si le joueur a joué un match cette semaine, on calcule les primes de performance
        if (matchPerformance) {
            if (matchPerformance.rating >= 7.5) matchBonus += 250; // Prime bon match
            if (matchPerformance.goals > 0) matchBonus += matchPerformance.goals * 500; // Prime par but
            if (matchPerformance.assists > 0) matchBonus += matchPerformance.assists * 300; // Prime par passe dé
        }

        const totalIncome = weeklyIncome + matchBonus;
        state.career.balance += totalIncome;

        // Événements publicitaires selon la popularité (fame)
        let eventMessage = null;
        if (Math.random() < 0.05 && state.player.fame > 40) {
            const sponsorBonus = state.player.fame * 80;
            state.career.balance += sponsorBonus;
            eventMessage = `Contrat publicitaire local signé ! +${sponsorBonus} €`;
        }

        return {
            weeklyIncome,
            matchBonus,
            eventMessage
        };
    },

    // 4. Gestion du train de vie (Choix de dépenses personnelles)
    applyLifestyleChoice(state, choiceType) {
        // Choix de train de vie qui impactent le compte en banque, le moral ou la forme
        const costs = {
            'modeste': { cost: 0, moraleEffect: 0, fitnessEffect: 0, label: "Logement du centre de formation (Standard)" },
            'appartement': { cost: 1500, moraleEffect: 5, fitnessEffect: 2, label: "Appartement indépendant proche du stade" },
            'voiture_luxe': { cost: 5000, moraleEffect: 10, fitnessEffect: -2, label: "Achat d'une berline de sport (Attention aux sorties)" }
        };

        const choice = costs[choiceType];
        if (!choice) return false;

        if (state.career.balance >= choice.cost) {
            state.career.balance -= choice.cost;
            state.player.morale = Math.min(100, (state.player.morale || 50) + choice.moraleEffect);
            state.player.fitness = Math.min(100, (state.player.fitness || 80) + choice.fitnessEffect);
            return { success: true, message: `Choix validé : ${choice.label} (-${choice.cost} €)` };
        } else {
            return { success: false, message: "Fonds insuffisants pour ce train de vie !" };
        }
    }
};


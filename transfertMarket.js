// transferMarket.js

// Base de données simplifiée de clubs classés par "réputation" (1 à 5 étoiles)
const clubsDB = [
    { nom: "Real Madrid", pays: "Espagne", reputation: 5, minOvr: 85 },
    { nom: "Manchester City", pays: "Angleterre", reputation: 5, minOvr: 85 },
    { nom: "Bayern Munich", pays: "Allemagne", reputation: 5, minOvr: 84 },
    { nom: "Paris SG", pays: "France", reputation: 5, minOvr: 83 },
    { nom: "Juventus", pays: "Italie", reputation: 4.5, minOvr: 80 },
    { nom: "Borussia Dortmund", pays: "Allemagne", reputation: 4.5, minOvr: 79 },
    { nom: "Olympique Lyonnais", pays: "France", reputation: 4, minOvr: 75 },
    { nom: "Aston Villa", pays: "Angleterre", reputation: 4, minOvr: 76 },
    { nom: "Benfica", pays: "Portugal", reputation: 4, minOvr: 75 },
    { nom: "FC Nantes", pays: "France", reputation: 3, minOvr: 70 },
    { nom: "Sassuolo", pays: "Italie", reputation: 3, minOvr: 71 },
    { nom: "Toulouse FC", pays: "France", reputation: 2.5, minOvr: 65 },
    { nom: "Luton Town", pays: "Angleterre", reputation: 2.5, minOvr: 66 },
    { nom: "Amiens SC", pays: "France", reputation: 2, minOvr: 60 },
    { nom: "Pau FC", pays: "France", reputation: 1.5, minOvr: 55 }
];

// Nations "Premium" (top nations footballistiques qui boostent légèrement la valeur marketing)
const topNations = ["France", "Brésil", "Argentine", "Angleterre", "Espagne", "Allemagne", "Portugal", "Italie"];

export const TransferMarket = {
    /**
     * Calcule la valeur marchande réaliste du joueur
     */
    calculateMarketValue(player) {
        let ovr = player.overall || 50;
        let age = player.age || 18;
        let poste = player.position || "MC";
        let nationalite = player.nationality || "France";

        // 1. Valeur de base exponentielle selon le Général (OVR)
        // Ex: 60 OVR ~ 500k, 70 OVR ~ 2.5M, 80 OVR ~ 20M, 90 OVR ~ 90M
        let baseValue = 100000; 
        if (ovr > 50) {
            // Formule mathématique pour créer une courbe exponentielle réaliste
            baseValue = 100000 * Math.pow(1.18, (ovr - 50)); 
        }

        // 2. Multiplicateur d'Âge (Le potentiel coûte cher, la vieillesse décote)
        let ageMultiplier = 1.0;
        if (age <= 18) ageMultiplier = 1.8;
        else if (age <= 21) ageMultiplier = 1.5;
        else if (age <= 24) ageMultiplier = 1.2;
        else if (age <= 28) ageMultiplier = 1.0; // Prime de carrière
        else if (age <= 31) ageMultiplier = 0.7; // Début du déclin de valeur
        else if (age <= 34) ageMultiplier = 0.4;
        else ageMultiplier = 0.15; // Fin de carrière

        // 3. Multiplicateur de Poste (Les attaquants sont les plus chers)
        let positionMultiplier = 1.0;
        const attaquants = ["BU", "AT", "AG", "AD"];
        const milieuxOff = ["MOC", "MG", "MD"];
        const milieuxDef = ["MC", "MDC"];
        const defenseurs = ["DC", "DG", "DD"];
        
        if (attaquants.includes(poste)) positionMultiplier = 1.25;
        else if (milieuxOff.includes(poste)) positionMultiplier = 1.15;
        else if (milieuxDef.includes(poste)) positionMultiplier = 1.0;
        else if (defenseurs.includes(poste)) positionMultiplier = 0.85;
        else if (poste === "G") positionMultiplier = 0.7; // Gardien

        // 4. Multiplicateur de Nationalité (Marketing / Attrait international)
        let nationMultiplier = topNations.includes(nationalite) ? 1.1 : 1.0;

        // Calcul final et arrondi (on arrondit à la centaine de milliers la plus proche)
        let finalValue = baseValue * ageMultiplier * positionMultiplier * nationMultiplier;
        
        // Arrondir pour faire un chiffre propre (ex: 12 400 000 au lieu de 12 432 156)
        if (finalValue > 1000000) {
            finalValue = Math.round(finalValue / 100000) * 100000; 
        } else {
            finalValue = Math.round(finalValue / 10000) * 10000;
        }

        return finalValue;
    },

    /**
     * Génère un salaire hebdomadaire cohérent en fonction de la valeur et de l'âge
     */
    calculateWage(marketValue, age) {
        // En moyenne, le salaire annuel représente 10% de la valeur de transfert
        let annualWage = marketValue * 0.10; 
        
        // Les joueurs très jeunes ont des contrats de "rookie" (un peu plus bas)
        if (age <= 20) annualWage *= 0.7;
        // Les joueurs âgés libres ou en fin de contrat ont des salaires plus hauts par rapport à leur valeur marchande
        if (age >= 30) annualWage *= 1.5;

        let weeklyWage = annualWage / 52;
        return Math.round(weeklyWage / 100) * 100; // Arrondi à la centaine
    },

    /**
     * Tente de générer une offre de transfert
     */
    generateTransferOffer(player) {
        const playerOvr = player.overall || 65;
        const marketValue = this.calculateMarketValue(player);

        // Trouver les clubs dont le niveau correspond au joueur (Marge de -3 à +2 OVR)
        const clubsInteresses = clubsDB.filter(c => 
            playerOvr >= (c.minOvr - 3) && playerOvr <= (c.minOvr + 5)
        );

        // S'il n'y a pas de clubs de ce niveau dans notre DB, on abandonne
        if (clubsInteresses.length === 0) return null;

        // Tirer un club au hasard parmi les intéressés
        const clubAcheteur = clubsInteresses[Math.floor(Math.random() * clubsInteresses.length)];

        // Créer une offre de transfert (entre -10% et +20% de la valeur marchande)
        const variation = (Math.random() * 0.3) - 0.1; // -0.1 à +0.2
        const montantOffre = marketValue * (1 + variation);
        
        // Salaire proposé
        const salairePropose = this.calculateWage(marketValue, player.age);

        // Rôle dans l'équipe promis au joueur
        let role = "Remplaçant";
        if (playerOvr >= clubAcheteur.minOvr + 2) role = "Joueur Clé";
        else if (playerOvr >= clubAcheteur.minOvr) role = "Titulaire";
        else if (playerOvr >= clubAcheteur.minOvr - 2) role = "Rotation";

        return {
            club: clubAcheteur.nom,
            pays: clubAcheteur.pays,
            reputationClub: clubAcheteur.reputation,
            montant: Math.round(montantOffre / 10000) * 10000,
            salaireHebdo: salairePropose,
            rolePropose: role,
            message: `Le club de ${clubAcheteur.nom} (${clubAcheteur.pays}) a formulé une offre pour s'attacher vos services.`
        };
    },
    
    /**
     * Formate un prix en euros (ex: 1250000 -> "1.25 M €" ou "850 K €")
     */
    formatPrice(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(2) + " M €";
        } else if (number >= 1000) {
            return (number / 1000).toFixed(0) + " K €";
        }
        return number + " €";
    }
};

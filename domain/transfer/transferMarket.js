// domain/transfer/transferMarket.js

const clubsDB = [
    { nom: 'Real Madrid', pays: 'Espagne', reputation: 5, minOvr: 85 },
    { nom: 'Manchester City', pays: 'Angleterre', reputation: 5, minOvr: 85 },
    { nom: 'Bayern Munich', pays: 'Allemagne', reputation: 5, minOvr: 84 },
    { nom: 'Paris SG', pays: 'France', reputation: 5, minOvr: 83 },
    { nom: 'Juventus', pays: 'Italie', reputation: 4.5, minOvr: 80 },
    { nom: 'Borussia Dortmund', pays: 'Allemagne', reputation: 4.5, minOvr: 79 },
    { nom: 'Olympique Lyonnais', pays: 'France', reputation: 4, minOvr: 75 },
    { nom: 'Aston Villa', pays: 'Angleterre', reputation: 4, minOvr: 76 },
    { nom: 'Benfica', pays: 'Portugal', reputation: 4, minOvr: 75 },
    { nom: 'FC Nantes', pays: 'France', reputation: 3, minOvr: 70 },
    { nom: 'Sassuolo', pays: 'Italie', reputation: 3, minOvr: 71 },
    { nom: 'Toulouse FC', pays: 'France', reputation: 2.5, minOvr: 65 },
    { nom: 'Luton Town', pays: 'Angleterre', reputation: 2.5, minOvr: 66 },
    { nom: 'Amiens SC', pays: 'France', reputation: 2, minOvr: 60 },
    { nom: 'Pau FC', pays: 'France', reputation: 1.5, minOvr: 55 }
];
const topNations = ['France', 'Brésil', 'Argentine', 'Angleterre', 'Espagne', 'Allemagne', 'Portugal', 'Italie'];

export const TransferMarket = {
    calculateMarketValue(player) {
        const ovr = player.overall || 50, age = player.age || 18, poste = player.position || 'MC', nationalite = player.nationality || 'France';
        let baseValue = ovr > 50 ? 100000 * Math.pow(1.18, ovr - 50) : 100000;
        let ageMultiplier = 1;
        if (age <= 18) ageMultiplier = 1.8; else if (age <= 21) ageMultiplier = 1.5; else if (age <= 24) ageMultiplier = 1.2; else if (age <= 28) ageMultiplier = 1; else if (age <= 31) ageMultiplier = .7; else if (age <= 34) ageMultiplier = .4; else ageMultiplier = .15;
        const attaquants = ['BU', 'AT', 'AG', 'AD'], milieuxOff = ['MOC', 'MG', 'MD'], milieuxDef = ['MC', 'MDC'], defenseurs = ['DC', 'DG', 'DD'];
        let positionMultiplier = 1;
        if (attaquants.includes(poste)) positionMultiplier = 1.25; else if (milieuxOff.includes(poste)) positionMultiplier = 1.15; else if (milieuxDef.includes(poste)) positionMultiplier = 1; else if (defenseurs.includes(poste)) positionMultiplier = .85; else if (poste === 'G') positionMultiplier = .7;
        const nationMultiplier = topNations.includes(nationalite) ? 1.1 : 1;
        let finalValue = baseValue * ageMultiplier * positionMultiplier * nationMultiplier;
        finalValue = finalValue > 1000000 ? Math.round(finalValue / 100000) * 100000 : Math.round(finalValue / 10000) * 10000;
        return finalValue;
    },
    calculateWage(marketValue, age) {
        let annualWage = marketValue * .10;
        if (age <= 20) annualWage *= .7;
        if (age >= 30) annualWage *= 1.5;
        return Math.round((annualWage / 52) / 100) * 100;
    },
    generateTransferOffer(player) {
        const playerOvr = player.overall || 65, marketValue = this.calculateMarketValue(player);
        const clubsInteresses = clubsDB.filter(club => playerOvr >= club.minOvr - 3 && playerOvr <= club.minOvr + 5);
        if (!clubsInteresses.length) return null;
        const clubAcheteur = clubsInteresses[Math.floor(Math.random() * clubsInteresses.length)];
        const variation = Math.random() * .3 - .1;
        const montantOffre = marketValue * (1 + variation);
        const salairePropose = this.calculateWage(marketValue, player.age);
        let role = 'Remplaçant';
        if (playerOvr >= clubAcheteur.minOvr + 2) role = 'Joueur Clé'; else if (playerOvr >= clubAcheteur.minOvr) role = 'Titulaire'; else if (playerOvr >= clubAcheteur.minOvr - 2) role = 'Rotation';
        return { club: clubAcheteur.nom, pays: clubAcheteur.pays, reputationClub: clubAcheteur.reputation, montant: Math.round(montantOffre / 10000) * 10000, salaireHebdo: salairePropose, rolePropose: role, message: `Le club de ${clubAcheteur.nom} (${clubAcheteur.pays}) a formulé une offre pour s'attacher vos services.` };
    },
    formatPrice(value) {
        if (value >= 1000000) return `${(value / 1000000).toFixed(2)} M €`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)} K €`;
        return `${value} €`;
    }
};
export default TransferMarket;

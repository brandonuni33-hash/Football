// domain/competition/cupCatalog.js

export const ROUND_PLAN = [
    { round: 'Tour préliminaire', month: 9 },
    { round: '16es de finale', month: 10 },
    { round: '8es de finale', month: 1 },
    { round: 'Quarts de finale', month: 3 },
    { round: 'Demi-finales', month: 4 },
    { round: 'Finale', month: 5 }
];

export const COUNTRIES = {
    France: { id: 'COUPE_FR', name: 'Coupe de France', shortName: 'CDF', leagueIds: ['FR_L1', 'FR_L2'] },
    Angleterre: { id: 'COUPE_EN', name: 'FA Cup', shortName: 'FA Cup', leagueIds: ['EN_PL', 'EN_CH'] },
    Espagne: { id: 'COUPE_ES', name: 'Copa del Rey', shortName: 'Copa', leagueIds: ['ES_LA', 'ES_SD'] },
    Italie: { id: 'COUPE_IT', name: 'Coppa Italia', shortName: 'Coppa', leagueIds: ['IT_A', 'IT_B'] },
    Allemagne: { id: 'COUPE_DE', name: 'DFB-Pokal', shortName: 'Pokal', leagueIds: ['DE_B1', 'DE_B2'] }
};

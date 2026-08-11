// domain/competition/competitionCatalog.js
// Référentiel immuable des compétitions et du calendrier mensuel.

export const COMPETITIONS = {
    FR_L1: { id: 'FR_L1', name: 'Ligue 1', country: 'France', level: 1, type: 'league', matches: 34 },
    FR_L2: { id: 'FR_L2', name: 'Ligue 2', country: 'France', level: 2, type: 'league', matches: 34 },
    EN_PL: { id: 'EN_PL', name: 'Premier League', country: 'Angleterre', level: 1, type: 'league', matches: 38 },
    EN_CH: { id: 'EN_CH', name: 'Championship', country: 'Angleterre', level: 2, type: 'league', matches: 46 },
    ES_LA: { id: 'ES_LA', name: 'La Liga', country: 'Espagne', level: 1, type: 'league', matches: 38 },
    ES_SD: { id: 'ES_SD', name: 'Segunda División', country: 'Espagne', level: 2, type: 'league', matches: 42 },
    IT_A: { id: 'IT_A', name: 'Serie A', country: 'Italie', level: 1, type: 'league', matches: 38 },
    IT_B: { id: 'IT_B', name: 'Serie B', country: 'Italie', level: 2, type: 'league', matches: 38 },
    DE_B1: { id: 'DE_B1', name: 'Bundesliga', country: 'Allemagne', level: 1, type: 'league', matches: 34 },
    DE_B2: { id: 'DE_B2', name: '2. Bundesliga', country: 'Allemagne', level: 2, type: 'league', matches: 34 },
    NATIONAL_CUP: { id: 'NATIONAL_CUP', name: 'Coupe nationale', type: 'cup', matches: null },
    CHAMPIONS_LEAGUE: { id: 'CHAMPIONS_LEAGUE', name: 'Ligue des Champions', type: 'continental', matches: null },
    EURO: { id: 'EURO', name: 'Euro', type: 'international', matches: null },
    WORLD_CUP: { id: 'WORLD_CUP', name: 'Coupe du Monde', type: 'international', matches: null }
};

export const SEASON_MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];
export const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const MONTH_INFO = {
    1: { label: 'Janvier', phase: 'season', period: 'Seconde partie de saison' },
    2: { label: 'Février', phase: 'season', period: 'Seconde partie de saison' },
    3: { label: 'Mars', phase: 'season', period: 'Seconde partie de saison' },
    4: { label: 'Avril', phase: 'season', period: 'Sprint final' },
    5: { label: 'Mai', phase: 'finale', period: 'Fin des compétitions' },
    6: { label: 'Juin', phase: 'offseason', period: 'Bilan / sélections / intersaison' },
    7: { label: 'Juillet', phase: 'offseason', period: 'Repos / préparation / mercato' },
    8: { label: 'Août', phase: 'season', period: 'Pré-saison & reprise' },
    9: { label: 'Septembre', phase: 'season', period: 'Première partie de saison' },
    10: { label: 'Octobre', phase: 'season', period: 'Première partie de saison' },
    11: { label: 'Novembre', phase: 'season', period: 'Première partie de saison' },
    12: { label: 'Décembre', phase: 'season', period: 'Trêve hivernale / première partie de saison' }
};

export function seasonLabel(year) {
    return `${year}/${year + 1}`;
}

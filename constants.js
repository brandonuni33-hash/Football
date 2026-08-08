// constants.js

export const POSITIONS = [
    { id: 'BU', name: 'Buteur', type: 'Attaque' },
    { id: 'AD', name: 'Ailier Droit', type: 'Attaque' },
    { id: 'AG', name: 'Ailier Gauche', type: 'Attaque' },
    { id: 'MOC', name: 'Milieu Offensif', type: 'Milieu' },
    { id: 'MC', name: 'Milieu Central', type: 'Milieu' },
    { id: 'MDC', name: 'Milieu Défensif', type: 'Milieu' },
    { id: 'DD', name: 'Défenseur Droit', type: 'Défense' },
    { id: 'DG', name: 'Défenseur Gauche', type: 'Défense' },
    { id: 'DC', name: 'Défenseur Central', type: 'Défense' },
    { id: 'GK', name: 'Gardien', type: 'Gardien' }
];

export const ORIGINS = {
    ACADEMY: { id: 'ACADEMY', name: 'Centre de Formation', trait: 'Classique', modifiers: { mental: 10, tactique: 10, ovrBase: 0 } },
    AMATEUR: { id: 'AMATEUR', name: 'Club Amateur', trait: 'Acharné', modifiers: { physique: 10, tactique: -10, ovrBase: 0 } },
    FUTSAL: { id: 'FUTSAL', name: 'Futsal', trait: 'Dribbleur Fin', modifiers: { technique: 10, dribble: 10, ovrBase: 0 } },
    LATE_BLOOMER: { id: 'LATE_BLOOMER', name: 'Débutant Tardif', trait: 'Poulain Brut', modifiers: { physique: 5, ovrBase: -5 } },
    STREET: { id: 'STREET', name: 'Street Football', trait: 'Instinct 1v1', modifiers: { dribble: 10, tactique: -5, ovrBase: 0 } },
    ATHLETE: { id: 'ATHLETE', name: 'Athlète Polyvalent', trait: 'Moteur Hybride', modifiers: { vitesse: 15, puissance: 15, ovrBase: 0 } }
};

export const STARTING_CLUBS = [
    { id: 'FCGB', name: 'Bordeaux', league: 'Ligue 2', style: 'Reconstruction', expectation: 'Haute' },
    { id: 'FCN', name: 'Nantes', league: 'Ligue 1', style: 'Défensif / Contre', expectation: 'Moyenne' },
    { id: 'LOR', name: 'Lormont', league: 'Régional', style: 'Amateur Rugueux', expectation: 'Basse' },
    { id: 'PAU', name: 'Pau FC', league: 'Ligue 2', style: 'Bloc Médian', expectation: 'Moyenne' },
    { id: 'SCB', name: 'Bastia', league: 'Ligue 2', style: 'Chaudron / Pression', expectation: 'Haute' },
    { id: 'EAG', name: 'Guingamp', league: 'Ligue 2', style: 'Transition Rapide', expectation: 'Moyenne' },
    { id: 'FCSM', name: 'Sochaux', league: 'National', style: 'Formation', expectation: 'Haute' },
    { id: 'WRX', name: 'Wrexham', league: 'League One', style: 'Show Hollywoodien', expectation: 'Moyenne' }
];

export const PHASES = ['Pré-saison', 'Saison', 'Mercato', 'Fin de saison'];

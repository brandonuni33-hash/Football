// constants.js

export const POSITIONS = [
    { id: 'BU', name: 'Buteur' }, { id: 'AD', name: 'Ailier Droit' }, { id: 'AG', name: 'Ailier Gauche' },
    { id: 'MOC', name: 'Milieu Offensif' }, { id: 'MC', name: 'Milieu Central' },
    { id: 'DD', name: 'Défenseur Droit' }, { id: 'DG', name: 'Défenseur Gauche' }, { id: 'DC', name: 'Défenseur Central' },
    { id: 'GK', name: 'Gardien' }
];

export const CONTINENTS = {
    "Europe": [
        { id: 'FR', name: 'France', flag: '🇫🇷' }, { id: 'DE', name: 'Allemagne', flag: '🇩🇪' }, 
        { id: 'ES', name: 'Espagne', flag: '🇪🇸' }, { id: 'IT', name: 'Italie', flag: '🇮🇹' }, 
        { id: 'GB', name: 'Angleterre', flag: '🇬🇧' }, { id: 'PT', name: 'Portugal', flag: '🇵🇹' },
        { id: 'NL', name: 'Pays-Bas', flag: '🇳🇱' }, { id: 'BE', name: 'Belgique', flag: '🇧🇪' },
        { id: 'HR', name: 'Croatie', flag: '🇭🇷' }, { id: 'DK', name: 'Danemark', flag: '🇩🇰' },
        { id: 'RS', name: 'Serbie', flag: '🇷🇸' }, { id: 'UA', name: 'Ukraine', flag: '🇺🇦' },
        { id: 'PL', name: 'Pologne', flag: '🇵🇱' }, { id: 'SE', name: 'Suède', flag: '🇸🇪' },
        { id: 'AT', name: 'Autriche', flag: '🇦🇹' }, { id: 'CH', name: 'Suisse', flag: '🇨🇭' },
        { id: 'TR', name: 'Turquie', flag: '🇹🇷' }, { id: 'NO', name: 'Norvège', flag: '🇳🇴' },
        { id: 'CZ', name: 'Tchéquie', flag: '🇨🇿' }, { id: 'GR', name: 'Grèce', flag: '🇬🇷' }
    ],
    "Amérique du Sud": [
        { id: 'BR', name: 'Brésil', flag: '🇧🇷' }, { id: 'AR', name: 'Argentine', flag: '🇦🇷' }, 
        { id: 'UY', name: 'Uruguay', flag: '🇺🇾' }, { id: 'CO', name: 'Colombie', flag: '🇨🇴' }, 
        { id: 'CL', name: 'Chili', flag: '🇨🇱' }, { id: 'EC', name: 'Équateur', flag: 'Équateur' },
        { id: 'PE', name: 'Pérou', flag: '🇵🇪' }, { id: 'PY', name: 'Paraguay', flag: '🇵🇾' },
        { id: 'VE', name: 'Venezuela', flag: '🇻🇪' }, { id: 'BO', name: 'Bolivie', flag: '🇧🇴' },
        { id: 'GY', name: 'Guyana', flag: '🇬🇾' }, { id: 'SR', name: 'Suriname', flag: '🇸🇷' },
        { id: 'GF', name: 'Guyane', flag: '🇬🇫' }, { id: 'FK', name: 'Malouines', flag: '🇫🇰' },
        { id: 'AN', name: 'Antilles', flag: '🇳🇱' }, { id: 'CW', name: 'Curaçao', flag: '🇨🇼' },
        { id: 'AW', name: 'Aruba', flag: '🇦🇼' }, { id: 'TT', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
        { id: 'BB', name: 'Barbade', flag: '🇧🇧' }, { id: 'CL2', name: 'Région Australe', flag: '🇨🇱' }
    ],
    "Afrique": [
        { id: 'MA', name: 'Maroc', flag: '🇲🇦' }, { id: 'SN', name: 'Sénégal', flag: '🇸🇳' }, 
        { id: 'EG', name: 'Égypte', flag: '🇪🇬' }, { id: 'DZ', name: 'Algérie', flag: '🇩🇿' }, 
        { id: 'NGA', name: 'Nigeria', flag: '🇳🇬' }, { id: 'CM', name: 'Cameroun', flag: '🇨🇲' },
        { id: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' }, { id: 'ML', name: 'Mali', flag: '🇲🇱' },
        { id: 'GH', name: 'Ghana', flag: '🇬🇭' }, { id: 'CD', name: 'RD Congo', flag: '🇨🇩' },
        { id: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦' }, { id: 'TN', name: 'Tunisie', flag: '🇹🇳' },
        { id: 'BF', name: 'Burkina Faso', flag: '🇧🇫' }, { id: 'CV', name: 'Cap-Vert', flag: '🇨🇻' },
        { id: 'GN', name: 'Guinée', flag: '🇬🇳' }, { id: 'GQ', name: 'Guinée équatoriale', flag: 'GQ' },
        { id: 'ZM', name: 'Zambie', flag: '🇿🇲' }, { id: 'GA', name: 'Gabon', flag: '🇬🇦' },
        { id: 'AO', name: 'Angola', flag: '🇦🇴' }, { id: 'UG', name: 'Ouganda', flag: '🇺🇬' }
    ],
    "Asie": [
        { id: 'JP', name: 'Japon', flag: '🇯🇵' }, { id: 'KR', name: 'Corée du Sud', flag: '🇰🇷' },
        { id: 'IR', name: 'Iran', flag: '🇮🇷' }, { id: 'AU', name: 'Australie', flag: '🇦🇺' },
        { id: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦' }, { id: 'QA', name: 'Qatar', flag: '🇶🇦' },
        { id: 'IQ', name: 'Irak', flag: '🇮🇶' }, { id: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿' },
        { id: 'AE', name: 'Émirats arabes unis', flag: '🇦🇪' }, { id: 'CN', name: 'Chine', flag: '🇨🇳' },
        { id: 'JO', name: 'Jordanie', flag: '🇯🇴' }, { id: 'OM', name: 'Oman', flag: '🇴🇲' },
        { id: 'BH', name: 'Bahreïn', flag: '🇧🇭' }, { id: 'SY', name: 'Syrie', flag: '🇸🇾' },
        { id: 'VN', name: 'Vietnam', flag: '🇻🇳' }, { id: 'TH', name: 'Thaïlande', flag: '🇹🇭' },
        { id: 'IN', name: 'Inde', flag: '🇮🇳' }, { id: 'ID', name: 'Indonésie', flag: '🇮🇩' },
        { id: 'KP', name: 'Corée du Nord', flag: '🇰🇵' }, { id: 'LB', name: 'Liban', flag: '🇱🇧' }
    ],
    "Amérique du Nord, Centrale & Caraïbes": [
        { id: 'US', name: 'États-Unis', flag: '🇺🇸' }, { id: 'MX', name: 'Mexique', flag: '🇲🇽' },
        { id: 'CA', name: 'Canada', flag: '🇨🇦' }, { id: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
        { id: 'PA', name: 'Panama', flag: '🇵🇦' }, { id: 'JM', name: 'Jamaïque', flag: '🇯🇲' },
        { id: 'HN', name: 'Honduras', flag: '🇭🇳' }, { id: 'SV', name: 'Salvador', flag: '🇸🇻' },
        { id: 'CU', name: 'Cuba', flag: '🇨🇺' }, { id: 'HT', name: 'Haïti', flag: '🇭🇹' },
        { id: 'GT', name: 'Guatemala', flag: '🇬🇹' }, { id: 'DO', name: 'République dominicaine', flag: '🇩🇴' },
        { id: 'CW2', name: 'Curaçao', flag: '🇨🇼' }, { id: 'TT2', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
        { id: 'NI', name: 'Nicaragua', flag: '🇳🇮' }, { id: 'PR', name: 'Porto Rico', flag: '🇵🇷' },
        { id: 'GP', name: 'Guadeloupe', flag: '🇬🇵' }, { id: 'MQ', name: 'Martinique', flag: '🇲🇶' },
        { id: 'SR2', name: 'Suriname', flag: '🇸🇷' }, { id: 'KN', name: 'Saint-Kitts-et-Nevis', flag: '🇰🇳' }
    ]
};

export const ORIGINS = {
    CENTRE_FORMATION: { 
        id: 'CENTRE_FORMATION', 
        name: 'Centre de Formation', 
        trait: 'Classique', 
        desc: 'Issu d’une structure professionnelle reconnue. Le joueur bénéficie d’un bagage tactique supérieur et d’une forte attraction naturelle des recruteurs.',
        mults: { mental: 1.10 } 
    },
    CLUB_AMATEUR: { 
        id: 'CLUB_AMATEUR', 
        name: 'Club Amateur', 
        trait: 'Acharné', 
        desc: 'Formé sur les terrains boueux du football amateur. Un volume de jeu impressionnant et une mentalité de battant, mais un léger retard tactique.',
        mults: { physique: 1.10 } 
    },
    FUTSAL: { 
        id: 'FUTSAL', 
        name: 'Futsal', 
        trait: 'Dribbleur Fin', 
        desc: 'Maîtrise absolue du ballon dans de petits espaces. Des dribbles et un toucher de balle d’élite, compensant un profil physique moins athlétique au départ.',
        mults: { technique: 1.10, physique: 0.85 } 
    },
    STREET: { 
        id: 'STREET', 
        name: 'Street Football', 
        trait: 'Instinct 1v1', 
        desc: 'Pur produit du bitume. Une agressivité saine et un sens inné du duel en un contre un, au détriment parfois de la discipline collective.',
        mults: { technique: 1.10, discipline: 0.90 } 
    },
    ATHLETE: { 
        id: 'ATHLETE', 
        name: 'Athlète Polyvalent', 
        trait: 'Moteur Hybride', 
        desc: 'Un spécimen physique hors norme. Vitesse et puissance au-dessus de la moyenne, demandant un travail accru sur le plan technique.',
        mults: { physique: 1.15, technique: 0.90 } 
    },
    DEBUTANT_TARDIF: { 
        id: 'DEBUTANT_TARDIF', 
        name: 'Débutant Tardif', 
        trait: 'Poulain Brut', 
        desc: 'Arrivé tardivement dans le milieu compétitif. Des lacunes initiales marquées, mais un potentiel brut insoupçonné et imprévisible.',
        mults: { basePenalty: -5 } 
    },
    FILS_DE_PRO: { 
        id: 'FILS_DE_PRO', 
        name: 'Fils de Pro', 
        trait: 'Héritage Tactique', 
        desc: 'Baigné dans le milieu professionnel dès le berceau. Avantage de départ notable en réputation, en technique et un héritage financier précieux.',
        mults: { technique: 1.10, vitesse: 1.10 } 
    }
};

export const HEART_CLUBS = {
    "Premier League (Angleterre)": [
        { id: 'ARS', name: 'Arsenal' }, { id: 'MCI', name: 'Manchester City' }, 
        { id: 'LIV', name: 'Liverpool FC' }, { id: 'MUN', name: 'Manchester United' },
        { id: 'CHE', name: 'Chelsea FC' }, { id: 'TOT', name: 'Tottenham Hotspur' },
        { id: 'NEW', name: 'Newcastle United' }, { id: 'AST', name: 'Aston Villa' }
    ],
    "La Liga (Espagne)": [
        { id: 'RMA', name: 'Real Madrid' }, { id: 'FCB', name: 'FC Barcelone' }, 
        { id: 'ATM', name: 'Atlético de Madrid' }, { id: 'SEV', name: 'Sevilla FC' },
        { id: 'VIL', name: 'Villarreal CF' }, { id: 'RSO', name: 'Real Sociedad' },
        { id: 'BET', name: 'Real Betis' }, { id: 'ATH', name: 'Athletic Club' }
    ],
    "Serie A (Italie)": [
        { id: 'JUV', name: 'Juventus FC' }, { id: 'MIL', name: 'AC Milan' }, 
        { id: 'INT', name: 'Inter Milan' }, { id: 'NAP', name: 'SSC Naples' },
        { id: 'ROM', name: 'AS Rome' }, { id: 'LAZ', name: 'Lazio Rome' },
        { id: 'ATA', name: 'Atalanta Bergame' }, { id: 'FIO', name: 'AC Fiorentina' }
    ],
    "Bundesliga (Allemagne)": [
        { id: 'BAY', name: 'Bayern Munich' }, { id: 'BVB', name: 'Borussia Dortmund' },
        { id: 'RBL', name: 'RB Leipzig' }, { id: 'B04', name: 'Bayer Leverkusen' },
        { id: 'SGE', name: 'Eintracht Francfort' }, { id: 'VFB', name: 'VfB Stuttgart' },
        { id: 'BGL', name: 'Borussia Mönchengladbach' }, { id: 'WOL', name: 'VfL Wolfsburg' }
    ],
    "Ligue 1 (France)": [
        { id: 'PSG', name: 'Paris Saint-Germain' }, { id: 'OM', name: 'Olympique de Marseille' },
        { id: 'OL', name: 'Olympique Lyonnais' }, { id: 'ASM', name: 'AS Monaco' },
        { id: 'LOSC', name: 'LOSC Lille' }, { id: 'SRFC', name: 'Stade Rennais FC' },
        { id: 'OGCN', name: 'OGC Nice' }, { id: 'RCL', name: 'RC Lens' }
    ]
};

export const YOUTH_CLUBS_POOL = [
    // --- FRANCE (Régional, National 3 / National 2 & Pro) ---
    { name: 'FC Girondins de Bordeaux (Réserve / U19)', league: 'National 3 / U19 Nationaux', tier: 3, country: 'France', prestige: 52 },
    { name: 'Stade Bordelais', league: 'National 3', tier: 3, country: 'France', prestige: 44 },
    { name: 'Aviron Bayonnais FC', league: 'National 3', tier: 3, country: 'France', prestige: 42 },
    { name: 'Stade Montois', league: 'Régional 1', tier: 4, country: 'France', prestige: 35 },
    { name: 'Bergerac Périgord FC', league: 'National 2', tier: 3, country: 'France', prestige: 46 },
    { name: 'Trélissac FC', league: 'National 3', tier: 3, country: 'France', prestige: 41 },
    { name: 'US Lège-Cap-Ferret', league: 'National 3', tier: 3, country: 'France', prestige: 39 },
    { name: 'Angoulême Charente FC', league: 'National 2', tier: 3, country: 'France', prestige: 45 },
    { name: 'Stade Poitevin FC', league: 'National 3', tier: 3, country: 'France', prestige: 40 },
    { name: 'Blagnac FC', league: 'Régional 1', tier: 4, country: 'France', prestige: 34 },
    { name: 'Canet Roussillon FC', league: 'National 3', tier: 3, country: 'France', prestige: 43 },
    { name: 'AS Muret', league: 'Régional 1', tier: 4, country: 'France', prestige: 33 },
    { name: 'Paris Saint-Germain U19', league: 'National U19', tier: 1, country: 'France', prestige: 88 },
    { name: 'Olympique Lyonnais U19', league: 'National U19', tier: 1, country: 'France', prestige: 85 },
    { name: 'AS Monaco U19', league: 'National U19', tier: 1, country: 'France', prestige: 82 },
    { name: 'Stade Rennais U19', league: 'National U19', tier: 1, country: 'France', prestige: 80 },
    { name: 'FC Nantes U19', league: 'National U19', tier: 1, country: 'France', prestige: 78 },
    { name: 'Guingamp U19', league: 'National U19', tier: 2, country: 'France', prestige: 58 },
    { name: 'Le Havre AC U19', league: 'National U19', tier: 2, country: 'France', prestige: 62 },

    // --- ANGLETERRE (Non-League, County Leagues & Pro Academies) ---
    { name: 'Dulwich Hamlet Youth', league: 'Isthmian League Youth', tier: 4, country: 'Angleterre', prestige: 36 },
    { name: 'Hendon FC Academy', league: 'Isthmian Premier Youth', tier: 4, country: 'Angleterre', prestige: 34 },
    { name: 'Corinthian-Casuals FC', league: 'Isthmian South Central', tier: 4, country: 'Angleterre', prestige: 35 },
    { name: 'Marine FC Academy', league: 'Northern Premier Youth', tier: 4, country: 'Angleterre', prestige: 33 },
    { name: 'Chelmsford City Youth', league: 'National League South Youth', tier: 3, country: 'Angleterre', prestige: 42 },
    { name: 'Slough Town Juniors', league: 'National League South Youth', tier: 3, country: 'Angleterre', prestige: 40 },
    { name: 'Arsenal U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 85 },
    { name: 'Manchester City U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 90 },
    { name: 'Liverpool FC U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 88 },
    { name: 'Manchester United U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 87 },
    { name: 'Chelsea U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 86 },
    { name: 'Tottenham U18', league: 'Premier League U18', tier: 1, country: 'Angleterre', prestige: 82 },
    { name: 'Watford U18', league: 'Championship U18', tier: 2, country: 'Angleterre', prestige: 60 },
    { name: 'Coventry U18', league: 'Championship U18', tier: 2, country: 'Angleterre', prestige: 55 },
    { name: 'Leeds United U18', league: 'Championship U18', tier: 2, country: 'Angleterre', prestige: 65 },

    // --- ESPAGNE (Preferente, Tercera RFEF & Juvenil) ---
    { name: 'AD Alcorcón Juvenil B', league: 'Liga Nacional Juvenil', tier: 3, country: 'Espagne', prestige: 45 },
    { name: 'CD Leganés Juvenil B', league: 'Liga Nacional Juvenil', tier: 3, country: 'Espagne', prestige: 46 },
    { name: 'Rayo Vallecano Juvenil B', league: 'Liga Nacional Juvenil', tier: 3, country: 'Espagne', prestige: 48 },
    { name: 'CE Europa Juvenil', league: 'Preferente Juvenil', tier: 4, country: 'Espagne', prestige: 38 },
    { name: 'UE Cornellà Juvenil', league: 'División de Honor (Gr. 3)', tier: 2, country: 'Espagne', prestige: 58 },
    { name: 'Real Madrid Juvenil', league: 'División de Honor', tier: 1, country: 'Espagne', prestige: 92 },
    { name: 'FC Barcelone Juvenil', league: 'División de Honor', tier: 1, country: 'Espagne', prestige: 90 },
    { name: 'Atlético de Madrid Juvenil', league: 'División de Honor', tier: 1, country: 'Espagne', prestige: 85 },
    { name: 'Villarreal Juvenil', league: 'División de Honor', tier: 1, country: 'Espagne', prestige: 80 },
    { name: 'Real Betis Juvenil', league: 'División de Honor', tier: 1, country: 'Espagne', prestige: 78 },
    { name: 'Real Zaragoza Juvenil', league: 'División de Honor', tier: 2, country: 'Espagne', prestige: 58 },

    // --- ITALIE (Eccellenza, Serie D & Primavera) ---
    { name: 'ASD Trastevere Calcio U19', league: 'Juniores Nazionali', tier: 3, country: 'Italie', prestige: 43 },
    { name: 'Albalonga Calcio Youth', league: 'Eccellenza Lazio', tier: 4, country: 'Italie', prestige: 35 },
    { name: 'Ostia Mare Youth', league: 'Juniores Nazionali', tier: 3, country: 'Italie', prestige: 41 },
    { name: 'Pro Sesto Primavera', league: 'Campionato Primavera 3', tier: 3, country: 'Italie', prestige: 44 },
    { name: 'Juventus Primavera', league: 'Primavera 1', tier: 1, country: 'Italie', prestige: 86 },
    { name: 'Inter Milan Primavera', league: 'Primavera 1', tier: 1, country: 'Italie', prestige: 87 },
    { name: 'AC Milan Primavera', league: 'Primavera 1', tier: 1, country: 'Italie', prestige: 85 },
    { name: 'AS Rome Primavera', league: 'Primavera 1', tier: 1, country: 'Italie', prestige: 82 },
    { name: 'Atalanta Primavera', league: 'Primavera 1', tier: 1, country: 'Italie', prestige: 84 },
    { name: 'Brescia Primavera', league: 'Primavera 2', tier: 2, country: 'Italie', prestige: 55 },
    { name: 'Ascoli Primavera', league: 'Primavera 2', tier: 2, country: 'Italie', prestige: 52 },

    // --- ALLEMAGNE (Oberliga, Regionalliga & Bundesliga U19) ---
    { name: 'FC Viktoria 1889 Berlin U19', league: 'A-Junioren Regionalliga', tier: 3, country: 'Allemagne', prestige: 44 },
    { name: 'TSV 1860 Munich U19 (Réserve)', league: 'A-Junioren Bayernliga', tier: 3, country: 'Allemagne', prestige: 48 },
    { name: 'SV 07 Elversberg U19', league: 'A-Junioren Regionalliga', tier: 3, country: 'Allemagne', prestige: 42 },
    { name: 'Bonner SC Youth', league: 'A-Junioren Mittelrheinliga', tier: 4, country: 'Allemagne', prestige: 36 },
    { name: 'Bayern Munich U19', league: 'A-Junioren Bundesliga', tier: 1, country: 'Allemagne', prestige: 89 },
    { name: 'Borussia Dortmund U19', league: 'A-Junioren Bundesliga', tier: 1, country: 'Allemagne', prestige: 88 },
    { name: 'RB Leipzig U19', league: 'A-Junioren Bundesliga', tier: 1, country: 'Allemagne', prestige: 82 },
    { name: 'Bayer Leverkusen U19', league: 'A-Junioren Bundesliga', tier: 1, country: 'Allemagne', prestige: 81 },
    { name: 'Schalke 04 U19', league: 'A-Junioren Bundesliga', tier: 2, country: 'Allemagne', prestige: 68 },
    { name: 'Nuremberg U19', league: 'A-Junioren Bundesliga', tier: 2, country: 'Allemagne', prestige: 57 }
];

export const COACH_VISIONS = [
    { title: 'Formateur Patient', desc: 'Accorde du temps de jeu aux jeunes malgré les erreurs, favorise la progression technique pure.' },
    { title: 'Exigeant & Tactique', desc: 'Ne pardonne aucune largesse défensive. Demande une rigueur absolue et un replacement sans faille.' },
    { title: 'Prônant le Surclassement', desc: 'N’hésite pas à propulser les pépites directement dans les catégories d’âge supérieures si le talent brut est là.' },
    { title: 'Gérant de Résultats', desc: 'Joue la gagne à chaque match de championnat. Le temps de jeu se mérite uniquement par la performance immédiate.' },
    { title: 'Mentalité de Guerrier', desc: 'Met l’accent sur l’impact physique, l’intensité dans les duels et la force de caractère collective.' }
];

export const COACH_NAMES = [
    'Jean-Luc Van Der Broeck', 'Marco Rossi', 'David Miller', 'Christian Gourcuff Jr.', 
    'Javier Fernandez', 'Stefan Kuntz', 'Philippe Lucas', 'Roberto De Zerbi',
    'Matteo Guidi', 'Hans-Dieter Schmidt', 'Alan Smith', 'Thierry Goudet'
];

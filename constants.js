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
        { id: 'CL', name: 'Chili', flag: '🇨🇱' }, { id: 'EC', name: 'Équateur', flag: '🇪🇨' },
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
        { id: 'GN', name: 'Guinée', flag: '🇬🇳' }, { id: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶' },
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
    CENTRE_FORMATION: { id: 'CENTRE_FORMATION', name: 'Centre de Formation', trait: 'Classique', mults: { mental: 1.10 } },
    CLUB_AMATEUR: { id: 'CLUB_AMATEUR', name: 'Club Amateur', trait: 'Acharné', mults: { physique: 1.10 } },
    FUTSAL: { id: 'FUTSAL', name: 'Futsal', trait: 'Dribbleur Fin', mults: { technique: 1.10, physique: 0.85 } },
    STREET: { id: 'STREET', name: 'Street Football', trait: 'Instinct 1v1', mults: { technique: 1.10, discipline: 0.90 } },
    ATHLETE: { id: 'ATHLETE', name: 'Athlète Polyvalent', trait: 'Moteur Hybride', mults: { physique: 1.15, technique: 0.90 } },
    DEBUTANT_TARDIF: { id: 'DEBUTANT_TARDIF', name: 'Débutant Tardif', trait: 'Poulain Brut', mults: { basePenalty: -5 } },
    FILS_DE_PRO: { id: 'FILS_DE_PRO', name: 'Fils de Pro', trait: 'Héritage Tactique', mults: { technique: 1.10, vitesse: 1.10 } }
};

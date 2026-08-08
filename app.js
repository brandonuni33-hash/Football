// --- BLOC 1 : DONNÉES & STRUCTURE DE GÉNÉRATION (AVEC TAILLE & POIDS) ---

const POSITIONS = [
  { id: 'bu', label: 'BU' },
  { id: 'ad', label: 'AD' },
  { id: 'ag', label: 'AG' },
  { id: 'moc', label: 'MOC' },
  { id: 'mc', label: 'MC' },
  { id: 'dd', label: 'DD' },
  { id: 'dg', label: 'DG' },
  { id: 'dc', label: 'DC' },
  { id: 'gk', label: 'GK' }
];

// 15 plus gros pays par continent avec drapeaux
const NATIONALITIES = [
  // Europe
  { name: 'France', flag: '🇫🇷', continent: 'Europe' },
  { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', continent: 'Europe' },
  { name: 'Espagne', flag: '🇪🇸', continent: 'Europe' },
  { name: 'Allemagne', flag: '🇩🇪', continent: 'Europe' },
  { name: 'Italie', flag: '🇮🇹', continent: 'Europe' },
  { name: 'Pays-Bas', flag: '🇳🇱', continent: 'Europe' },
  { name: 'Portugal', flag: '🇵🇹', continent: 'Europe' },
  { name: 'Belgique', flag: '🇧🇪', continent: 'Europe' },
  { name: 'Croatie', flag: '🇭🇷', continent: 'Europe' },
  { name: 'Danemark', flag: '🇩🇰', continent: 'Europe' },
  { name: 'Suisse', flag: '🇨🇭', continent: 'Europe' },
  { name: 'Autriche', flag: '🇦🇹', continent: 'Europe' },
  { name: 'Pologne', flag: '🇵🇱', continent: 'Europe' },
  { name: 'Ukraine', flag: '🇺🇦', continent: 'Europe' },
  { name: 'Suède', flag: '🇸🇪', continent: 'Europe' },
  // Amérique du Sud
  { name: 'Brésil', flag: '🇧🇷', continent: 'Amérique du Sud' },
  { name: 'Argentine', flag: '🇦🇷', continent: 'Amérique du Sud' },
  { name: 'Uruguay', flag: '🇺🇾', continent: 'Amérique du Sud' },
  { name: 'Colombie', flag: '🇨🇴', continent: 'Amérique du Sud' },
  { name: 'Chili', flag: '🇨🇱', continent: 'Amérique du Sud' },
  { name: 'Pérou', flag: '🇵🇪', continent: 'Amérique du Sud' },
  { name: 'Équateur', flag: '🇪🇨', continent: 'Amérique du Sud' },
  { name: 'Paraguay', flag: '🇵🇾', continent: 'Amérique du Sud' },
  { name: 'Venezuela', flag: '🇻🇪', continent: 'Amérique du Sud' },
  { name: 'Bolivie', flag: '🇧🇴', continent: 'Amérique du Sud' },
  { name: 'USA', flag: '🇺🇸', continent: 'Amérique du Nord' },
  { name: 'Mexique', flag: '🇲🇽', continent: 'Amérique du Nord' },
  { name: 'Canada', flag: '🇨🇦', continent: 'Amérique du Nord' },
  // Afrique
  { name: 'Maroc', flag: '🇲🇦', continent: 'Afrique' },
  { name: 'Sénégal', flag: '🇸🇳', continent: 'Afrique' },
  { name: 'Nigeria', flag: '🇳🇬', continent: 'Afrique' },
  { name: 'Algérie', flag: '🇩🇿', continent: 'Afrique' },
  { name: 'Égypte', flag: '🇪🇬', continent: 'Afrique' },
  { name: 'Cameroun', flag: '🇨🇲', continent: 'Afrique' },
  { name: 'Ghana', flag: '🇬🇭', continent: 'Afrique' },
  { name: 'Côte d’Ivoire', flag: '🇨🇮', continent: 'Afrique' },
  { name: 'Mali', flag: '🇲🇱', continent: 'Afrique' },
  { name: 'Tunisie', flag: '🇹🇳', continent: 'Afrique' },
  // Asie
  { name: 'Japon', flag: '🇯🇵', continent: 'Asie' },
  { name: 'Corée du Sud', flag: '🇰🇷', continent: 'Asie' },
  { name: 'Arabie Saoudite', flag: '🇸🇦', continent: 'Asie' },
  { name: 'Iran', flag: '🇮🇷', continent: 'Asie' },
  { name: 'Australie', flag: '🇦🇺', continent: 'Asie' }
];

const ORIGINS = [
  { 
    id: 'centre', 
    name: 'Centre de Formation', 
    desc: '+10% Mental/Tactique | Trait: Classique (Attraction grands clubs)', 
    modifiers: { mental: 10, tactique: 10 }, 
    trait: 'Classique' 
  },
  { 
    id: 'amateur', 
    name: 'Club Amateur', 
    desc: '+10% Physique/Endurance, -10% Tactique | Trait: Acharné (XP Mental +15%)', 
    modifiers: { physique: 10, tactique: -10 }, 
    trait: 'Acharné' 
  },
  { 
    id: 'futsal', 
    name: 'Futsal', 
    desc: '+10% Dribble/Technique, -15% Physique | Trait: Dribbleur Fin', 
    modifiers: { technique: 10, physique: -15 }, 
    trait: 'Dribbleur Fin' 
  },
  { 
    id: 'tardif', 
    name: 'Débutant Tardif', 
    desc: '-5 OVR base | Trait: Poulain Brut (Potentiel flou 65-99)', 
    modifiers: { ovrOffset: -5 }, 
    trait: 'Poulain Brut' 
  },
  { 
    id: 'street', 
    name: 'Street Football', 
    desc: '+10% Agressivité/Dribble, -10% Discipline/Placement | Trait: Instinct 1v1', 
    modifiers: { technique: 10, discipline: -10 }, 
    trait: 'Instinct 1v1' 
  },
  { 
    id: 'athlete', 
    name: 'Athlète Polyvalent', 
    desc: '+15% Vitesse/Puissance, -10% Toucher | Trait: Moteur Hybride', 
    modifiers: { physique: 15, technique: -10 }, 
    trait: 'Moteur Hybride' 
  },
  { 
    id: 'fils_pro', 
    name: 'Fils de Pro', 
    desc: '+10 Vitesse/Technique | Trait: Héritage Tactique, mediaHype = 80', 
    modifiers: { technique: 10, physique: 10, mediaHype: 80 }, 
    trait: 'Héritage Tactique',
    exclusiveGen2: true 
  }
];

// État initial de l'application enrichi avec la morphologie
let state = {
  step: 1, // Étape 1 : Identité, Nationalité, Taille, Poids
  player: JSON.parse(localStorage.getItem('career_rpg_save')) || null,
  form: {
    firstName: 'Brandon',
    lastName: 'Le Moan',
    nationality: NATIONALITIES[0],
    height: 180, // en cm par défaut
    weight: 75,  // en kg par défaut
    position: 'BU',
    origin: ORIGINS[0]
  },
  weekLogs: []
};

// Fonction utilitaire pour générer des entiers aléatoires
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- BLOC 2 : GÉNÉRATION DU JOUEUR & CALCUL DES STATS ---

function generatePlayer(formData) {
  // 1. Calcul du Général (OVR) de base (35-50)
  let baseOvr = randInt(35, 50);
  
  // Appliquer le malus si "Débutant Tardif"
  if (formData.origin.id === 'tardif') baseOvr += formData.origin.modifiers.ovrOffset;

  // 2. Calcul du Potentiel (POT)
  let basePot = randInt(70, 99);
  if (basePot > 98) basePot = randInt(88, 95);

  // 3. Calcul des Stats selon la Morphologie
  // Plus c'est grand/lourd, plus le physique monte et la technique baisse
  const physicalBonus = Math.floor((formData.height / 10) + (formData.weight / 10));
  const technicalPenalty = Math.floor((formData.height / 20) + (formData.weight / 20));

  // 4. Initialisation des Stats (0-100)
  let stats = {
    technique: Math.max(0, Math.min(100, 40 - technicalPenalty + (formData.origin.modifiers.technique || 0))),
    physique: Math.max(0, Math.min(100, 40 + physicalBonus + (formData.origin.modifiers.physique || 0))),
    mental: 40 + (formData.origin.modifiers.mental || 0),
    charisme: randInt(20, 60),
    reputation: 10,
    discipline: 50 + (formData.origin.modifiers.discipline || 0),
    relationCoach: 50,
    vestiaire: 50
  };

  // 5. Stats Cachées (1-20)
  const hiddenStats = {
    regularite: randInt(1, 20),
    matchImportant: randInt(1, 20),
    blessure: randInt(1, 20) // Plus c'est haut, plus le risque est élevé
  };

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    nationality: formData.nationality,
    position: formData.position,
    origin: formData.origin,
    height: formData.height,
    weight: formData.weight,
    ovr: baseOvr,
    pot: basePot,
    stats: stats,
    hidden: hiddenStats,
    traits: [formData.origin.trait],
    history: []
  };
}

// Exemple d'utilisation : 
// const monJoueur = generatePlayer(state.form);
// console.log(monJoueur);

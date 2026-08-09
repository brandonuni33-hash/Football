/**
 * ============================================================
 *  SYSTÈME DE PROGRESSION — "STREET TO PRO"
 *  Attributs, Général (OVR), potentiel caché, plafonds et
 *  courbe de progression du joueur.
 * ------------------------------------------------------------
 *  Sommaire :
 *   1. Constantes & données de référence (origines, postes, paliers)
 *   2. Utilitaires internes
 *   3. Pilier 1 & 5 : initialiserJoueur()
 *   4. Pilier 2      : calculerGeneral()
 *   5. Pilier 3      : potentiel caché & indices agent
 *   6. Pilier 4      : courbe d'XP, plafonds, appliquerProgression()
 *   7. Exports
 * ============================================================
 */

import { PotentialSystem } from './potentialSystem.js';

// ============================================================
// 1. CONSTANTES & DONNÉES DE RÉFÉRENCE
// ============================================================

/** Les 7 sous-attributs du joueur, notés de 1 à 99. */
export const ATTRIBUTS = [
  'vitesse', 'tir', 'passes', 'dribble', 'defense', 'physique', 'tete',
];

const STAT_BASE = 40; // socle commun à tous les joueurs avant modificateurs
const STAT_MIN = 1;
const STAT_MAX = 99;

/**
 * Pondération du Général (OVR) par poste — chaque table pèse 1.00.
 * (GB volontairement absent ici : nécessiterait des attributs dédiés
 * type Réflexes/Plongeon, à ajouter dans un module gardien séparé.)
 */
export const POSTES_PONDERATION = {
  DC:   { defense: 0.35, physique: 0.25, tete: 0.20, passes: 0.10, vitesse: 0.05, dribble: 0.03, tir: 0.02 },
  LAT:  { vitesse: 0.25, defense: 0.25, physique: 0.15, passes: 0.15, dribble: 0.15, tete: 0.03, tir: 0.02 },
  MDEF: { defense: 0.30, passes: 0.25, physique: 0.20, dribble: 0.10, vitesse: 0.08, tete: 0.05, tir: 0.02 },
  MOFF: { passes: 0.28, dribble: 0.25, tir: 0.18, vitesse: 0.12, physique: 0.10, defense: 0.05, tete: 0.02 },
  AIL:  { vitesse: 0.28, dribble: 0.28, tir: 0.18, passes: 0.14, physique: 0.08, defense: 0.02, tete: 0.02 },
  BU:   { tir: 0.35, tete: 0.18, physique: 0.15, vitesse: 0.15, dribble: 0.12, passes: 0.03, defense: 0.02 },
  GK:   { defense: 0.35, physique: 0.20, vitesse: 0.15, tete: 0.10, passes: 0.10, dribble: 0.05, tir: 0.05 },
};

/** Paliers de potentiel caché (Pilier 3) : fourchette du Potentiel Max tiré au sort. */
export const TIERS_POTENTIEL = [
  { id: 'limite',        label: 'Limité',        min: 69, max: 74 },
  { id: 'prometteur',    label: 'Prometteur',    min: 75, max: 77 },
  { id: 'talentueux',    label: 'Talentueux',    min: 78, max: 80 },
  { id: 'exceptionnel',  label: 'Exceptionnel',  min: 81, max: 89 },
  { id: 'generationnel', label: 'Générationnel', min: 90, max: 99 },
];

/**
 * Origines (Pilier 1) — reprend les 7 archétypes du master prompt.
 * Chaque entrée définit :
 *  - deltas       : bonus/malus de stats de départ (asymétriques)
 *  - affinites    : multiplicateur de vitesse de progression par stat
 *  - distribution : poids de chaque tier de potentiel (doit sommer à 1)
 */
export const ORIGINES = {
  FUTSAL: {
    label: 'Futsal',
    description: "Excellent technicien formé en surface réduite : contrôle et vista au-dessus de la moyenne, lacunes physiques et aériennes.",
    deltas:    { vitesse: 5,  tir: 6,  passes: 12, dribble: 22, defense: -8,  physique: -15, tete: -18 },
    affinites: { vitesse: 1.0, tir: 1.05, passes: 1.15, dribble: 1.3, defense: 0.9, physique: 0.75, tete: 0.7 },
    distribution: { limite: 0.05, prometteur: 0.45, talentueux: 0.30, exceptionnel: 0.15, generationnel: 0.05 },
  },
  AMATEUR_QUARTIER: {
    label: 'Amateur de quartier',
    description: "Formé sur les terrains vagues / club amateur : vif et créatif balle au pied, peu structuré tactiquement.",
    deltas:    { vitesse: 8, tir: -2, passes: -8, dribble: 10, defense: -5, physique: 5, tete: -5 },
    affinites: { vitesse: 1.1, tir: 0.95, passes: 0.85, dribble: 1.1, defense: 0.85, physique: 1.0, tete: 0.9 },
    distribution: { limite: 0.25, prometteur: 0.60, talentueux: 0.10, exceptionnel: 0.04, generationnel: 0.01 },
  },
  CENTRE_FORMATION: {
    label: 'Centre de formation',
    description: "Passé par l'académie : bases tactiques, physiques et défensives solides, créativité brute plus limitée.",
    deltas:    { vitesse: 5, tir: 2, passes: 12, dribble: -5, defense: 10, physique: 8, tete: 8 },
    affinites: { vitesse: 1.0, tir: 1.0, passes: 1.05, dribble: 0.9, defense: 1.05, physique: 1.05, tete: 1.0 },
    distribution: { limite: 0.05, prometteur: 0.50, talentueux: 0.25, exceptionnel: 0.15, generationnel: 0.05 },
  },
  STREET_CAGE: {
    label: 'Street / Cage',
    description: "Forgé dans les cages urbaines (street football) : dribble et vitesse à l'état brut, profil très irrégulier, capable de pépites rares.",
    deltas:    { vitesse: 12, tir: 5, passes: -12, dribble: 25, defense: -15, physique: -8, tete: -12 },
    affinites: { vitesse: 1.15, tir: 1.05, passes: 0.8, dribble: 1.35, defense: 0.75, physique: 0.85, tete: 0.7 },
    distribution: { limite: 0.20, prometteur: 0.35, talentueux: 0.15, exceptionnel: 0.15, generationnel: 0.15 },
  },
  DEBUTANT_TARDIF: {
    label: 'Débutant tardif',
    description: "A commencé le foot tard : fondamentaux techniques faibles au départ, mais apprend très vite (fort potentiel de rattrapage).",
    deltas:    { vitesse: 10, tir: -10, passes: -15, dribble: -18, defense: -10, physique: 8, tete: -5 },
    affinites: { vitesse: 1.0, tir: 1.2, passes: 1.15, dribble: 1.15, defense: 1.1, physique: 1.0, tete: 1.05 },
    distribution: { limite: 0.30, prometteur: 0.50, talentueux: 0.12, exceptionnel: 0.06, generationnel: 0.02 },
  },
  ATHLETE_POLYVALENT: {
    label: 'Athlète polyvalent',
    description: "Vient d'un autre sport (athlétisme, basket...) : moteur physique exceptionnel, technique football encore brute.",
    deltas:    { vitesse: 15, tir: -12, passes: -10, dribble: -15, defense: -3, physique: 18, tete: 5 },
    affinites: { vitesse: 0.95, tir: 1.1, passes: 1.05, dribble: 1.05, defense: 1.0, physique: 0.9, tete: 1.0 },
    distribution: { limite: 0.10, prometteur: 0.55, talentueux: 0.20, exceptionnel: 0.10, generationnel: 0.05 },
  },
  FILS_DE_PRO: {
    label: 'Fils de pro',
    description: "A grandi dans les vestiaires professionnels : bases techniques et mentales précoces, profil précocement complet.",
    deltas:    { vitesse: 3, tir: 8, passes: 10, dribble: 8, defense: 5, physique: 2, tete: 5 },
    affinites: { vitesse: 1.0, tir: 1.05, passes: 1.05, dribble: 1.0, defense: 1.0, physique: 1.0, tete: 1.0 },
    distribution: { limite: 0.03, prometteur: 0.37, talentueux: 0.30, exceptionnel: 0.22, generationnel: 0.08 },
  },
};

/** Courbe d'XP par niveau (Pilier 4) : croissance exponentielle. */
const XP_NIVEAU_BASE = 500;
const XP_NIVEAU_CROISSANCE = 1.18;
const XP_NIVEAU_MAX_ITER = 300;

/** Conversion XP -> points d'entraînement disponibles à répartir sur les stats. */
const COEFFICIENT_XP_VERS_POINTS = 0.05;

/** Facteur multiplicatif de progression selon l'âge (Pilier 4 — plafond lié à l'âge). */
const PALIERS_AGE = [
  { max: 15, facteur: 0.58 },
  { max: 16, facteur: 0.68 },
  { max: 17, facteur: 0.80 },
  { max: 18, facteur: 0.92 },
  { max: 19, facteur: 1.00 },
  { max: 22, facteur: 1.05 },
  { max: 25, facteur: 0.98 },
  { max: 28, facteur: 0.88 },
  { max: 30, facteur: 0.72 },
  { max: 33, facteur: 0.52 },
  { max: 35, facteur: 0.36 },
  { max: 38, facteur: 0.22 },
  { max: 41, facteur: 0.12 },
  { max: Infinity, facteur: 0.06 },
];

const AGE_DEBUT_DECLIN = 31; // déclin physique progressif en fin de saison

// ============================================================
// 2. UTILITAIRES
// ============================================================

const clamp = (valeur, min, max) => Math.min(max, Math.max(min, valeur));
const entierAleatoire = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Tirage pondéré simple : distribution = { id: poids, ... }. */
function tirageAleatoirePondere(distribution) {
  const entrees = Object.entries(distribution);
  const total = entrees.reduce((somme, [, poids]) => somme + poids, 0);
  let tirage = Math.random() * total;
  for (const [id, poids] of entrees) {
    tirage -= poids;
    if (tirage <= 0) return id;
  }
  return entrees[entrees.length - 1][0];
}

function obtenirFacteurAge(age) {
  return PALIERS_AGE.find((palier) => age <= palier.max).facteur;
}

/**
 * Ralentissement logarithmique de l'apprentissage à mesure qu'on approche
 * du plafond : proche de 1 loin du plafond, proche de 0 tout contre.
 */
function facteurRalentissementLog(valeurActuelle, plafond) {
  if (plafond <= STAT_MIN) return 0;
  const marge = Math.max(0, plafond - valeurActuelle);
  return Math.log(1 + marge) / Math.log(1 + plafond);
}

// ============================================================
// 3. PILIER 1 & 5 : INITIALISATION DU JOUEUR
// ============================================================

/**
 * Crée un nouveau joueur à partir de son origine et de son poste.
 * @param {keyof typeof ORIGINES} origine
 * @param {keyof typeof POSTES_PONDERATION} poste
 * @param {number} [age=16] Âge de départ
 */
export function initialiserJoueur(origine, poste, age = 14) {
  const profilOrigine = ORIGINES[origine];
  const ponderationPoste = POSTES_PONDERATION[poste];
  if (!profilOrigine) throw new Error(`Origine inconnue : "${origine}"`);
  if (!ponderationPoste) throw new Error(`Poste inconnu : "${poste}"`);

  // Nouveau moteur : le potentiel initial est volontairement resserré à 75–80.
  // L'origine ne décide plus seule du plafond : elle influence surtout le profil
  // de développement et les affinités.
  const potentialProfile = PotentialSystem.createProfile();
  const potentielMax = potentialProfile.current;

  // Plafonds par attribut : dérivés du potentiel max, nuancés par le profil
  // de l'origine (un futsaleur peut plafonner en dribble au-dessus de son
  // OVR final, mais très en dessous en physique).
  const plafondsStats = {};
  ATTRIBUTS.forEach((attribut) => {
    const nuance = Math.round((profilOrigine.deltas[attribut] || 0) / 3);
    plafondsStats[attribut] = clamp(potentielMax + nuance, 35, STAT_MAX);
  });

  // Stats de départ : socle commun + delta d'origine asymétrique + variance,
  // jamais au-dessus du plafond de l'attribut.
  const stats = {};
  const progressionAccumulee = {};
  ATTRIBUTS.forEach((attribut) => {
    const brut = STAT_BASE + (profilOrigine.deltas[attribut] || 0) + entierAleatoire(-4, 4);
    stats[attribut] = clamp(Math.min(brut, plafondsStats[attribut]), STAT_MIN, STAT_MAX);
    progressionAccumulee[attribut] = 0;
  });

  const joueur = {
    origine,
    poste,
    age: Math.max(14, Number(age) || 14),
    xp: 0,
    niveauXP: 1,
    stats,
    plafondsStats,
    progressionAccumulee,
    affinites: profilOrigine.affinites,
    potentielMax,          // compatibilité : synchronisé avec potentialProfile.current
    potentialProfile,
    origineDeltas: profilOrigine.deltas,
    general: 0,
    historique: [],
  };

  joueur.general = calculerGeneral(joueur.stats, joueur.poste);
  return joueur;
}

// ============================================================
// 4. PILIER 2 : CALCUL DU GÉNÉRAL (OVR)
// ============================================================

/**
 * Général (OVR) = moyenne pondérée selon l'importance de chaque attribut
 * pour le poste occupé — jamais une moyenne brute.
 */
export function calculerGeneral(stats, poste, plafondGeneral = null) {
  const ponderation = POSTES_PONDERATION[poste];
  if (!ponderation) throw new Error(`Poste inconnu : "${poste}"`);

  const somme = Object.entries(ponderation).reduce(
    (acc, [attribut, poids]) => acc + (stats[attribut] ?? STAT_MIN) * poids,
    0
  );
  return clamp(Math.round(somme), STAT_MIN, STAT_MAX);
}

// ============================================================
// 5. PILIER 3 : POTENTIEL CACHÉ & INDICES DE L'AGENT
// ============================================================

/** Indice qualitatif donné par l'agent — ne révèle jamais le chiffre exact. */
function obtenirIndiceAgent(joueur) {
  const potentiel = clamp(Number(joueur.potentielMax) || 69, 69, 99);
  const tier = TIERS_POTENTIEL.find(
    (t) => potentiel >= t.min && potentiel <= t.max
  ) || TIERS_POTENTIEL[0];
  const ecart = potentiel - joueur.general;

  const phrasesTier = {
    limite: "Ton agent reste prudent : ce profil semble avoir un plafond assez proche.",
    correct: "Ton agent pense que tu peux devenir un joueur fiable, sans plus.",
    prometteur: "Ton agent est confiant : « Tu as un vrai potentiel, continue comme ça. »",
    talentueux: "Ton agent s'enthousiasme : « Tu peux viser un rôle de titulaire à haut niveau. »",
    exceptionnel: "Ton agent est sous le charme : « Ton potentiel est exceptionnel, ne le gâche pas. »",
    generationnel: "Ton agent chuchote presque : « Des joueurs comme toi, on en voit une fois par génération. »",
  };

  let phraseEcart;
  if (ecart <= 1) phraseEcart = "Tu sembles proche de ton plafond actuel.";
  else if (ecart <= 5) phraseEcart = "Il te reste une petite marge de progression.";
  else if (ecart <= 12) phraseEcart = "Tu as encore une belle marge devant toi.";
  else phraseEcart = "Tu es encore très loin d'exploiter tout ton potentiel.";

  return `${phrasesTier[tier.id]} ${phraseEcart}`;
}

/**
 * Vérifie l'état du joueur par rapport à son potentiel caché et à ses
 * plafonds (âge / potentiel), corrige les incohérences éventuelles et
 * renvoie un rapport exploitable par l'UI (fiche joueur, agent, etc.).
 */
export function verifierPotentielEtPlafonds(joueur) {
  // Filet de sécurité : aucun attribut ne doit dépasser son plafond personnel.
  const correctionsAppliquees = [];
  ATTRIBUTS.forEach((attribut) => {
    const plafond = joueur.plafondsStats[attribut];
    if (joueur.stats[attribut] > plafond) {
      correctionsAppliquees.push(attribut);
      joueur.stats[attribut] = plafond;
    }
  });
  if (correctionsAppliquees.length) {
    joueur.general = calculerGeneral(joueur.stats, joueur.poste, joueur.potentialProfile?.current ?? joueur.potentielMax);
  }

  const facteurAge = obtenirFacteurAge(joueur.age);
  const ecartPotentiel = (joueur.potentialProfile?.current ?? joueur.potentielMax) - joueur.general;
  const statsAuPlafond = ATTRIBUTS.filter((a) => joueur.stats[a] >= joueur.plafondsStats[a]);
  const statsProchesDuPlafond = ATTRIBUTS.filter(
    (a) => !statsAuPlafond.includes(a) && joueur.plafondsStats[a] - joueur.stats[a] <= 3
  );

  return {
    general: joueur.general,
    potentielMax: joueur.potentielMax,
    ecartPotentiel,
    potentielAtteint: ecartPotentiel <= 0,
    plafondBloqueParAge: facteurAge <= 0.3,
    facteurAge,
    statsAuPlafond,
    statsProchesDuPlafond,
    correctionsAppliquees,
    indiceAgent: obtenirIndiceAgent(joueur),
  };
}

// ============================================================
// 6. PILIER 4 : COURBE D'XP ET PROGRESSION
// ============================================================

/** XP cumulé nécessaire pour atteindre un niveau donné (croissance exponentielle). */
function xpRequisPourNiveau(niveau) {
  return Math.round(XP_NIVEAU_BASE * Math.pow(XP_NIVEAU_CROISSANCE, niveau - 1));
}

function calculerNiveauDepuisXP(xpTotal) {
  let niveau = 1;
  let xpRestant = xpTotal;
  while (niveau < XP_NIVEAU_MAX_ITER && xpRestant >= xpRequisPourNiveau(niveau)) {
    xpRestant -= xpRequisPourNiveau(niveau);
    niveau += 1;
  }
  return { niveau, xpDansNiveau: xpRestant, xpProchainNiveau: xpRequisPourNiveau(niveau) };
}

/** Déclin lié à l'âge, appliqué uniquement lors d'un tick de fin de saison. */
function appliquerDeclinAge(joueur) {
  if (joueur.age < AGE_DEBUT_DECLIN) return {};
  const intensite = (joueur.age - AGE_DEBUT_DECLIN + 1) * 0.6;
  const declin = {
    vitesse: Math.round(intensite),
    physique: Math.round(intensite * 0.8),
    tete: Math.round(intensite * 0.3),
  };
  Object.entries(declin).forEach(([attribut, valeur]) => {
    joueur.stats[attribut] = clamp(joueur.stats[attribut] - valeur, STAT_MIN, STAT_MAX);
  });
  return declin;
}

/**
 * Applique un gain de progression (match, entraînement, choix de carrière
 * ou fin de saison), en respectant le ralentissement logarithmique près du
 * potentiel et le facteur d'âge.
 *
 * @param {object} joueur
 * @param {object} gains
 * @param {number} gains.xp XP gagnée
 * @param {'entrainement'|'match'|'choixCarriere'|'finSaison'} [gains.type]
 * @param {Object<string, number>} [gains.repartition] Poids par attribut (défaut : pondération du poste)
 * @param {boolean} [gains.vieillirDUnAn] Incrémente l'âge et déclenche le déclin si besoin
 */
export function appliquerProgression(joueur, gains) {
  const { xp = 0, type = 'entrainement', repartition, vieillirDUnAn = false } = gains;

  joueur.xp += xp;
  const infoNiveau = calculerNiveauDepuisXP(joueur.xp);
  joueur.niveauXP = infoNiveau.niveau;

  const facteurAge = obtenirFacteurAge(joueur.age);
  const facteurPic = PotentialSystem.getPeakMultiplier(joueur);
  const pointsDisponibles = xp * COEFFICIENT_XP_VERS_POINTS * facteurAge * facteurPic;
  const repartitionFinale = repartition || POSTES_PONDERATION[joueur.poste];

  const detailGains = {};
  ATTRIBUTS.forEach((attribut) => {
    const part = repartitionFinale[attribut] || 0;
    if (part <= 0 || pointsDisponibles <= 0) {
      detailGains[attribut] = 0;
      return;
    }

    const plafond = joueur.plafondsStats[attribut];
    const valeurActuelle = joueur.stats[attribut];
    const facteurLog = facteurRalentissementLog(valeurActuelle, plafond);
    const affinite = joueur.affinites[attribut] || 1;

    const gainEffectif = pointsDisponibles * part * facteurLog * affinite;
    joueur.progressionAccumulee[attribut] += gainEffectif;

    let pointsGagnes = 0;
    while (joueur.progressionAccumulee[attribut] >= 1 && joueur.stats[attribut] < plafond) {
      joueur.stats[attribut] += 1;
      joueur.progressionAccumulee[attribut] -= 1;
      pointsGagnes += 1;
    }
    if (joueur.stats[attribut] >= plafond) joueur.progressionAccumulee[attribut] = 0;

    detailGains[attribut] = pointsGagnes;
  });

  let declinAppliqueAge = {};
  if (vieillirDUnAn) {
    joueur.age += 1;
    declinAppliqueAge = appliquerDeclinAge(joueur);
  } else if (type === 'finSaison') {
    declinAppliqueAge = appliquerDeclinAge(joueur);
  }

  joueur.general = calculerGeneral(joueur.stats, joueur.poste, joueur.potentialProfile?.current ?? joueur.potentielMax);
  const rapportPotentiel = verifierPotentielEtPlafonds(joueur);

  joueur.historique.push({
    type, xp, niveauXP: joueur.niveauXP, general: joueur.general, age: joueur.age,
  });

  return {
    joueur,
    detailGains,
    declinAppliqueAge,
    niveauXP: joueur.niveauXP,
    xpProchainNiveau: infoNiveau.xpProchainNiveau,
    facteurPic: Number(facteurPic.toFixed(3)),
    rapportPotentiel,
  };
}

// ============================================================
// 7. EXPORTS
// ============================================================

export default {
  ATTRIBUTS,
  POSTES_PONDERATION,
  TIERS_POTENTIEL,
  ORIGINES,
  initialiserJoueur,
  calculerGeneral,
  verifierPotentielEtPlafonds,
  appliquerProgression,
};

/* ------------------------------------------------------------
 * EXEMPLE D'UTILISATION
 * ------------------------------------------------------------
 * import { initialiserJoueur, appliquerProgression, verifierPotentielEtPlafonds } from './systemeProgressionJoueur';
 *
 * const joueur = initialiserJoueur('FUTSAL', 'MOFF', 16);
 * // joueur.general -> OVR de départ, joueur.potentielMax -> caché (ne pas afficher)
 *
 * const resultat = appliquerProgression(joueur, { xp: 800, type: 'match' });
 * // resultat.detailGains -> { vitesse: 1, tir: 0, ... } points gagnés cette fois-ci
 * // resultat.rapportPotentiel.indiceAgent -> phrase à afficher côté UI
 * ------------------------------------------------------------ */

// --- 1. DONNÉES & STRUCTURE DE BASE ---

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

const NATIONALITIES = [
  { name: 'France', flag: '🇫🇷', continent: 'Europe' },
  { name: 'Angleterre', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', continent: 'Europe' },
  { name: 'Espagne', flag: '🇪🇸', continent: 'Europe' },
  { name: 'Allemagne', flag: '🇩🇪', continent: 'Europe' },
  { name: 'Italie', flag: '🇮🇹', continent: 'Europe' },
  { name: 'Brésil', flag: '🇧🇷', continent: 'Amérique du Sud' },
  { name: 'Argentine', flag: '🇦🇷', continent: 'Amérique du Sud' },
  { name: 'Maroc', flag: '🇲🇦', continent: 'Afrique' },
  { name: 'Sénégal', flag: '🇸🇳', continent: 'Afrique' },
  { name: 'Japon', flag: '🇯🇵', continent: 'Asie' }
];

const ORIGINS = [
  { id: 'centre', name: 'Centre de Formation', desc: '+10% Mental/Tactique | Trait: Classique', trait: 'Classique' },
  { id: 'amateur', name: 'Club Amateur', desc: '+10% Physique, -10% Tactique | Trait: Acharné', trait: 'Acharné' },
  { id: 'futsal', name: 'Futsal', desc: '+10% Dribble/Technique | Trait: Dribbleur Fin', trait: 'Dribbleur Fin' },
  { id: 'tardif', name: 'Débutant Tardif', desc: '-5 OVR base | Trait: Poulain Brut', trait: 'Poulain Brut' },
  { id: 'street', name: 'Street Football', desc: '+10% Dribble | Trait: Instinct 1v1', trait: 'Instinct 1v1' },
  { id: 'athlete', name: 'Athlète Polyvalent', desc: '+15% Vitesse/Puissance | Trait: Moteur Hybride', trait: 'Moteur Hybride' }
];

const BIG_LEAGUES_CLUBS = {
  "Ligue 1 McDonald's (France)": ['Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais', 'LOSC Lille', 'RC Lens', 'Stade Rennais FC'],
  "Premier League (Angleterre)": ['Manchester City', 'Arsenal FC', 'Liverpool FC', 'Manchester United', 'Chelsea FC', 'Tottenham Hotspur', 'Newcastle United'],
  "LaLiga EA Sports (Espagne)": ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Athletic Club', 'Real Sociedad', 'Villarreal CF'],
  "Bundesliga (Allemagne)": ['FC Bayern München', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart'],
  "Serie A (Italie)": ['Inter Milan', 'AC Milan', 'Juventus FC', 'SSC Napoli', 'AS Roma', 'Atalanta BC']
};

const STARTER_CLUBS = [
  {
    name: 'FC Local (Amateur)',
    tier: 'Amateur',
    minOvr: 0,
    league: 'Régional 1',
    coachName: 'Marc Keller',
    coachStyle: 'Jeu direct et physique, pressing intense sans fioritures.',
    expectations: { goals: 5, assists: 3, cleanSheets: 0 },
    boardExpectation: "Assurer le maintien et montrer un état d'esprit irréprochable.",
    weeklySalary: 150
  },
  {
    name: 'Pau FC',
    tier: 'D2',
    minOvr: 45,
    league: 'Ligue 2 BKT',
    coachName: 'Nicolas Usaï',
    coachStyle: 'Bloc compact en contre-attaque, rigueur défensive absolue.',
    expectations: { goals: 8, assists: 5, cleanSheets: 0 },
    boardExpectation: "Ne pas descendre et faire progresser les jeunes talents.",
    weeklySalary: 1200
  },
  {
    name: 'SC Bastia',
    tier: 'D2',
    minOvr: 48,
    league: 'Ligue 2 BKT',
    coachName: 'Benoît Tavenot',
    coachStyle: 'Engagement total, duels agressifs et transition rapide sur les ailes.',
    expectations: { goals: 10, assists: 6, cleanSheets: 0 },
    boardExpectation: "Accrocher la première moitié de tableau.",
    weeklySalary: 1500
  },
  {
    name: 'Bromley FC',
    tier: 'D4',
    minOvr: 40,
    league: 'EFL League Two',
    coachName: 'Andy Woodman',
    coachStyle: 'Jeu ultra physique à l\'anglaise, duels aériens et longue distance.',
    expectations: { goals: 7, assists: 4, cleanSheets: 0 },
    boardExpectation: "Survivre au marathon de League Two.",
    weeklySalary: 800
  },
  {
    name: 'CD Castellón',
    tier: 'D2',
    minOvr: 50,
    league: 'LaLiga Hypermotion',
    coachName: 'Dick Schreuder',
    coachStyle: 'Possession audacieuse, pressing très haut et prise de risque permanente.',
    expectations: { goals: 12, assists: 8, cleanSheets: 0 },
    boardExpectation: "Pratiquer un football séduisant et viser les play-offs.",
    weeklySalary: 2500
  }
];

// --- ÉCONOMIE DU STAFF PRIVÉ ---

const STAFF_DATA = {
  physio: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de préparateur physique personnel.', effect: 'Aucun' },
    { id: 1, name: 'Préparateur Amateur', unlock: (p) => p.balance > 500, cost: 200, desc: 'Niveau local', effect: 'Risque blessure -5%, Récupération +5%' },
    { id: 2, name: 'Préparateur Pro', unlock: (p) => p.weeklySalary >= 5000, cost: 2500, desc: 'Niveau championnat national', effect: 'Risque blessure -20%, Récupération +20%' },
    { id: 3, name: 'Spécialiste Élite Mondial', unlock: (p) => p.fame >= 70 && p.weeklySalary >= 50000, cost: 15000, desc: 'Niveau Ligue des Champions', effect: 'Risque blessure -50%, Récupération +50%' }
  ],
  tech: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de préparateur technique personnel.', effect: 'Aucun' },
    { id: 1, name: 'Grand Frère / Ex-Pro Local', unlock: (p) => p.balance > 300, cost: 150, desc: 'Conseils techniques de base', effect: 'XP Dribble/Tir +5%' },
    { id: 2, name: 'Spécialiste Spécifique', unlock: (p) => p.weeklySalary >= 3000, cost: 1800, desc: 'Coach de tir / dribble dédié', effect: 'XP Technique ciblée +15%' },
    { id: 3, name: 'Légende Retraitée', unlock: (p) => p.fame >= 80 && p.balance > 100000, cost: 12000, desc: 'Icône du football', effect: 'XP Technique +35%, Gestes 5⭐' }
  ],
  mental: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Aucun suivi mental.', effect: 'Aucun' },
    { id: 1, name: 'App & Livres Dev Perso', unlock: (p) => p.balance > 100, cost: 50, desc: 'Lecture et application', effect: 'Plancher mental minimal à 50' },
    { id: 2, name: 'Psychologue du Sport', unlock: (p) => p.weeklySalary >= 2000, cost: 1200, desc: 'Suivi pro indépendant', effect: 'Régénération +10 mental / semaine' },
    { id: 3, name: 'Guru des Stars', unlock: (p) => p.fame >= 60, cost: 8000, desc: 'Accompagnement VIP', effect: 'Immunité totale aux sifflets' }
  ],
  chef: [
    { id: 0, name: 'Cantine Standard', cost: 0, desc: 'Repas classiques du club', effect: 'Statut neutre' },
    { id: 1, name: 'Diététicien Sportif Privé', unlock: (p) => p.weeklySalary >= 4000, cost: 1500, desc: 'Suivi nutritionnel', effect: 'Condition physique +10% après la 70e' },
    { id: 2, name: 'Chef Étoilé Personnel', unlock: (p) => p.fame >= 75, cost: 10000, desc: 'Haute gastronomie sportive', effect: 'Fatigue cumulative -30%' }
  ]
};

// --- MOTEUR NARRATIF RICHE (20+ ÉVÉNEMENTS RÉPARTIS PAR ÂGE) ---

const NARRATIVE_ENGINE = {
  eventsPool: [
    // --- TRANCHE 14 - 17 ANS : FORMATION ET FONDATIONS ---
    {
      id: 'school_vs_football', minAge: 14, maxAge: 17, context: 'Scolarité & Centre',
      text: "Ton professeur principal menace de t'interdire d'aller à l'entraînement du soir si tes notes en mathématiques ne remontent pas.",
      choices: [
        { text: "Réviser toute la soirée (Sacrifier le terrain)", impact: { mental: +5, technique: -3, discipline: +4 } },
        { text: "Sécher les révisions et supplier le coach", impact: { relationCoach: +5, discipline: -5, charisme: +2 } },
        { text: "Payer un tuteur en urgence avec tes économies", impact: { balance: -100, mental: +2, discipline: +2 } }
      ]
    },
    {
      id: 'youth_agency', minAge: 14, maxAge: 17, context: 'Premiers Requins',
      text: "Un faux agent rôde autour du terrain et te promet un essai à l'étranger si tu signes un accord en cachette de tes parents.",
      choices: [
        { text: "Signer aveuglément pour voir du pays", impact: { fame: +5, balance: +300, discipline: -8 } },
        { text: "Refuser net et en parler à tes parents", impact: { mental: +6, discipline: +5 } },
        { text: "Consulter l'éducateur du club", impact: { relationCoach: +6, mental: +3 } }
      ]
    },
    {
      id: 'street_tournament_injury_risk', minAge: 14, maxAge: 17, context: 'Tournoi de Quartier',
      text: "Tes potes d'enfance t'organisent un tournoi de street foot clandestin la veille d'un match officiel du centre.",
      choices: [
        { text: "Y aller en cachette pour retrouver le kiff", impact: { technique: +5, physique: -5, discipline: -6 } },
        { text: "Refuser sagement pour te reposer", impact: { mental: +4, discipline: +4 } },
        { text: "Y aller juste pour regarder en tribune", impact: { charisme: +2, mental: +1 } }
      ]
    },
    {
      id: 'growth_pain_crisis', minAge: 14, maxAge: 16, context: 'Crous de Croissance',
      text: "Tu prends 5 cm en quelques mois, ton corps souffre de douleurs articulaires intenses et ta coordination en prend un coup.",
      choices: [
        { text: "Forcer à l'entraînement pour ne pas perdre ta place", impact: { physique: -8, mental: +5, technique: -3 } },
        { text: "Lever le pied et faire de la kiné préventive", impact: { physique: +4, mental: +2, relationCoach: -2 } },
        { text: "Consulter un ostéo privé hors structure", impact: { balance: -200, physique: +5 } }
      ]
    },
    {
      id: 'first_gear_sponsor', minAge: 15, maxAge: 18, context: 'Premiers Équipements',
      text: "Un équipementier local propose de t'offrir tes crampons si tu fais la promo de leur boutique sur tes réseaux.",
      choices: [
        { text: "Accepter et poster à gogo", impact: { fame: +4, balance: +150, discipline: -2 } },
        { text: "Refuser, tu veux rester concentré sur le jeu", impact: { mental: +3, discipline: +3 } }
      ]
    },

    // --- TRANCHE 18 - 25 ANS : ÉCLUSION ET TENTATIONS ---
    {
      id: 'family_night', minAge: 18, maxAge: 35, context: 'Veille de Match Capital',
      text: "Tes deux enfants pleurent toute la nuit et ton/ta partenaire est à bout de nerfs. Demain, c'est le match le plus important de la saison.",
      choices: [
        { text: "Veiller toute la nuit avec eux (Sacrifier ton sommeil)", impact: { mental: +8, physique: -10, relationCoach: -2 } },
        { text: "S'isoler dans une autre pièce pour dormir", impact: { physique: +5, mental: -5, discipline: +3 } },
        { text: "Payer une baby-sitter de nuit en urgence", impact: { charisme: +4, balance: -150, discipline: -3 } }
      ]
    },
    {
      id: 'coach_talk', minAge: 16, maxAge: 40, context: 'Point Tactique',
      text: "Ton entraîneur te convoque pour discuter de ton implication défensive dans son système de jeu rigide.",
      choices: [
        { text: "Écouter et valider ses consignes", impact: { relationCoach: +8, mental: +3 } },
        { text: "Revendiquer plus de liberté offensive", impact: { technique: +3, relationCoach: -5 } },
        { text: "Promettre de doubler les efforts physiques", impact: { physique: +5, discipline: +3 } }
      ]
    },
    {
      id: 'social_media_buzz', minAge: 17, maxAge: 32, context: 'Polémique Réseaux',
      text: "Une vidéo de toi en boîte de nuit à deux jours d'entraînement fuite sur TikTok. La presse locale s'emballe.",
      choices: [
        { text: "Faire un communiqué d'excuses publiques", impact: { discipline: +5, fame: +2, mental: -3 } },
        { text: "Ignorer et répondre sur le terrain", impact: { mental: +5, relationCoach: -3 } },
        { text: "Sortir une story provocante pour le buzz", impact: { fame: +8, discipline: -8, relationCoach: -5 } }
      ]
    },
    {
      id: 'extra_training', minAge: 15, maxAge: 35, context: 'Séance Personnalisée',
      text: "C'est ton jour de repos, mais ton préparateur technique te propose une session intensive sous la pluie.",
      choices: [
        { text: "Y aller à fond et bosser tes points faibles", impact: { technique: +5, physique: -4 } },
        { text: "Refuser net pour souffler", impact: { physique: +3, mental: +2 } },
        { text: "Faire une séance légère en solo", impact: { technique: +2, physique: +1 } }
      ]
    },
    {
      id: 'first_big_agent', minAge: 18, maxAge: 26, context: 'Appel du Grand Agent',
      text: "Un requin des agents te propose un montage financier louche mais te garantit un transfert en première division.",
      choices: [
        { text: "Signer les yeux fermés", impact: { balance: +2000, fame: +10, discipline: -12, relationCoach: -4 } },
        { text: "Refuser et rester fidèle à ton clan", impact: { mental: +5, discipline: +5, fame: -2 } },
        { text: "Soumettre le contrat à un avocat", impact: { balance: -200, mental: +3, discipline: +4 } }
      ]
    },
    {
      id: 'locker_room_tension', minAge: 19, maxAge: 30, context: 'Guerre d’Ego',
      text: "La star historique de l'équipe t'isole sur le terrain et refuse de te faire la passe par jalousie.",
      choices: [
        { text: "Lui faire face vertement dans le vestiaire", impact: { charisme: +6, relationCoach: -3, vestiaire: -5 } },
        { text: "Garder le silence et t'imposer par tes stats pures", impact: { technique: +4, mental: +5, vestiaire: +2 } },
        { text: "Aller se plaindre auprès du coach", impact: { relationCoach: -5, charisme: -6, mental: -4 } }
      ]
    },
    {
      id: 'car_purchase_luxury', minAge: 20, maxAge: 35, context: 'Premier Gros Caprice',
      text: "Avec tes dernières primes, tu as l'opportunité de t'offrir une grosse cylindrée allemande d'occasion.",
      choices: [
        { text: "Craquer et l'acheter cash", impact: { balance: -15000, fame: +8, discipline: -3 } },
        { text: "Investir sagement dans l'immobilier locatif à la place", impact: { balance: -10000, mental: +6, discipline: +5 } },
        { text: "Rester raisonnable et garder ton vieux tacot", impact: { mental: +3, discipline: +4 } }
      ]
    },
    {
      id: 'charity_event_invitation', minAge: 21, maxAge: 35, context: 'Match Caritatif',
      text: "Une association locale te propose de parrainer un tournoi pour les enfants malades de la région.",
      choices: [
        { text: "Y aller avec le sourire et faire un gros don", impact: { balance: -500, fame: +10, mental: +5 } },
        { text: "Envoyer un chèque discret sans te déplacer", impact: { balance: -300, fame: +2 } },
        { text: "Refuser par manque de temps", impact: { fame: -3, physique: +1 } }
      ]
    },

    // --- TRANCHE 26 - 40 ANS : STATUT DE STAR, PRESSION ET DÉCLINE ---
    {
      id: 'transfer_rumor_madness', minAge: 24, maxAge: 35, context: 'Feuilleton Mercato',
      text: "La Une de la presse sportive t'envoie dans un cador européen. Ton téléphone explose de sollicitations.",
      choices: [
        { text: "Alimenter le flou pour faire monter les enchères salariales", impact: { fame: +12, discipline: -5, balance: +5000 } },
        { text: "Faire un communiqué officiel de fidélité", impact: { mental: +6, relationCoach: +8, fame: -3 } },
        { text: "Couper ton téléphone pour te couper du bruit", impact: { mental: +8, discipline: +5 } }
      ]
    },
    {
      id: 'burnout_pressure', minAge: 26, maxAge: 36, context: 'Alerte Surcharge Mentale',
      text: "Enchaînement de matchs tous les 3 jours, pression des sponsors... Tu frôles la crise d'angoisse avant un choc européen.",
      choices: [
        { text: "Simuler une petite alerte physique pour souffler", impact: { physique: +5, mental: +10, discipline: -8, relationCoach: -5 } },
        { text: "Prendre sur toi et serrer les dents", impact: { physique: -6, mental: -10, discipline: +3 } },
        { text: "Consulter un préparateur mental en urgence", impact: { mental: +12, charisme: +4, balance: -300 } }
      ]
    },
    {
      id: 'bad_form_slump', minAge: 22, maxAge: 37, context: 'Traversée du Désert',
      text: "Tu enchaînes 5 matchs sans marquer ni faire la moindre passe décisive. Le public commence à siffler ton nom à l'annonce des compos.",
      choices: [
        { text: "Faire dos rond, doubler les séances invisibles", impact: { technique: +4, mental: +6, physique: -2 } },
        { text: "Provoquer une explication musclée avec les supporters ultras", impact: { charisme: +5, discipline: -10, relationCoach: -4 } },
        { text: "Demander au coach de te mettre sur le banc pour couper", impact: { mental: +5, relationCoach: +2, fame: -4 } }
      ]
    },
    {
      id: 'referee_controversy', minAge: 20, maxAge: 36, context: 'Colère Médiatique',
      text: "Après une simulation évidente pour obtenir un penalty décisif, les plateaux télé s'acharnent sur ton 'fair-play'.",
      choices: [
        { text: "Faire profil bas et ignorer les polémiques", impact: { mental: +4, discipline: +3 } },
        { text: "Lâcher une punchline sarcastique en zone mixte", impact: { fame: +8, discipline: -8, relationCoach: -3 } },
        { text: "Présenter des excuses publiques ambigües", impact: { fame: +2, discipline: +2 } }
      ]
    },
    {
      id: 'legend_status_decline', minAge: 33, maxAge: 40, context: 'Le Poids des Ans',
      text: "Les supporters t'adulent comme une icône, mais tes jambes ne suivent plus les transitions ultra-rapides des jeunes de 20 ans.",
      choices: [
        { text: "Accepter un rôle de joker de luxe et encadrer les pépites", impact: { mental: +8, relationCoach: +10, fame: +5 } },
        { text: "Refuser la rotation et bouder à l'entraînement", impact: { relationCoach: -10, mental: -5, vestiaire: -6 } },
        { text: "Anoncer ta dernière danse avant la reconversion", impact: { fame: +15, mental: +5 } }
      ]
    },
    {
      id: 'body_wear_tear', minAge: 31, maxAge: 40, context: 'Usure Chronique',
      text: "Tes genoux grincent fort au réveil. Le staff médical t'impose un protocole de soins lourd les jours de repos.",
      choices: [
        { text: "Suivre le protocole à la lettre quitte à rater des entraînements", impact: { physique: +4, mental: +3, technique: -2 } },
        { text: "Prendre des analgésiques en cachette pour tout jouer", impact: { physique: -10, mental: +6, discipline: -4 } },
        { text: "Engager un kiné personnel exclusif", impact: { balance: -1500, physique: +8 } }
      ]
    },
    {
      id: 'retirement_prep_offer', minAge: 34, maxAge: 40, context: 'Reconversion Anticipée',
      text: "Un club partenaire te propose de basculer directement du terrain au costume d'entraîneur de l'équipe réserve dès l'hiver prochain.",
      choices: [
        { text: "Accepter la proposition et raccrocher sereinement", impact: { mental: +10, fame: +5, discipline: +5 } },
        { text: "Refuser, tu veux prolonger l'aventure sur le pré", impact: { physique: -3, mental: +2 } }
      ]
    }
  ]
};

// --- ÉTAT GLOBAL ET GESTION DU JEU ---

let savedData = JSON.parse(localStorage.getItem('career_rpg_save'));
if (savedData && (!savedData.coach || !savedData.staff || savedData.age === undefined)) {
  savedData = null; 
}

let state = {
  player: savedData,
  activeEvent: null,
  activeTab: 'dashboard',
  form: {
    firstName: 'Brandon',
    lastName: 'Le Moan',
    nationality: NATIONALITIES[0],
    height: 180,
    weight: 75,
    position: 'BU',
    origin: ORIGINS[0],
    heartClubLeague: Object.keys(BIG_LEAGUES_CLUBS)[0],
    heartClubName: BIG_LEAGUES_CLUBS["Ligue 1 McDonald's (France)"][0]
  }
};

let lastChoiceFeedback = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePlayer(formData, selectedStarterClub) {
  let baseOvr = randInt(38, 48);
  if (formData.origin.id === 'tardif') baseOvr -= 5;
  let basePot = randInt(75, 95);

  let stats = {
    technique: randInt(40, 52),
    physique: randInt(40, 50),
    mental: randInt(35, 45),
    charisme: randInt(20, 50),
    reputation: 10,
    discipline: 50,
    relationCoach: 50,
    vestiaire: 50
  };

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    nationality: formData.nationality,
    position: formData.position,
    origin: formData.origin,
    height: formData.height,
    weight: formData.weight,
    age: 14, // Âge de départ fixé à 14 ans
    ovr: baseOvr,
    pot: basePot,
    stats: stats,
    traits: [formData.origin.trait],
    week: 1,
    currentClub: selectedStarterClub.name,
    weeklySalary: selectedStarterClub.weeklySalary,
    balance: 500,
    fame: 10,
    coach: {
      name: selectedStarterClub.coachName,
      style: selectedStarterClub.coachStyle,
      expectations: { ...selectedStarterClub.expectations },
      boardExpectation: selectedStarterClub.boardExpectation,
      currentGoals: 0,
      currentAssists: 0,
      currentCleanSheets: 0
    },
    staff: {
      physio: 0,
      tech: 0,
      mental: 0,
      chef: 0
    },
    heartClub: formData.heartClubName,
    history: []
  };
}

function updateFormInput() {
  const fnInput = document.getElementById('inp-fn');
  const lnInput = document.getElementById('inp-ln');
  const hInput = document.getElementById('inp-h');
  const wInput = document.getElementById('inp-w');

  if (fnInput) state.form.firstName = fnInput.value;
  if (lnInput) state.form.lastName = lnInput.value;
  if (hInput) state.form.height = parseInt(hInput.value);
  if (wInput) state.form.weight = parseInt(wInput.value);
}

function setPos(p) { updateFormInput(); state.form.position = p; render(); }
function selectOrigin(id) { updateFormInput(); state.form.origin = ORIGINS.find(o => o.id === id); render(); }
function setNat(name) { updateFormInput(); state.form.nationality = NATIONALITIES.find(n => n.name === name); render(); }
function setHeartLeague(league) {
  updateFormInput();
  state.form.heartClubLeague = league;
  state.form.heartClubName = BIG_LEAGUES_CLUBS[league][0];
  render();
}
function setHeartClub(club) {
  updateFormInput();
  state.form.heartClubName = club;
  render();
}

function submitCreation(clubIndex) {
  updateFormInput();
  const chosenClub = STARTER_CLUBS[clubIndex] || STARTER_CLUBS[0];
  state.player = generatePlayer(state.form, chosenClub);
  
  if (state.player.currentClub === state.player.heartClub) {
    state.player.stats.mental += 10;
  }

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function resetCareer() {
  localStorage.removeItem('career_rpg_save');
  state.player = null;
  state.activeEvent = null;
  lastChoiceFeedback = null;
  render();
}

function setTab(tab) {
  state.activeTab = tab;
  render();
}

function hireStaff(category, level) {
  state.player.staff[category] = level;
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function advanceWeek() {
  state.player.week += 1;
  state.player.balance += state.player.weeklySalary;
  lastChoiceFeedback = null;

  // Augmentation de l'âge chaque 52 semaines
  if (state.player.week % 52 === 0) {
    state.player.age += 1;
  }

  // Simulation des performances de match
  if (Math.random() < 0.6) {
    if (['bu', 'ad', 'ag', 'moc'].includes(state.player.position)) {
      if (Math.random() > 0.5) state.player.coach.currentGoals += 1;
      else state.player.coach.currentAssists += 1;
    } else {
      state.player.coach.currentCleanSheets += 1;
    }
  }

  // Prélèvement du staff mensuel
  if (state.player.week % 4 === 0) {
    let totalStaffCost = 
      STAFF_DATA.physio[state.player.staff.physio].cost +
      STAFF_DATA.tech[state.player.staff.tech].cost +
      STAFF_DATA.mental[state.player.staff.mental].cost +
      STAFF_DATA.chef[state.player.staff.chef].cost;

    state.player.balance -= totalStaffCost;
  }

  // Filtrage des événements selon l'âge actuel du joueur
  const currentAge = state.player.age || 14;
  const eligibleEvents = NARRATIVE_ENGINE.eventsPool.filter(ev => currentAge >= ev.minAge && currentAge <= ev.maxAge);

  if (Math.random() < 0.7 && eligibleEvents.length > 0) {
    state.activeEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
  } else {
    state.activeEvent = null;
  }

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function handleChoice(choice) {
  let impactSummary = {};

  for (let stat in choice.impact) {
    let val = choice.impact[stat];
    impactSummary[stat] = val;

    if (state.player.stats.hasOwnProperty(stat)) {
      state.player.stats[stat] = Math.max(0, Math.min(100, state.player.stats[stat] + val));
    } else if (state.player.hasOwnProperty(stat)) {
      state.player[stat] += val;
    }
  }
  
  state.player.ovr = Math.round((state.player.stats.technique * 0.4) + (state.player.stats.physique * 0.3) + (state.player.stats.mental * 0.3));
  lastChoiceFeedback = impactSummary;

  state.activeEvent = null;
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

// --- RENDU GRAPHIQUE ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h1 class="text-xl font-black text-center text-emerald-400 uppercase tracking-wider">Création du Joueur & Carrière</h1>
        
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-400 font-bold">Prénom</label>
            <input id="inp-fn" type="text" value="${state.form.firstName}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1"/>
          </div>
          <div>
            <label class="text-xs text-slate-400 font-bold">Nom</label>
            <input id="inp-ln" type="text" value="${state.form.lastName}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1"/>
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 font-bold">Nationalité</label>
          <select onchange="setNat(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1">
            ${NATIONALITIES.map(n => `<option value="${n.name}" ${state.form.nationality.name === n.name ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-400 font-bold">Taille : <span id="val-h">${state.form.height}</span>cm</label>
            <input id="inp-h" type="range" min="160" max="205" value="${state.form.height}" oninput="document.getElementById('val-h').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
          </div>
          <div>
            <label class="text-xs text-slate-400 font-bold">Poids : <span id="val-w">${state.form.weight}</span>kg</label>
            <input id="inp-w" type="range" min="55" max="100" value="${state.form.weight}" oninput="document.getElementById('val-w').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 font-bold uppercase">Poste</label>
          <div class="grid grid-cols-5 gap-1.5 mt-1">
            ${POSITIONS.map(p => `<button type="button" onclick="setPos('${p.id}')" class="p-2 rounded border text-xs font-bold transition-all ${state.form.position === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}">${p.label}</button>`).join('')}
          </div>
        </div>

        <div>
          <label class="text-xs text-slate-400 font-bold uppercase">Style d'Origine</label>
          <div class="grid grid-cols-2 gap-1.5 mt-1">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white block">${o.name}</span>
                <span class="text-[10px] text-slate-400">${o.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <label class="text-xs text-pink-400 font-bold uppercase tracking-wider block">❤️ Choix du Club de Cœur (Bonus de Mental)</label>
          <div class="grid grid-cols-2 gap-2">
            <select onchange="setHeartLeague(this.value)" class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white">
              ${Object.keys(BIG_LEAGUES_CLUBS).map(l => `<option value="${l}" ${state.form.heartClubLeague === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
            <select onchange="setHeartClub(this.value)" class="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white">
              ${BIG_LEAGUES_CLUBS[state.form.heartClubLeague].map(c => `<option value="${c}" ${state.form.heartClubName === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="text-xs text-yellow-400 font-bold uppercase tracking-wider block mb-2">🏟️ Choisis ton Club de Départ & ton Entraîneur :</label>
          <div class="space-y-3 max-h-60 overflow-y-auto pr-1">
            ${STARTER_CLUBS.map((club, index) => `
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div class="flex justify-between items-center">
                  <div>
                    <span class="font-bold text-white text-sm">${club.name}</span>
                    <span class="text-[10px] text-slate-400 block">${club.league} (${club.tier}) • Salaire: $${club.weeklySalary}/sem</span>
                  </div>
                  <button onclick="submitCreation(${index})" class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs transition-colors">
                    Choisir ✍️
                  </button>
                </div>
                <div class="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800/60 space-y-1">
                  <div>👨‍🏫 Entraîneur : <span class="text-emerald-400 font-semibold">${club.coachName}</span></div>
                  <div>📋 Style : <span class="italic text-slate-400">${club.coachStyle}</span></div>
                  <div>🎯 Objectifs saison : <span class="text-yellow-300">${club.expectations.goals} Buts</span> | <span class="text-yellow-300">${club.expectations.assists} Passes D</span></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    let eventModalHTML = '';
    if (state.activeEvent) {
      eventModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-slate-900 border-2 border-emerald-500 p-5 rounded-2xl max-w-lg w-full my-auto space-y-4 shadow-2xl">
            <div>
              <span class="text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">${state.activeEvent.context}</span>
              <p class="text-white text-sm mt-3 leading-relaxed">${state.activeEvent.text}</p>
            </div>
            
            <div class="space-y-2">
              ${state.activeEvent.choices.map((c, index) => `
                <button onclick='handleChoice(${JSON.stringify(c)})' 
                        class="w-full text-left p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl text-xs text-slate-300 hover:text-white transition-all flex items-center gap-3 group">
                  <span class="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 group-hover:border-emerald-400 group-hover:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">${index + 1}</span>
                  <span>${c.text}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    let tabContent = '';

    if (state.activeTab === 'dashboard') {
      let feedbackHtml = '';
      if (lastChoiceFeedback) {
        feedbackHtml = `
          <div class="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400 text-xs space-y-1 animate-pulse">
            <div class="font-bold uppercase tracking-wider">⚡ Dernier impact enregistré :</div>
            <div class="flex flex-wrap gap-2">
              ${Object.keys(lastChoiceFeedback).map(k => `<span class="bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">${k}: <b>${lastChoiceFeedback[k] > 0 ? '+' + lastChoiceFeedback[k] : lastChoiceFeedback[k]}</b></span>`).join('')}
            </div>
          </div>
        `;
      }

      tabContent = `
        ${feedbackHtml}
        <div class="text-xs text-slate-300 space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between items-center">
            <span>Club actuel : <span class="text-yellow-400 font-bold">${state.player.currentClub}</span></span>
            <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold">Âge : ${state.player.age || 14} ans • Semaine ${state.player.week}</span>
          </div>
          <div>❤️ Club de cœur : <span class="text-pink-400 font-bold">${state.player.heartClub}</span></div>
          <div class="border-t border-slate-800 pt-2 space-y-1">
            <div>👨‍🏫 Entraîneur : <span class="text-emerald-400 font-bold">${state.player.coach.name}</span></div>
            <div>📋 Tactique : <span class="text-slate-400 italic">${state.player.coach.style}</span></div>
            <div class="flex justify-between pt-1">
              <span>Objectif Buts : <b class="text-white">${state.player.coach.currentGoals} / ${state.player.coach.expectations.goals}</b></span>
              <span>Objectif Passes D : <b class="text-white">${state.player.coach.currentAssists} / ${state.player.coach.expectations.assists}</b></span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Stats & Relation</div>
            <div class="flex justify-between"><span>Technique :</span> <span class="font-bold text-white">${state.player.stats.technique}</span></div>
            <div class="flex justify-between"><span>Physique :</span> <span class="font-bold text-white">${state.player.stats.physique}</span></div>
            <div class="flex justify-between"><span>Mental :</span> <span class="font-bold text-white">${state.player.stats.mental}</span></div>
            <div class="flex justify-between"><span>Relation Coach :</span> <span class="font-bold text-emerald-400">${state.player.stats.relationCoach}/100</span></div>
          </div>
          
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Évaluation (OVR)</div>
            <div class="flex justify-between"><span>Général (OVR) :</span> <span class="font-bold text-yellow-400 text-sm">${state.player.ovr}</span></div>
            <div class="flex justify-between"><span>Potentiel (POT) :</span> <span class="font-bold text-emerald-400 text-sm">${state.player.pot}</span></div>
            <div class="flex justify-between"><span>Trait :</span> <span class="font-semibold text-slate-200">${state.player.traits[0]}</span></div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'staff') {
      const categories = [
        { key: 'physio', title: '1. Préparateur Physique', list: STAFF_DATA.physio },
        { key: 'tech', title: '2. Préparateur Technique', list: STAFF_DATA.tech },
        { key: 'mental', title: '3. Coach Mental', list: STAFF_DATA.mental },
        { key: 'chef', title: '4. Cuisinier & Nutritionniste', list: STAFF_DATA.chef }
      ];

      tabContent = `
        <div class="space-y-4 max-h-[50vh] overflow-y-auto pr-1 text-xs">
          ${categories.map(cat => `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div class="font-bold text-yellow-400 uppercase">${cat.title}</div>
              <div class="space-y-1.5">
                ${cat.list.map(tier => {
                  const isUnlocked = tier.unlock ? tier.unlock(state.player) : true;
                  const isCurrent = state.player.staff[cat.key] === tier.id;
                  return `
                    <div class="p-2.5 rounded-lg border flex justify-between items-center bg-slate-900 ${isCurrent ? 'border-emerald-500' : 'border-slate-800'}">
                      <div class="space-y-0.5">
                        <div class="font-bold text-white">${tier.name} <span class="text-slate-400 font-normal">($${tier.cost}/mois)</span></div>
                        <div class="text-[10px] text-slate-400">${tier.effect}</div>
                      </div>
                      <div>
                        ${isCurrent ? 
                          '<span class="text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded">Actif</span>' :
                          isUnlocked ? 
                            `<button onclick="hireStaff('${cat.key}', ${tier.id})" class="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded">Engager</button>` :
                            '<span class="text-red-400 text-[10px]">Verrouillé</span>'
                        }
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (state.activeTab === 'finances') {
      let totalMonthlyCost = 
        STAFF_DATA.physio[state.player.staff.physio].cost +
        STAFF_DATA.tech[state.player.staff.tech].cost +
        STAFF_DATA.mental[state.player.staff.mental].cost +
        STAFF_DATA.chef[state.player.staff.chef].cost;

      tabContent = `
        <div class="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="font-bold text-emerald-400 uppercase tracking-wider text-sm mb-2">Bilan Financier & Personnel</div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Solde Actuel :</span>
            <span class="font-bold text-yellow-400">$${state.player.balance.toLocaleString()}</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Salaire Hebdomadaire :</span>
            <span class="font-bold text-emerald-400">+$${state.player.weeklySalary.toLocaleString()} / sem</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Coût total du Staff (Mensuel) :</span>
            <span class="font-bold text-red-400">-$${totalMonthlyCost.toLocaleString()} / mois</span>
          </div>
          <div class="flex justify-between p-2 bg-slate-900 rounded border border-slate-800">
            <span>Notoriété (Fame) :</span>
            <span class="font-bold text-pink-400">${state.player.fame} / 100</span>
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      ${eventModalHTML}
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h2 class="text-lg font-black text-emerald-400 flex justify-between items-center">
          <span>${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</span>
          <span class="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-300 uppercase">${state.player.position}</span>
        </h2>

        <div class="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button onclick="setTab('dashboard')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Dashboard</button>
          <button onclick="setTab('staff')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'staff' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Staff Privé</button>
          <button onclick="setTab('finances')" class="py-2 text-xs font-bold rounded-lg transition-all ${state.activeTab === 'finances' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}">Finances</button>
        </div>

        ${tabContent}

        <button onclick="advanceWeek()" ${state.activeEvent ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black rounded-xl text-white uppercase text-xs tracking-wider shadow-lg transition-all">
          📅 Avancer d'une Semaine (Jouer / S'entraîner)
        </button>

        <button onclick="resetCareer()" class="w-full py-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 hover:border-red-900 font-bold rounded-xl text-xs uppercase tracking-wide transition-colors">
          Refaire un joueur
        </button>
      </div>
    `;
  }
}

render();

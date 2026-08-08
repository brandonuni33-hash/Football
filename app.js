// --- 1. DONNÉES & STRUCTURE DE BASE ---

const POSITIONS = [
  { id: 'bu', label: 'BU' },
  { id: 'ad', label: 'AD' },
  { id: 'ag', label: 'AG' },
  { id: 'moc', label: 'MOC' },
  { id: 'mc', label: 'MC' },
  { id: 'mdc', label: 'MDC' },
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

const RANDOM_FIRST_NAMES = ['Lucas', 'Enzo', 'Noah', 'Louis', 'Gabriel', 'Raphaël', 'Leo', 'Arthur', 'Jules', 'Maël', 'Ethan', 'Hugo', 'Nathan', 'Sacha', 'Adam', 'Tom', 'Mohamed', 'Mehdi', 'Ilyes', 'Amine'];
const RANDOM_LAST_NAMES = ['Bernard', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard', 'Bonnet', 'Dupont', 'Le Moan'];

function getRandomPlayerName() {
  const fn = RANDOM_FIRST_NAMES[Math.floor(Math.random() * RANDOM_FIRST_NAMES.length)];
  const ln = RANDOM_LAST_NAMES[Math.floor(Math.random() * RANDOM_LAST_NAMES.length)];
  return { firstName: fn, lastName: ln };
}

const ORIGINS = [
  { 
    id: 'centre', 
    name: 'Centre de Formation', 
    desc: '+10% Mental/Tactique | Trait: Classique', 
    trait: 'Classique',
    longDesc: "Issu des structures professionnelles pré-formatées, tu as bénéficié dès ton plus jeune âge d'un encadrement rigoureux et de conseils tactiques poussés."
  },
  { 
    id: 'amateur', 
    name: 'Club Amateur', 
    desc: '+10% Physique, -10% Tactique | Trait: Acharné', 
    trait: 'Acharné',
    longDesc: "Formé sur des terrains difficiles sous la pluie. Tu possèdes une caisse physique hors norme et un mental d'acier forgé dans la difficulté."
  },
  { 
    id: 'futsal', 
    name: 'Futsal', 
    desc: '+10% Dribble/Technique | Trait: Dribbleur Fin', 
    trait: 'Dribbleur Fin',
    longDesc: "Le rectangle de parquet et le ballon lourd ont sculpté ton toucher de balle et ta vista technique dans les espaces réduits."
  },
  { 
    id: 'tardif', 
    name: 'Débutant Tardif', 
    desc: '-5 OVR base | Trait: Poulain Brut', 
    trait: 'Poulain Brut',
    longDesc: "Repéré tardivement dans les championnats loisirs, tu arrives dans le monde pro avec un bagage technique brut et un gros potentiel de progression."
  },
  { 
    id: 'street', 
    name: 'Street Football', 
    desc: '+10% Dribble | Trait: Instinct 1v1', 
    trait: 'Instinct 1v1',
    longDesc: "Le bitume et les matches de rue permanents t'ont forgé un instinct de duel implacable et un brin d'insolence."
  },
  { 
    id: 'athlete', 
    name: 'Athlète Polyvalent', 
    desc: '+15% Vitesse/Puissance | Trait: Moteur Hybride', 
    trait: 'Moteur Hybride',
    longDesc: "Doté de dispositions athlétiques hors du commun, tu combines vitesse pure et coffre immense pour répéter les efforts."
  }
];

const BIG_LEAGUES_CLUBS = {
  "Ligue 1 McDonald's (France)": ['Paris Saint-Germain', 'Olympique de Marseille', 'AS Monaco', 'Olympique Lyonnais', 'LOSC Lille', 'RC Lens', 'Stade Rennais FC'],
  "Premier League (Angleterre)": ['Manchester City', 'Arsenal FC', 'Liverpool FC', 'Manchester United', 'Chelsea FC', 'Tottenham Hotspur', 'Newcastle United'],
  "LaLiga EA Sports (Espagne)": ['Real Madrid', 'FC Barcelona', 'Atlético de Madrid', 'Athletic Club', 'Real Sociedad', 'Villarreal CF'],
  "Bundesliga (Allemagne)": ['FC Bayern München', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart'],
  "Serie A (Italie)": ['Inter Milan', 'AC Milan', 'Juventus FC', 'SSC Napoli', 'AS Roma', 'Atalanta BC']
};

const CITIES_AND_CLUBS = [
  { name: 'FC Girondins de Bordeaux', league: 'National / R1', tier: 'Amateur', minOvr: 0, coachName: 'Bruno Irles', coachStyle: 'Rigueur tactique et engagement physique total.', trainingQuality: 'Élevée', playtime: 'Élevé' },
  { name: 'US Lormont', league: 'Régional 1', tier: 'Amateur', minOvr: 0, coachName: 'Mehdi Sabri', coachStyle: 'Jeu direct et transition rapide.', trainingQuality: 'Moyenne', playtime: 'Très Élevé' },
  { name: 'Pau FC', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 45, coachName: 'Nicolas Usaï', coachStyle: 'Bloc compact en contre-attaque.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'SC Bastia', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 48, coachName: 'Benoît Tavenot', coachStyle: 'Duels agressifs et mental de guerrier.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'En Avant Guingamp', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 46, coachName: 'Sylvain Ripoll', coachStyle: 'Transition rapide et largeur.', trainingQuality: 'Excellente', playtime: 'Modéré' },
  { name: 'FC Sochaux-Montbéliard', league: 'National', tier: 'D3', minOvr: 40, coachName: 'Karim Mokeddem', coachStyle: 'Jeu technique au sol.', trainingQuality: 'Excellente', playtime: 'Élevé' },
  { name: 'Wrexham AFC', league: 'EFL League One', tier: 'D3', minOvr: 46, coachName: 'Phil Parkinson', coachStyle: 'Puissance physique et mentalité de vainqueur.', trainingQuality: 'Bonne', playtime: 'Modéré' }
];

function getRandomStarterClubs() {
  let shuffled = [...CITIES_AND_CLUBS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

let dynamicStarterClubs = getRandomStarterClubs();

// --- SCÉNARIOS SPÉCIFIQUES PAR ORIGINE ---
const ORIGIN_NARRATIVE_EVENTS = {
  'futsal': [
    {
      context: "Remarque du coach (Futsal)",
      text: "Le coach t'interpelle à la fin de l'entraînement : 'J'ai vu ton petit numéro dans les petits espaces, c'est bien joli sur un parquet, mais ici on joue à 11 sur grand terrain ! Tu cherches trop à dribbler au lieu de lâcher ton ballon simple.'",
      choices: [
        { text: "Baisser les yeux et promettre de simplifier ton jeu", impact: { relationCoach: +4, technique: +1 } },
        { text: "Lui répondre que c'est cette créativité qui fait ta force", impact: { arroganceScore: +6, relationCoach: -3, technique: +3 } },
        { text: "Ignorer sa remarque et continuer à tenter tes slaloms", impact: { arroganceScore: +8, vestiaire: -2 } },
        { text: "Lui demander des conseils pour adapter ta vista au grand terrain", impact: { mental: +3, relationCoach: +5 } }
      ]
    },
    {
      context: "Tournoi de salon improvisé",
      text: "Pendant une opposition réduite, tu humilies un cadre de l'équipe avec un double contact sur semelle, un réflexe pur de ton passé futsal.",
      choices: [
        { text: "Lui tendre la main pour l'aider à se relever avec fair-play", impact: { vestiaire: +4, mental: +2 } },
        { text: "Célébrer ton geste en chambrant un peu le vestiaire", impact: { arroganceScore: +6, vestiaire: -3, fame: +2 } },
        { text: "Rester discret pour ne pas vexer les anciens", impact: { discipline: +3 } },
        { text: "Provoquer le coach du regard pour voir s'il a apprécié", impact: { arroganceScore: +10, relationCoach: -2 } }
      ]
    }
  ],
  'amateur': [
    {
      context: "Remarque du coach (Amateur)",
      text: "Le coach te convoque : 'Physiquement tu réponds présent grâce à ton passé dans les divisions amateurs, mais tactiquement tu es largué sur le placement défensif.'",
      choices: [
        { text: "Bosser la vidéo avec le staff le soir pour progresser", impact: { mental: +4, relationCoach: +4 } },
        { text: "Mettre ça sur le compte du manque de formation de tes débuts", impact: { arroganceScore: -2, mental: -1 } },
        { text: "Compenser uniquement par ton impact physique sur le porteur", impact: { physique: +3, discipline: -4 } },
        { text: "Prouver ton intelligence de jeu par un repli XXL à la prochaine séance", impact: { technique: +2, relationCoach: +3 } }
      ]
    }
  ],
  'street': [
    {
      context: "Remarque du coach (Street)",
      text: "Le coach te prend à partie après un dribble risqué perdu devant ta surface : 'On n'est pas sur le bitume ici ! Un ballon perdu là-bas, c'est un but encaissé. Arrête tes grigris inutiles.'",
      choices: [
        { text: "Intégrer la consigne et épurer ton jeu défensif", impact: { discipline: +5, relationCoach: +3 } },
        { text: "Bouillonner intérieurement : le football de rue t'a donné ton instinct", impact: { arroganceScore: +6, mental: -2 } },
        { text: "Tenter un nouveau geste technique au prochain entraînement pour le narguer", impact: { arroganceScore: +10, relationCoach: -5, technique: +2 } },
        { text: "Discuter calmement avec lui pour trouver le juste équilibre", impact: { mental: +3, relationCoach: +2 } }
      ]
    }
  ],
  'centre': [
    {
      context: "Remarque du coach (Centre)",
      text: "Le coach te fait un retour pointu : 'Tu es propre, tu appliques les consignes à la lettre, mais tu manques cruellement de folie et d'audace dans les trentes derniers mètres.'",
      choices: [
        { text: "Prendre plus de risques et tenter des frappes de loin", impact: { technique: +3, arroganceScore: +3 } },
        { text: "Continuer sur ta ligne de rigueur tactique, c'est ce qui fait ta force", impact: { mental: +3, discipline: +3 } },
        { text: "Demander un atelier spécifique de finition après les séances", impact: { technique: +4, relationCoach: +3 } },
        { text: "R râler en pensant que tu fais exactement ce qu'on te demande", impact: { arroganceScore: +4, relationCoach: -2 } }
      ]
    }
  ],
  'athlete': [
    {
      context: "Remarque du coach (Athlète)",
      text: "Le coach te recadre : 'Tu cours plus vite que tout le monde, c'est un fait. Mais tu passes ton temps à courir dans le vide à cause d'un manque de lecture du jeu.'",
      choices: [
        { text: "Travailler ton placement et ton timing de course", impact: { mental: +4, relationCoach: +3 } },
        { text: "Utiliser ta vitesse brute pour rattraper tes erreurs de placement", impact: { physique: +3, discipline: -3 } },
        { text: "Contester son analyse en lui montrant tes stats de distance parcourue", impact: { arroganceScore: +7, relationCoach: -4 } },
        { text: "Écouter les conseils des milieux vétérans pour canaliser ton énergie", impact: { mental: +3, vestiaire: +3 } }
      ]
    }
  ],
  'tardif': [
    {
      context: "Remarque du coach (Tardif)",
      text: "Le coach t'observe : 'On voit que tu as découvert le haut niveau sur le tard. Ton coffre technique a des lacunes, mais ta dalle et ton envie compensent tout.'",
      choices: [
        { text: "Doubler les séances de jongles et de passes pour combler ton retard", impact: { technique: +4, mental: +3 } },
        { text: "Miser entièrement sur ta grinta et ton engagement de battant", impact: { physique: +3, discipline: -2 } },
        { text: "Accepter tes faiblesses avec humilité et bosser dur", impact: { mental: +5, relationCoach: +3 } },
        { text: "Te décourager face à la complexité technique des exercices", impact: { mental: -4, technique: -1 } }
      ]
    }
  ]
};

// Scénarios génériques si l'origine n'a pas de spécifique sous la main
const GENERIC_NARRATIVE_EVENTS = [
  {
    context: "Vie de vestiaire",
    text: "Un chambrage éclate dans le vestiaire avant un match important concernant le style vestimentaire des jeunes.",
    choices: [
      { text: "Participer activement aux blagues pour détendre le groupe", impact: { vestiaire: +4, charisme: +2 } },
      { text: "Rester dans ton coin concentré sur ta musique", impact: { mental: +2 } },
      { text: "En rajouter pour faire rire tout le monde quitte à piquer quelqu'un", impact: { arroganceScore: +5, vestiaire: -2 } },
      { text: "Calmer le jeu pour que tout le monde reste focus", impact: { mental: +3, relationCoach: +2 } }
    ]
  }
];

function getLocalNarrativeEvent(player) {
  const originId = player.origin ? player.origin.id : 'centre';
  const specificList = ORIGIN_NARRATIVE_EVENTS[originId] || [];
  
  // Une chance sur deux d'avoir un événement lié à ton origine, ou un événement générique
  let chosenEvent;
  if (specificList.length > 0 && Math.random() > 0.3) {
    chosenEvent = specificList[Math.floor(Math.random() * specificList.length)];
  } else {
    chosenEvent = GENERIC_NARRATIVE_EVENTS[Math.floor(Math.random() * GENERIC_NARRATIVE_EVENTS.length)];
  }

  return {
    context: chosenEvent.context,
    text: chosenEvent.text,
    choices: chosenEvent.choices
  };
}

function getYouthCategoryAndExpectations(ovr, position, tier) {
  let category = "U16";
  if (ovr >= 44 && ovr < 49) category = "U17";
  else if (ovr >= 49) category = "U19";

  let multiplier = 1;
  if (tier === 'D2') multiplier = 1.3;
  if (tier === 'D1') multiplier = 1.6;

  let expectations = { goals: 0, assists: 0, cleanSheets: 0 };
  let boardExpectation = "";

  const pos = position.toLowerCase();

  if (['bu', 'ad', 'ag', 'moc'].includes(pos)) {
    expectations.goals = Math.round((pos === 'bu' ? randInt(6, 12) : randInt(4, 9)) * multiplier);
    expectations.assists = Math.round((pos === 'bu' ? randInt(3, 7) : randInt(5, 10)) * multiplier);
    boardExpectation = `S'imposer comme un élément clé de l'attaque en ${category}.`;
  } else if (['mc', 'mdc'].includes(pos)) {
    expectations.goals = Math.round(randInt(2, 5) * multiplier);
    expectations.assists = Math.round(randInt(4, 8) * multiplier);
    boardExpectation = `Assurer l'équilibre de l'entrejeu en ${category}.`;
  } else if (['dd', 'dg', 'dc'].includes(pos)) {
    expectations.goals = Math.round(randInt(1, 3) * multiplier);
    expectations.cleanSheets = Math.round(randInt(4, 9) * multiplier);
    boardExpectation = `Maintenir la rigueur défensive en ${category}.`;
  } else if (pos === 'gk') {
    expectations.cleanSheets = Math.round(randInt(6, 12) * multiplier);
    boardExpectation = `Verrouiller sa cage en ${category}.`;
  }

  return {
    category,
    expectations,
    boardExpectation,
    contractText: `Contrat jeune (Formation ${category})`
  };
}

const TRANSFER_MODULE = {
  checkOffer: (player) => {
    if (player.fame > 20 && Math.random() > 0.7) {
      const targetClub = CITIES_AND_CLUBS[Math.floor(Math.random() * CITIES_AND_CLUBS.length)];
      return {
        club: targetClub.name,
        salary: player.weeklySalary * 1.5,
        bonus: player.balance * 0.1,
        message: `Le club de ${targetClub.name} s'intéresse à ton profil. Salaire proposé : $${Math.round(player.weeklySalary * 1.5)}.`
      };
    }
    return null;
  }
};

let savedData = JSON.parse(localStorage.getItem('career_rpg_save'));
if (savedData && (!savedData.coach || !savedData.staff || savedData.age === undefined)) {
  savedData = null; 
}

const initialRandName = getRandomPlayerName();

let state = {
  player: savedData,
  activeEvent: null,
  activeTab: 'dashboard',
  creationStep: 1,
  form: {
    firstName: initialRandName.firstName,
    lastName: initialRandName.lastName,
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
let lastDeltaMessage = null;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSeasonPhase(eventIndex) {
  const phases = ['Pré-saison', 'Saison', 'Mercato', 'Fin de saison'];
  return phases[eventIndex % 4];
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

  const youthData = getYouthCategoryAndExpectations(baseOvr, formData.position, selectedStarterClub.tier);

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    nationality: formData.nationality,
    position: formData.position,
    origin: formData.origin,
    height: formData.height,
    weight: formData.weight,
    age: 14,
    ovr: baseOvr,
    pot: basePot,
    stats: stats,
    arroganceScore: 20,
    traits: [formData.origin.trait],
    eventIndex: 0,
    currentClub: selectedStarterClub.name,
    weeklySalary: selectedStarterClub.weeklySalary || 150,
    balance: 300,
    fame: 10,
    coach: {
      name: selectedStarterClub.coachName,
      style: selectedStarterClub.coachStyle,
      category: youthData.category,
      expectations: youthData.expectations,
      boardExpectation: youthData.boardExpectation,
      contractText: youthData.contractText,
      currentGoals: 0,
      currentAssists: 0,
      currentCleanSheets: 0
    },
    staff: { physio: 0, tech: 0, mental: 0, chef: 0 },
    heartClub: formData.heartClubName,
    history: [],
    pendingOffer: null
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

function randomizeName() {
  const newName = getRandomPlayerName();
  state.form.firstName = newName.firstName;
  state.form.lastName = newName.lastName;
  render();
}

function nextStep() { updateFormInput(); state.creationStep += 1; render(); }
function prevStep() { updateFormInput(); state.creationStep -= 1; render(); }
function setPos(p) { updateFormInput(); state.form.position = p; render(); }
function selectOrigin(id) { updateFormInput(); state.form.origin = ORIGINS.find(o => o.id === id); render(); }
function setNat(name) { updateFormInput(); state.form.nationality = NATIONALITIES.find(n => n.name === name); render(); }
function setHeartLeague(league) {
  updateFormInput();
  state.form.heartClubLeague = league;
  state.form.heartClubName = BIG_LEAGUES_CLUBS[league][0];
  render();
}
function setHeartClub(club) { updateFormInput(); state.form.heartClubName = club; render(); }

function submitCreation(clubIndex) {
  updateFormInput();
  const chosenClub = dynamicStarterClubs[clubIndex] || dynamicStarterClubs[0];
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
  state.creationStep = 1;
  lastChoiceFeedback = null;
  lastDeltaMessage = null;
  dynamicStarterClubs = getRandomStarterClubs();
  const newRandName = getRandomPlayerName();
  state.form.firstName = newRandName.firstName;
  state.form.lastName = newRandName.lastName;
  render();
}

function setTab(tab) { state.activeTab = tab; render(); }

function advancePeriod() {
  if (state.player.eventIndex === undefined) state.player.eventIndex = 0;
  state.player.eventIndex += 1;

  if (state.player.eventIndex % 4 === 0) {
    state.player.age += 1;
  }
  if (!state.player.pendingOffer) {
    state.player.pendingOffer = TRANSFER_MODULE.checkOffer(state.player);
  }

  state.player.balance += (state.player.weeklySalary * 4);
  lastChoiceFeedback = null;
  lastDeltaMessage = null;

  let deltaRoll = randInt(1, 100);
  if (deltaRoll <= 5) {
    lastDeltaMessage = "✨ Jour de Grâce ! Tes sensations sont parfaites : +10% à toutes tes stats.";
  } else if (deltaRoll > 5 && deltaRoll <= 15) {
    lastDeltaMessage = "🌧️ Jour Sans... Jambes lourdes : -15% temporaire sur le physique.";
  } else {
    lastDeltaMessage = "⚽ Période standard : Matchs disputés dans des conditions normales.";
  }

  if (state.player.arroganceScore === undefined) state.player.arroganceScore = 20;

  state.activeEvent = getLocalNarrativeEvent(state.player);

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function handleChoice(choice) {
  let impactSummary = {};
  if (state.player.arroganceScore === undefined) state.player.arroganceScore = 20;

  for (let stat in choice.impact) {
    let val = choice.impact[stat];
    impactSummary[stat] = val;

    if (stat === 'arroganceScore') {
      state.player.arroganceScore = Math.max(0, Math.min(100, state.player.arroganceScore + val));
    } else if (state.player.stats.hasOwnProperty(stat)) {
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

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    let stepContent = '';
  
    if (state.creationStep === 1) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 1 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Identité & Nationalité</h3>
          </div>
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
          <button onclick="randomizeName()" class="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors border border-slate-700">
            🎲 Générer un autre nom aléatoire
          </button>
          <div>
            <label class="text-xs text-slate-400 font-bold">Nationalité</label>
            <select onchange="setNat(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1">
              ${NATIONALITIES.map(n => `<option value="${n.name}" ${state.form.nationality.name === n.name ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}
            </select>
          </div>
          <button onclick="nextStep()" class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
            Suivant ➡️
          </button>
        </div>
      `;
    } else if (state.creationStep === 2) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 2 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Morphologie</h3>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 font-bold">Taille : <span id="val-h">${state.form.height}</span>cm</label>
              <input id="inp-h" type="range" min="160" max="205" value="${state.form.height}" oninput="document.getElementById('val-h').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
            </div>
            <div>
              <label class="text-xs text-slate-400 font-bold">Poids : <span id="val-w">${state.form.weight}</span>kg</label>
              <input id="inp-w" type="range" min="55" max="100" value="${state.form.weight}" oninput="document.getElementById('val-w').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase">Précédent</button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase">Suivant ➡️</button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 3) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 3 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Poste sur le Terrain</h3>
          </div>
          <div class="grid grid-cols-3 gap-2">
            ${POSITIONS.map(p => `<button type="button" onclick="setPos('${p.id}')" class="p-3 rounded-xl border text-xs font-bold transition-all ${state.form.position === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}">${p.label}</button>`).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase">Précédent</button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase">Suivant ➡️</button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 4) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase tracking-wider">Étape 4 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">Style d'Origine</h3>
          </div>
          <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-3 rounded-xl border cursor-pointer text-xs transition-all ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white block text-sm">${o.name}</span>
                <span class="text-[10px] text-emerald-400 font-semibold block mt-0.5">${o.desc}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase">Précédent</button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase">Suivant ➡️</button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 5) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-pink-400 font-bold uppercase tracking-wider">Étape 5 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">❤️ Club de Cœur</h3>
          </div>
          <div class="space-y-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <label class="text-xs text-slate-400 font-bold">Championnat</label>
              <select onchange="setHeartLeague(this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1">
                ${Object.keys(BIG_LEAGUES_CLUBS).map(l => `<option value="${l}" ${state.form.heartClubLeague === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 font-bold">Club</label>
              <select onchange="setHeartClub(this.value)" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white mt-1">
                ${BIG_LEAGUES_CLUBS[state.form.heartClubLeague].map(c => `<option value="${c}" ${state.form.heartClubName === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase">Précédent</button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase">Suivant ➡️</button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 6) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-yellow-400 font-bold uppercase tracking-wider">Étape 6 / 6</span>
            <h3 class="text-base font-bold text-white mt-1">🏟️ Club de Départ</h3>
          </div>
          <div class="space-y-3 max-h-64 overflow-y-auto pr-1">
            ${dynamicStarterClubs.map((club, index) => {
              let simOvr = 42;
              if (state.form.origin.id === 'tardif') simOvr -= 5;
              
              return `
                <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-bold text-white text-sm">${club.name}</span>
                      <span class="text-[10px] text-slate-400 block">${club.league} (${club.tier})</span>
                    </div>
                    <button onclick="submitCreation(${index})" class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg text-xs">
                      Choisir ✍️
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <div>
            <button onclick="prevStep()" class="w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase">Précédent</button>
          </div>
        </div>
      `;
    }

    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h1 class="text-lg font-black text-center text-emerald-400 uppercase tracking-wider">Création du Joueur & Carrière</h1>
        ${stepContent}
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
    const currentPhase = getSeasonPhase(state.player.eventIndex || 0);

    if (state.activeTab === 'dashboard') {
      tabContent = `
        <div class="text-xs text-slate-300 space-y-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between items-center">
            <span>Club actuel : <span class="text-yellow-400 font-bold">${state.player.currentClub}</span></span>
            <span class="text-emerald-400 font-bold">Âge : ${state.player.age} ans • Phase : ${currentPhase}</span>
          </div>
          <div>❤️ Club de cœur : <span class="text-pink-400 font-bold">${state.player.heartClub}</span></div>
          <div>🧬 Origine : <span class="text-cyan-400 font-bold">${state.player.origin.name}</span></div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase">Stats</div>
            <div class="flex justify-between"><span>Technique :</span> <span class="font-bold text-white">${state.player.stats.technique}</span></div>
            <div class="flex justify-between"><span>Physique :</span> <span class="font-bold text-white">${state.player.stats.physique}</span></div>
            <div class="flex justify-between"><span>Mental :</span> <span class="font-bold text-white">${state.player.stats.mental}</span></div>
            <div class="flex justify-between"><span>Relation Coach :</span> <span class="font-bold text-emerald-400">${state.player.stats.relationCoach}/100</span></div>
            <div class="flex justify-between"><span>Arrogance :</span> <span class="font-bold text-pink-400">${state.player.arroganceScore}/100</span></div>
          </div>
          
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase">Évaluation</div>
            <div class="flex justify-between"><span>OVR :</span> <span class="font-bold text-yellow-400 text-sm">${state.player.ovr}</span></div>
            <div class="flex justify-between"><span>POT :</span> <span class="font-bold text-emerald-400 text-sm">${state.player.pot}</span></div>
            <div class="flex justify-between"><span>Trait :</span> <span class="font-semibold text-slate-200">${state.player.traits[0]}</span></div>
          </div>
        </div>
      `;
    } else {
      tabContent = `<div class="p-4 bg-slate-950 rounded-xl text-xs text-slate-400">Section en cours de chargement...</div>`;
    }

    app.innerHTML = `
      ${eventModalHTML}
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h2 class="text-lg font-black text-emerald-400 flex justify-between items-center">
          <span>${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</span>
          <span class="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-300 uppercase">${state.player.position}</span>
        </h2>
        ${tabContent}
        <button onclick="advancePeriod()" ${state.activeEvent ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="w-full py-3 bg-emerald-500 hover:bg-emerald-400 font-black rounded-xl text-slate-950 uppercase text-xs tracking-wider transition-all">
          📅 Avancer (${currentPhase} ➡️)
        </button>
        <button onclick="resetCareer()" class="w-full py-2 bg-slate-950 hover:bg-red-950/40 text-red-400 border border-slate-800 text-xs uppercase">
          Refaire un joueur
        </button>
      </div>
    `;
  }
}

render();

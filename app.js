// --- FONCTION DE GÉREZ LA CLÉ API EN LOCAL ---

function getApiKey() {
  let key = localStorage.getItem('gemini_api_key');
  if (!key) {
    key = prompt("Entre ta clé API Google AI Studio pour activer le moteur narratif :");
    if (key) {
      localStorage.setItem('gemini_api_key', key.trim());
    }
  }
  return key;
}

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
    longDesc: "Issu des structures professionnelles pré-formatées, tu as bénéficié dès ton plus jeune âge d'un encadrement rigoureux, de terrains parfaits et de conseils tactiques poussés. Ton jeu est propre, académique et respectueux des consignes, mais il manque parfois de folie spontanée."
  },
  { 
    id: 'amateur', 
    name: 'Club Amateur', 
    desc: '+10% Physique, -10% Tactique | Trait: Acharné', 
    trait: 'Acharné',
    longDesc: "Formé sur des terrains difficiles sous la pluie, les mottes de terre et les tacles appuyés. Tu possèdes une caisse physique hors norme et un mental d'acier forgé dans la difficulté, même si tes premiers pas tactiques au haut niveau demanderont un temps d'adaptation."
  },
  { 
    id: 'futsal', 
    name: 'Futsal', 
    desc: '+10% Dribble/Technique | Trait: Dribbleur Fin', 
    trait: 'Dribbleur Fin',
    longDesc: "Le rectangle de parquet et le ballon lourd ont sculpté ton toucher de balle. Tu es un maître des espaces réduits, capable de sortir de situations impossibles par des feintes de corps, des contrôles orientés et une vista technique déconcertante."
  },
  { 
    id: 'tardif', 
    name: 'Débutant Tardif', 
    desc: '-5 OVR base | Trait: Poulain Brut', 
    trait: 'Poulain Brut',
    longDesc: "Repéré tardivement dans les championnats loisirs ou de quartier, tu arrives dans le monde pro avec du retard sur les fondamentaux et un bagage technique brut. En contrepartie, ton potentiel de progression explosif et ta faim de réussite surprennent tous les observateurs."
  },
  { 
    id: 'street', 
    name: 'Street Football', 
    desc: '+10% Dribble | Trait: Instinct 1v1', 
    trait: 'Instinct 1v1',
    longDesc: "Le bitume, les cages improvisées entre des sweats et les matches de rue permanents t'ont forgé un instinct de duel implacable. Tu n'as peur de personne, provoques sans cesse ton vis-à-vis et possèdes ce brin d'insolence propre aux virtuoses de la rue."
  },
  { 
    id: 'athlete', 
    name: 'Athlète Polyvalent', 
    desc: '+15% Vitesse/Puissance | Trait: Moteur Hybride', 
    trait: 'Moteur Hybride',
    longDesc: "Doté de dispositions athlétiques hors du commun dès l'adolescence, tu combines vitesse pure et coffre immense. Capable de répéter les efforts haute intensité pendant 90 minutes, tu compenses un placement parfois approximatif par un impact physique total."
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
  { name: 'Pau FC', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 45, coachName: 'Nicolas Usaï', coachStyle: 'Bloc compact et solidité.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'SC Bastia', league: 'Ligue 2 BKT', tier: 'D2', minOvr: 48, coachName: 'Benoît Tavenot', coachStyle: 'Duels agressifs et grinta.', trainingQuality: 'Très Bonne', playtime: 'Modéré' },
  { name: 'Wrexham AFC', league: 'EFL League One', tier: 'D3', minOvr: 46, coachName: 'Phil Parkinson', coachStyle: 'Puissance et mentalité de vainqueur.', trainingQuality: 'Bonne', playtime: 'Modéré' },
  { name: 'CD Castellón', league: 'LaLiga Hypermotion', tier: 'D2', minOvr: 50, coachName: 'Dick Schreuder', coachStyle: 'Possession audacieuse.', trainingQuality: 'Très Bonne', playtime: 'Faible' },
  { name: 'Dynamo Dresden', league: '3. Liga', tier: 'D3', minOvr: 42, coachName: 'Thomas Stamm', coachStyle: 'Pressing étouffant.', trainingQuality: 'Très Bonne', playtime: 'Correct' },
  { name: 'US Salernitana', league: 'Serie B', tier: 'D2', minOvr: 48, coachName: 'Giovanni Martusciello', coachStyle: 'Ferveur, intensité et technique.', trainingQuality: 'Très Bonne', playtime: 'Modéré' }
];

function getRandomStarterClubs() {
  let shuffled = [...CITIES_AND_CLUBS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 4);
}

let dynamicStarterClubs = getRandomStarterClubs();

function getYouthCategoryAndExpectations(ovr, position, tier) {
  let category = "U16";
  if (ovr >= 44 && ovr < 49) category = "U17";
  else if (ovr >= 49) category = "U19";

  let expectations = { goals: 2, assists: 2, cleanSheets: 3 };
  return {
    category,
    expectations,
    boardExpectation: `S'imposer dans l'effectif en ${category} et répondre aux exigences du coach.`,
    contractText: `Contrat jeune (${category})`
  };
}

const STAFF_DATA = {
  physio: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de préparateur.', effect: 'Aucun' },
    { id: 1, name: 'Préparateur Amateur', unlock: () => true, cost: 200, desc: 'Niveau local', effect: 'Risque blessure -5%' },
    { id: 2, name: 'Préparateur Pro', unlock: (p) => p.balance >= 1000, cost: 1500, desc: 'Niveau pro', effect: 'Risque blessure -20%' }
  ],
  tech: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de coach technique.', effect: 'Aucun' },
    { id: 1, name: 'Coach Local', unlock: () => true, cost: 150, desc: 'Bases techniques', effect: 'XP Technique +5%' }
  ],
  mental: [
    { id: 0, name: 'Aucun', cost: 0, desc: 'Pas de suivi.', effect: 'Aucun' },
    { id: 1, name: 'App Dev Perso', unlock: () => true, cost: 50, desc: 'Lecture', effect: 'Mental stable' }
  ],
  chef: [
    { id: 0, name: 'Cantine Standard', cost: 0, desc: 'Repas du club', effect: 'Neutre' },
    { id: 1, name: 'Diététicien', unlock: () => true, cost: 1000, desc: 'Suivi pro', effect: 'Forme optimale' }
  ]
};

// --- SYSTÈMES DE SAISON & FRÉQUENCES DES ÉVÉNEMENTS ---

const SEASON_EVENTS = [
  { key: 'pre_saison', label: 'Pré-saison', desc: 'Remise en forme, stage de préparation et choix du onze type.' },
  { key: 'saison', label: 'Saison régulière', desc: 'Enchaînement des matches de championnat et gestion de la forme.' },
  { key: 'mercato', label: 'Mercato', desc: 'Ouverture du marché des transferts, convoitises et discussions.' },
  { key: 'fin_saison', label: 'Fin de saison', desc: 'Bilan annuel, renouvellement de contrat et cérémonies.' }
];

function getCurrentSeasonEvent(stepIndex) {
  // 4 étapes par an -> 1 étape par trimestre / phase
  const index = stepIndex % 4;
  return SEASON_EVENTS[index];
}

// --- FONCTION DE GÉNÉRATION PAR IA ---

async function generateAIEvents(playerState, seasonPhase) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const recentHistory = playerState.history && playerState.history.length > 0 
    ? playerState.history.slice(-3).map(h => h.context).join(", ") 
    : "Aucun historique récent";

  const prompt = `
    Tu es le moteur narratif d'un RPG textuel de football.
    Phase actuelle de la saison : ${seasonPhase.label} (${seasonPhase.desc}).
    Joueur : ${playerState.firstName} ${playerState.lastName}, ${playerState.age} ans, poste ${playerState.position}, club ${playerState.currentClub}.
    Stats : Tech ${playerState.stats.technique}, Phys ${playerState.stats.physique}, Ment ${playerState.stats.mental}, Relation Coach ${playerState.stats.relationCoach}/100.

    ÉVÉNEMENTS RÉCENTS À NE PAS REPRODUIRE : [ ${recentHistory} ]

    Génère UN événement narratif court et percutant adapté spécifiquement à la phase "${seasonPhase.label}".
    Propose OBLIGATOIREMENT 3 ou 4 choix distincts avec des impacts chiffrés.
    Renvoie STRICTEMENT au format JSON :
    {
      "context": "Titre court",
      "text": "Description de la situation...",
      "choices": [
        { "text": "Choix 1", "impact": { "mental": 5, "relationCoach": 2 } },
        { "text": "Choix 2", "impact": { "technique": 3, "physique": -2 } }
      ]
    }
  `;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    const parsedEvent = JSON.parse(data.candidates[0].content.parts[0].text);

    if (!playerState.history) playerState.history = [];
    playerState.history.push({ context: parsedEvent.context });

    return parsedEvent;
  } catch (error) {
    console.error("Erreur API Gemini:", error);
    return {
      context: `Point d'étape : ${seasonPhase.label}`,
      text: `La phase de ${seasonPhase.label.toLowerCase()} bat son plein au sein du club de ${playerState.currentClub}. Comment gères-tu cette échéance ?`,
      choices: [
        { text: "Redoubler d'efforts à l'entraînement", impact: { technique: +3, physique: +2 } },
        { text: "Discuter avec l'entraîneur pour clarifier ton rôle", impact: { relationCoach: +5, mental: -1 } },
        { text: "Souffler un peu pour éviter le burn-out", impact: { mental: +3, physique: -2 } }
      ]
    };
  }
}

// --- ÉTAT GLOBAL ET GESTION DU JEU ---

let savedData = JSON.parse(localStorage.getItem('career_rpg_save_v2'));
if (savedData && (!savedData.coach || savedData.seasonStep === undefined)) {
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

function generatePlayer(formData, selectedStarterClub) {
  let baseOvr = 42;
  if (formData.origin.id === 'tardif') baseOvr -= 5;

  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    nationality: formData.nationality,
    position: formData.position,
    origin: formData.origin,
    height: formData.height,
    weight: formData.weight,
    age: 16,
    ovr: baseOvr,
    pot: 85,
    stats: { technique: 45, physique: 45, mental: 40, relationCoach: 50 },
    traits: [formData.origin.trait],
    seasonStep: 0, // Compteur des 4 phases par an
    currentClub: selectedStarterClub.name,
    weeklySalary: 250,
    balance: 500,
    fame: 10,
    coach: {
      name: selectedStarterClub.coachName,
      style: selectedStarterClub.coachStyle,
      category: 'U17',
      expectations: { goals: 5, assists: 3 },
      boardExpectation: 'Valider les acquis de formation.',
      contractText: 'Contrat jeune',
      currentGoals: 0,
      currentAssists: 0
    },
    staff: { physio: 0, tech: 0, mental: 0, chef: 0 },
    heartClub: formData.heartClubName,
    history: []
  };
}

function updateFormInput() {
  const fnInput = document.getElementById('inp-fn');
  const lnInput = document.getElementById('inp-ln');
  if (fnInput) state.form.firstName = fnInput.value;
  if (lnInput) state.form.lastName = lnInput.value;
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

function submitCreation(clubIndex) {
  updateFormInput();
  const chosenClub = dynamicStarterClubs[clubIndex] || dynamicStarterClubs[0];
  state.player = generatePlayer(state.form, chosenClub);
  localStorage.setItem('career_rpg_save_v2', JSON.stringify(state.player));
  render();
}

function resetCareer() {
  localStorage.removeItem('career_rpg_save_v2');
  state.player = null;
  state.activeEvent = null;
  state.creationStep = 1;
  lastChoiceFeedback = null;
  dynamicStarterClubs = getRandomStarterClubs();
  render();
}

function setTab(tab) { state.activeTab = tab; render(); }

function hireStaff(category, level) {
  state.player.staff[category] = level;
  localStorage.setItem('career_rpg_save_v2', JSON.stringify(state.player));
  render();
}

async function advanceSeasonPhase() {
  state.player.seasonStep += 1;
  state.player.balance += state.player.weeklySalary * 4; // Paie trimestrielle/phase
  lastChoiceFeedback = null;

  // Si on boucle 4 phases, on prend 1 an d'âge
  if (state.player.seasonStep % 4 === 0) {
    state.player.age += 1;
  }

  const currentPhase = getCurrentSeasonEvent(state.player.seasonStep);
  state.activeEvent = await generateAIEvents(state.player, currentPhase);

  localStorage.setItem('career_rpg_save_v2', JSON.stringify(state.player));
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
  localStorage.setItem('career_rpg_save_v2', JSON.stringify(state.player));
  render();
}

// --- RENDU GRAPHIQUE ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    let stepContent = '';
    if (state.creationStep === 1) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase">Étape 1 / 3</span>
            <h3 class="text-base font-bold text-white mt-1">Identité & Poste</h3>
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
          <button onclick="randomizeName()" class="w-full py-2 bg-slate-800 text-emerald-400 font-bold rounded-xl text-xs">🎲 Aléatoire</button>
          <div>
            <label class="text-xs text-slate-400 font-bold">Poste</label>
            <div class="grid grid-cols-5 gap-2 mt-1">
              ${POSITIONS.map(p => `<button type="button" onclick="setPos('${p.id}')" class="p-2 rounded-lg border text-xs font-bold ${state.form.position === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}">${p.label}</button>`).join('')}
            </div>
          </div>
          <button onclick="nextStep()" class="w-full py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase">Suivant ➡️</button>
        </div>
      `;
    } else if (state.creationStep === 2) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-emerald-400 font-bold uppercase">Étape 2 / 3</span>
            <h3 class="text-base font-bold text-white mt-1">Style d'Origine</h3>
          </div>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-3 rounded-xl border cursor-pointer text-xs ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white block text-sm">${o.name}</span>
                <span class="text-[10px] text-emerald-400">${o.desc}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="prevStep()" class="w-1/3 py-3 bg-slate-800 text-white font-bold rounded-xl text-xs">⬅️ Précédent</button>
            <button onclick="nextStep()" class="w-2/3 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs">Suivant ➡️</button>
          </div>
        </div>
      `;
    } else if (state.creationStep === 3) {
      stepContent = `
        <div class="space-y-4">
          <div class="text-center">
            <span class="text-xs text-yellow-400 font-bold uppercase">Étape 3 / 3</span>
            <h3 class="text-base font-bold text-white mt-1">Club de Départ</h3>
          </div>
          <div class="space-y-2 max-h-56 overflow-y-auto">
            ${dynamicStarterClubs.map((club, index) => `
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center">
                <div>
                  <span class="font-bold text-white text-sm">${club.name}</span>
                  <span class="text-[10px] text-slate-400 block">${club.league}</span>
                </div>
                <button onclick="submitCreation(${index})" class="px-3 py-1.5 bg-yellow-500 text-slate-950 font-bold rounded-lg text-xs">Choisir ✍️</button>
              </div>
            `).join('')}
          </div>
          <button onclick="prevStep()" class="w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-xs">⬅️ Précédent</button>
        </div>
      `;
    }

    app.innerHTML = `<div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">${stepContent}</div>`;
  } else {
    let currentPhase = getCurrentSeasonEvent(state.player.seasonStep);

    let eventModalHTML = '';
    if (state.activeEvent) {
      eventModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div class="bg-slate-900 border-2 border-emerald-500 p-5 rounded-2xl max-w-lg w-full space-y-4">
            <span class="text-xs font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">${state.activeEvent.context}</span>
            <p class="text-white text-sm leading-relaxed">${state.activeEvent.text}</p>
            <div class="space-y-2">
              ${state.activeEvent.choices.map((c, index) => `
                <button onclick='handleChoice(${JSON.stringify(c)})' class="w-full text-left p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 rounded-xl text-xs text-slate-300">
                  <b>${index + 1}.</b> ${c.text}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    let tabContent = '';
    if (state.activeTab === 'dashboard') {
      tabContent = `
        <div class="text-xs text-slate-300 space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between items-center">
            <span>Club : <span class="text-yellow-400 font-bold">${state.player.currentClub}</span></span>
            <span class="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">${state.player.age} ans • Phase : ${currentPhase.label}</span>
          </div>
          <p class="text-slate-400 italic text-[11px]">${currentPhase.desc}</p>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="font-bold text-slate-400">Stats</div>
            <div class="flex justify-between"><span>Technique :</span> <span class="font-bold text-white">${state.player.stats.technique}</span></div>
            <div class="flex justify-between"><span>Physique :</span> <span class="font-bold text-white">${state.player.stats.physique}</span></div>
            <div class="flex justify-between"><span>Mental :</span> <span class="font-bold text-white">${state.player.stats.mental}</span></div>
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="font-bold text-slate-400">Évaluation</div>
            <div class="flex justify-between"><span>OVR :</span> <span class="font-bold text-yellow-400">${state.player.ovr}</span></div>
            <div class="flex justify-between"><span>Relation Coach :</span> <span class="font-bold text-emerald-400">${state.player.stats.relationCoach}</span></div>
          </div>
        </div>
      `;
    } else if (state.activeTab === 'finances') {
      tabContent = `
        <div class="space-y-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div class="font-bold text-emerald-400">Finances</div>
          <div class="flex justify-between"><span>Solde :</span> <span class="font-bold text-yellow-400">$${state.player.balance}</span></div>
          <div class="flex justify-between"><span>Salaire / Phase :</span> <span class="font-bold text-emerald-400">+$${state.player.weeklySalary * 4}</span></div>
        </div>
      `;
    }

    app.innerHTML = `
      ${eventModalHTML}
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
        <h2 class="text-lg font-black text-emerald-400 flex justify-between">
          <span>${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</span>
          <span class="text-xs bg-slate-950 px-2 py-1 rounded text-slate-300">${state.player.position}</span>
        </h2>
        <div class="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button onclick="setTab('dashboard')" class="py-2 font-bold rounded-lg ${state.activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}">Dashboard</button>
          <button onclick="setTab('finances')" class="py-2 font-bold rounded-lg ${state.activeTab === 'finances' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}">Finances</button>
        </div>
        ${tabContent}
        <button onclick="advanceSeasonPhase()" ${state.activeEvent ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 font-black rounded-xl text-white uppercase text-xs">
          ➡️ Passer à la phase suivante (${currentPhase.label})
        </button>
        <button onclick="resetCareer()" class="w-full py-2 bg-slate-950 text-red-400 border border-slate-800 font-bold rounded-xl text-xs">Refaire un joueur</button>
      </div>
    `;
  }
}

render();

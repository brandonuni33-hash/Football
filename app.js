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

async function generateAIEvents(playerState) {
  const prompt = `
    Tu es le moteur narratif d'un RPG textuel de football ultra-réaliste.
    Voici l'état actuel du joueur :
    - Nom : ${playerState.firstName} ${playerState.lastName}
    - Âge : ${playerState.age} ans
    - Poste : ${playerState.position}
    - Club : ${playerState.currentClub}
    - Stats : Technique ${playerState.stats.technique}, Physique ${playerState.stats.physique}, Mental ${playerState.stats.mental}
    - Relation Coach : ${playerState.stats.relationCoach}/100
    - Solde : $${playerState.balance}

    Génère UN événement narratif complexe et immersif adapté à son âge et à sa situation actuelle. 
    Renvoie le résultat STRICTEMENT au format JSON avec cette structure :
    {
      "context": "Titre court du contexte",
      "text": "Le texte narratif décrivant la situation...",
      "choices": [
        {
          "text": "Description du choix 1",
          "impact": { "mental": 5, "discipline": -2 }
        },
        {
          "text": "Description du choix 2",
          "impact": { "technique": 3, "relationCoach": -4 }
        }
      ]
    }
  `;

  // Appel de l'API LLM (Exemple conceptuel)
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer TON_API_KEY', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    })
  });
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
  */
}


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

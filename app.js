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
  { id: 'centre', name: 'Centre de Formation', desc: '+10% Mental/Tactique | Trait: Classique', modifiers: { mental: 10, tactique: 10 }, trait: 'Classique' },
  { id: 'amateur', name: 'Club Amateur', desc: '+10% Physique, -10% Tactique | Trait: Acharné', modifiers: { physique: 10, tactique: -10 }, trait: 'Acharné' },
  { id: 'futsal', name: 'Futsal', desc: '+10% Dribble/Technique, -15% Physique | Trait: Dribbleur Fin', modifiers: { technique: 10, physique: -15 }, trait: 'Dribbleur Fin' },
  { id: 'tardif', name: 'Débutant Tardif', desc: '-5 OVR base | Trait: Poulain Brut', modifiers: { ovrOffset: -5 }, trait: 'Poulain Brut' },
  { id: 'street', name: 'Street Football', desc: '+10% Dribble, -10% Discipline | Trait: Instinct 1v1', modifiers: { technique: 10, discipline: -10 }, trait: 'Instinct 1v1' },
  { id: 'athlete', name: 'Athlète Polyvalent', desc: '+15% Vitesse/Puissance, -10% Toucher | Trait: Moteur Hybride', modifiers: { physique: 15, technique: -10 }, trait: 'Moteur Hybride' }
];

// --- 2. BASE DE DONNÉES DES CLUBS (5 Grands Championnats & Ligues Inférieures) ---

const CLUBS_DATABASE = {
  france: [
    { name: 'FC Local (Amateur)', tier: 'Amateur', minOvr: 0, league: 'Régional 1' },
    { name: 'Pau FC', tier: 'D2', minOvr: 55, league: 'Ligue 2 BKT' },
    { name: 'SC Bastia', tier: 'D2', minOvr: 58, league: 'Ligue 2 BKT' },
    { name: 'FC Nantes', tier: 'D1', minOvr: 68, league: 'Ligue 1 McDonald\'s' },
    { name: 'OGC Nice', tier: 'D1', minOvr: 73, league: 'Ligue 1 McDonald\'s' },
    { name: 'Olympique de Marseille', tier: 'Top', minOvr: 78, league: 'Ligue 1 McDonald\'s' },
    { name: 'Paris Saint-Germain', tier: 'Elite', minOvr: 84, league: 'Ligue 1 McDonald\'s' }
  ],
  angleterre: [
    { name: 'Bromley FC', tier: 'D4', minOvr: 52, league: 'EFL League Two' },
    { name: 'Wrexham AFC', tier: 'D3', minOvr: 58, league: 'EFL League One' },
    { name: 'Leeds United', tier: 'D2', minOvr: 68, league: 'EFL Championship' },
    { name: 'West Ham United', tier: 'D1', minOvr: 75, league: 'Premier League' },
    { name: 'Liverpool FC', tier: 'Elite', minOvr: 85, league: 'Premier League' }
  ],
  espagne: [
    { name: 'CD Castellón', tier: 'D2', minOvr: 57, league: 'LaLiga Hypermotion' },
    { name: 'Real Zaragoza', tier: 'D2', minOvr: 62, league: 'LaLiga Hypermotion' },
    { name: 'Villarreal CF', tier: 'D1', minOvr: 74, league: 'LaLiga EA Sports' },
    { name: 'Atlético de Madrid', tier: 'Elite', minOvr: 82, league: 'LaLiga EA Sports' }
  ],
  allemagne: [
    { name: 'Dynamo Dresde', tier: 'D3', minOvr: 55, league: '3. Liga' },
    { name: 'Schalke 04', tier: 'D2', minOvr: 65, league: '2. Bundesliga' },
    { name: 'VfB Stuttgart', tier: 'D1', minOvr: 74, league: 'Bundesliga' },
    { name: 'FC Bayern München', tier: 'Elite', minOvr: 85, league: 'Bundesliga' }
  ],
  italie: [
    { name: 'LR Vicenza', tier: 'D3', minOvr: 54, league: 'Serie C' },
    { name: 'Palermo FC', tier: 'D2', minOvr: 63, league: 'Serie B' },
    { name: 'Torino FC', tier: 'D1', minOvr: 72, league: 'Serie A' },
    { name: 'Inter Milan', tier: 'Elite', minOvr: 84, league: 'Serie A' }
  ]
};

// --- 3. MOTEUR NARRATIF ---

const NARRATIVE_ENGINE = {
  events: [
    {
      id: 'family_night',
      context: 'Veille de Match Capital',
      text: "Tes deux enfants ont du mal à dormir et pleurent, ton/ta partenaire est à bout de nerfs. Demain, c'est le match le plus important de la saison.",
      choices: [
        { text: "Veiller toute la nuit avec eux (Sacrifier ton sommeil)", impact: { mental: +8, physique: -10, relationCoach: -2 } },
        { text: "S'isoler dans une autre pièce pour dormir (Froid et pragmatique)", impact: { physique: +5, mental: -5, discipline: +3 } },
        { text: "Déléguer en payant une baby-sitter de nuit en urgence", impact: { charisme: +4, reputation: +2, discipline: -3 } },
        { text: "Prendre un somnifère pour couper net et ignorer le bruit", impact: { physique: +2, mental: -8 } },
        { text: "Discuter des heures avec ton/ta partenaire pour crever l'abcès", impact: { mental: +4, charisme: +3, physique: -6 } }
      ]
    },
    {
      id: 'scout_interest',
      context: 'Pression des Médias & Agent',
      text: "Un agent te contacte en secret : un grand club s'intéresse à toi, mais il exige que tu fasses le forcing pour pourrir l'ambiance à l'entraînement et forcer ton transfert.",
      choices: [
        { text: "Refuser net : 'Je reste fidèle à mon club et je parle sur le terrain'", impact: { discipline: +10, relationCoach: +10, reputation: -5 } },
        { text: "Accepter de mettre la pression subtilement via les réseaux sociaux", impact: { charisme: +6, relationCoach: -10, reputation: +8 } },
        { text: "Faire la grève des entraînements pour obliger les dirigeants à céder", impact: { discipline: -15, relationCoach: -25, reputation: +15 } },
        { text: "Transférer l'appel directement à ton coach par honnêteté totale", impact: { relationCoach: +15, discipline: +5, charisme: -2 } },
        { text: "Ignorer l'agent et te concentrer uniquement sur tes stats personnelles", impact: { technique: +3, vestiaire: -5 } }
      ]
    }
  ]
};

let state = {
  step: 1,
  player: JSON.parse(localStorage.getItem('career_rpg_save')) || null,
  activeEvent: null,
  transferOffersModal: null, // Gère l'affichage des offres de clubs
  form: {
    firstName: 'Brandon',
    lastName: 'Le Moan',
    nationality: NATIONALITIES[0],
    height: 180,
    weight: 75,
    position: 'BU',
    origin: ORIGINS[0]
  }
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- 4. GÉNÉRATION DES STATS & GESTION DU MERCATO ---

function generatePlayer(formData) {
  let baseOvr = randInt(35, 50);
  if (formData.origin.id === 'tardif') baseOvr -= 5;
  let basePot = randInt(70, 99);

  const physicalBonus = Math.floor((formData.height / 10) + (formData.weight / 10)) - 25;
  const technicalPenalty = Math.floor((formData.height / 20) + (formData.weight / 20)) - 12;

  const mods = {
    centre: { tech: 1.2, phys: 1.0, ment: 1.3 },
    amateur: { tech: 0.9, phys: 1.2, ment: 0.8 },
    futsal: { tech: 1.4, phys: 0.7, ment: 1.0 },
    tardif: { tech: 0.8, phys: 1.1, ment: 1.0 },
    street: { tech: 1.3, phys: 1.1, ment: 0.7 },
    athlete: { tech: 0.7, phys: 1.5, ment: 0.9 }
  };
  const m = mods[formData.origin.id] || { tech: 1, phys: 1, ment: 1 };

  let stats = {
    technique: Math.round((40 - technicalPenalty) * m.tech),
    physique: Math.round((40 + physicalBonus) * m.phys),
    mental: Math.round(40 * m.ment),
    charisme: randInt(20, 60),
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
    ovr: baseOvr,
    pot: basePot,
    stats: stats,
    hidden: { regularite: randInt(1, 20), matchImportant: randInt(1, 20), blessure: randInt(1, 20) },
    traits: [formData.origin.trait],
    history: [],
    week: 1,
    currentClub: 'FC Local (Amateur)'
  };
}

// Générateur d'offres de contrat selon l'OVR actuel du joueur
function checkTransferOffers() {
  let availableClubs = [];
  
  // Parcourir toutes les nations et trouver les clubs adaptés à l'OVR du joueur
  for (let country in CLUBS_DATABASE) {
    CLUBS_DATABASE[country].forEach(club => {
      // Le joueur reçoit des offres de clubs dont le minOvr est proche ou inférieur à son niveau
      if (state.player.ovr >= club.minOvr && state.player.ovr <= club.minOvr + 12 && club.name !== state.player.currentClub) {
        availableClubs.push(club);
      }
    });
  }

  // Si on trouve des clubs, on en pioche 3 aléatoirement pour les proposer
  if (availableClubs.length > 0) {
    // Mélange et sélection de 3 max
    let shuffled = availableClubs.sort(() => 0.5 - Math.random());
    state.transferOffersModal = shuffled.slice(0, 3);
  } else {
    // Offre de secours par défaut si l'OVR est très bas
    state.transferOffersModal = [{ name: 'FC Local (Amateur)', tier: 'Amateur', league: 'Régional 1' }];
  }
  render();
}

function acceptOffer(clubName) {
  state.player.currentClub = clubName;
  state.transferOffersModal = null;
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
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

function submitCreation() {
  updateFormInput();
  state.player = generatePlayer(state.form);
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function resetCareer() {
  localStorage.removeItem('career_rpg_save');
  state.player = null;
  state.activeEvent = null;
  state.transferOffersModal = null;
  render();
}

function advanceWeek() {
  state.player.week += 1;

  // Tous les 10 semaines, le mercato ouvre et propose de nouveaux contrats
  if (state.player.week % 10 === 0) {
    checkTransferOffers();
    return;
  }

  if (Math.random() < 0.5) {
    state.activeEvent = NARRATIVE_ENGINE.events[Math.floor(Math.random() * NARRATIVE_ENGINE.events.length)];
  } else {
    state.activeEvent = null;
  }

  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function handleChoice(choice) {
  for (let stat in choice.impact) {
    if (state.player.stats.hasOwnProperty(stat)) {
      state.player.stats[stat] = Math.max(0, Math.min(100, state.player.stats[stat] + choice.impact[stat]));
    } else if (state.player.hasOwnProperty(stat)) {
      state.player[stat] += choice.impact[stat];
    }
  }
  
  state.player.ovr = Math.round((state.player.stats.technique * 0.4) + (state.player.stats.physique * 0.3) + (state.player.stats.mental * 0.3));
  state.activeEvent = null;
  
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

// --- 5. RENDU GRAPHIQUE ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    // Écran de Création
    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h1 class="text-xl font-black text-center text-emerald-400 uppercase tracking-wider">Création du Joueur</h1>
        
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
            <label class="text-xs text-slate-400 font-bold">Taille (cm) : <span id="val-h">${state.form.height}</span>cm</label>
            <input id="inp-h" type="range" min="160" max="205" value="${state.form.height}" oninput="document.getElementById('val-h').innerText=this.value" class="w-full mt-2 accent-emerald-400"/>
          </div>
          <div>
            <label class="text-xs text-slate-400 font-bold">Poids (kg) : <span id="val-w">${state.form.weight}</span>kg</label>
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
          <div class="space-y-1.5 mt-1 max-h-40 overflow-y-auto pr-1">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white">${o.name}</span> — ${o.desc}
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="submitCreation()" class="w-full py-3 bg-emerald-500 font-black rounded-xl text-slate-950 uppercase text-sm tracking-wide mt-2 hover:bg-emerald-400 transition-colors">Valider et Lancer la Carrière 🚀</button>
      </div>
    `;
  } else {
    // Pop-up d'événement narratif
    let eventModalHTML = '';
    if (state.activeEvent) {
      eventModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-slate-900 border-2 border-emerald-500 p-5 rounded-2xl max-w-lg w-full my-auto space-y-4 shadow-2xl">
            <div>
              <span class="text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">${state.activeEvent.context}</span>
              <p class="text-white text-sm mt-3 leading-relaxed">${state.activeEvent.text}</p>
            </div>
            
            <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
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

    // Pop-up des Offres de Transfert (Mercato)
    let transferModalHTML = '';
    if (state.transferOffersModal) {
      transferModalHTML = `
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div class="bg-slate-900 border-2 border-yellow-500 p-5 rounded-2xl max-w-lg w-full my-auto space-y-4 shadow-2xl">
            <div>
              <span class="text-xs font-black uppercase text-yellow-400 tracking-widest bg-yellow-500/10 px-2.5 py-1 rounded-md border border-yellow-500/20">Mercato - Offres de Contrat  mercato 📄</span>
              <p class="text-white text-sm mt-3 leading-relaxed">Tes performances et ton OVR actuel (${state.player.ovr}) attirent des recruteurs. Choisis ta nouvelle destination :</p>
            </div>
            
            <div class="space-y-2">
              ${state.transferOffersModal.map(club => `
                <button onclick="acceptOffer('${club.name}')" 
                        class="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-yellow-500 rounded-xl text-xs text-slate-200 transition-all flex justify-between items-center group">
                  <div>
                    <div class="font-bold text-white text-sm group-hover:text-yellow-400">${club.name}</div>
                    <div class="text-[10px] text-slate-400">${club.league} (${club.tier})</div>
                  </div>
                  <span class="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg font-bold">Signer ✍️</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Tableau de bord Principal
    app.innerHTML = `
      ${eventModalHTML}
      ${transferModalHTML}
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white shadow-xl">
        <h2 class="text-lg font-black text-emerald-400 flex justify-between items-center">
          <span>${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</span>
          <span class="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-300 uppercase">${state.player.position}</span>
        </h2>

        <div class="text-xs text-slate-300 space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div class="flex justify-between items-center">
            <span>Club actuel : <span class="text-yellow-400 font-bold">${state.player.currentClub}</span></span>
            <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold">Semaine ${state.player.week}</span>
          </div>
          <div class="flex gap-4">
            <div>Général (OVR) : <span class="font-bold text-yellow-400 text-sm">${state.player.ovr}</span></div>
            <div>Potentiel (POT) : <span class="font-bold text-emerald-400 text-sm">${state.player.pot}</span></div>
          </div>
          <div>Origine : ${state.player.origin.name} | Trait : <span class="text-slate-100 font-semibold">${state.player.traits[0]}</span></div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Stats Principales</div>
            <div class="flex justify-between"><span>Technique :</span> <span class="font-bold text-white">${state.player.stats.technique}</span></div>
            <div class="flex justify-between"><span>Physique :</span> <span class="font-bold text-white">${state.player.stats.physique}</span></div>
            <div class="flex justify-between"><span>Mental :</span> <span class="font-bold text-white">${state.player.stats.mental}</span></div>
            <div class="flex justify-between"><span>Relation Coach :</span> <span class="font-bold text-emerald-400">${state.player.stats.relationCoach}</span></div>
          </div>
          
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div class="font-bold text-slate-400 uppercase tracking-wider">Stats Cachées</div>
            <div class="flex justify-between"><span>Régularité :</span> <span class="font-bold text-slate-300">${state.player.hidden.regularite}/20</span></div>
            <div class="flex justify-between"><span>Matchs Clés :</span> <span class="font-bold text-slate-300">${state.player.hidden.matchImportant}/20</span></div>
            <div class="flex justify-between"><span>Résist. Blessure :</span> <span class="font-bold text-slate-300">${state.player.hidden.blessure}/20</span></div>
          </div>
        </div>

        <button onclick="advanceWeek()" ${state.activeEvent || state.transferOffersModal ? 'disabled class="opacity-50 cursor-not-allowed"' : ''} class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black rounded-xl text-white uppercase text-xs tracking-wider shadow-lg transition-all">
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

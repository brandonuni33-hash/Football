const POSITIONS = ['BU', 'AG', 'AD', 'MOC', 'MC', 'MDC', 'DC', 'DD', 'DG', 'GK'];

const ACADEMY_POOL = [
  { id: 'bacalan', club: 'FC Bacalan U15', division: 'Régional 1', salary: 120, coach: { name: 'Marc Vasseur', style: 'Gegenpressing', trust: 50 } },
  { id: 'pessac', club: 'US Pessac U15', division: 'Régional 2', salary: 95, coach: { name: 'Antoine Morel', style: 'Tiki-Taka', trust: 60 } },
  { id: 'girondins_b', club: 'Girondins B (U15)', division: 'National U15', salary: 220, coach: { name: 'Laurent Blanc', style: 'Contre-Attaque', trust: 40 } }
];

// État initial du jeu
let state = {
  step: 1,
  player: JSON.parse(localStorage.getItem('career_rpg_save')) || null,
  form: { firstName: 'Brandon', lastName: 'Le Moan', position: 'BU' },
  availableOffers: [],
  selectedOffer: null,
  weekLogs: [],
  matchState: null,
  trainingDoneThisWeek: false
};

// --- Fonctions de Navigation / Création ---

function setPos(p) { state.form.position = p; render(); }

function goToStep2() {
  state.form.firstName = document.getElementById('inp-fn').value || 'Brandon';
  state.form.lastName = document.getElementById('inp-ln').value || 'Le Moan';
  state.availableOffers = [...ACADEMY_POOL];
  state.selectedOffer = state.availableOffers[0];
  state.step = 2;
  render();
}

function selectOffer(id) { 
  state.selectedOffer = state.availableOffers.find(o => o.id === id); 
  render(); 
}

function startCareer() {
  const offer = state.selectedOffer;
  state.player = {
    identity: { firstName: state.form.firstName, lastName: state.form.lastName, position: state.form.position },
    status: { week: 1, season: 1, averageRating: 6.5 },
    contract: { club: offer.club, division: offer.division, salary: offer.salary },
    coachTrust: offer.coach.trust,
    finances: { balance: 350 },
    stats: { tir: 52, passe: 50, dribble: 54, physique: 48, mental: 50, moral: 75 },
    history: { matchs: 0, goals: 0, assists: 0 }
  };
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  state.weekLogs = [`Signature au ${offer.club}.`];
  render();
}

function resetCareer() { 
  localStorage.removeItem('career_rpg_save'); 
  state.player = null; 
  state.step = 1; 
  render(); 
}

// --- Rendu de l'interface ---

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    if (state.step === 1) {
      app.innerHTML = `
        <div class="max-w-xl mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h1 class="text-2xl font-black text-center text-brand-500 uppercase">Création du Joueur</h1>
          <div class="grid grid-cols-2 gap-3">
            <input id="inp-fn" type="text" value="${state.form.firstName}" class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white"/>
            <input id="inp-ln" type="text" value="${state.form.lastName}" class="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white"/>
          </div>
          <div class="grid grid-cols-5 gap-2">
            ${POSITIONS.map(p => `<button onclick="setPos('${p}')" class="p-2.5 rounded border text-xs font-bold ${state.form.position === p ? 'bg-brand-500/20 border-brand-500 text-brand-500' : 'bg-slate-950 border-slate-800'}">${p}</button>`).join('')}
          </div>
          <button onclick="goToStep2()" class="w-full py-3 bg-brand-500 font-black rounded-xl text-slate-950 uppercase">Suivant ▶</button>
        </div>
      `;
    } else {
      app.innerHTML = `
        <div class="max-w-xl mx-auto my-8 p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 class="text-lg font-bold">Choisir un contrat d'Académie</h2>
          <div class="space-y-2">
            ${state.availableOffers.map(o => `
              <div onclick="selectOffer('${o.id}')" class="p-4 rounded-xl border cursor-pointer ${state.selectedOffer && state.selectedOffer.id === o.id ? 'bg-brand-500/10 border-brand-500' : 'bg-slate-950 border-slate-800'}">
                <div class="font-bold">${o.club}</div>
                <div class="text-xs text-slate-400">${o.division} • ${o.salary}€ / sem</div>
              </div>
            `).join('')}
          </div>
          <button onclick="startCareer()" class="w-full py-3 bg-brand-500 font-black rounded-xl text-slate-950 uppercase">Signer le contrat ✍️</button>
        </div>
      `;
    }
  } else {
    // Ici, le rendu de l'interface principale (stats, entraînement, etc.)
    app.innerHTML = `<div class="text-white">Carrière active : ${state.player.identity.firstName} ${state.player.identity.lastName}</div>`;
  }
}

render();

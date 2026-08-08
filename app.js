// --- BLOC 1 & 2 : DONNÉES & GÉNÉRATION ---

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
  { name: 'Pays-Bas', flag: '🇳🇱', continent: 'Europe' },
  { name: 'Portugal', flag: '🇵🇹', continent: 'Europe' },
  { name: 'Belgique', flag: '🇧🇪', continent: 'Europe' },
  { name: 'Brésil', flag: '🇧🇷', continent: 'Amérique du Sud' },
  { name: 'Argentine', flag: '🇦🇷', continent: 'Amérique du Sud' },
  { name: 'Maroc', flag: '🇲🇦', continent: 'Afrique' },
  { name: 'Sénégal', flag: '🇸🇳', continent: 'Afrique' },
  { name: 'Japon', flag: '🇯🇵', continent: 'Asie' },
  { name: 'Corée du Sud', flag: '🇰🇷', continent: 'Asie' },
  { name: 'USA', flag: '🇺🇸', continent: 'Amérique du Nord' }
];

const ORIGINS = [
  { id: 'centre', name: 'Centre de Formation', desc: '+10% Mental/Tactique | Trait: Classique', modifiers: { mental: 10, tactique: 10 }, trait: 'Classique' },
  { id: 'amateur', name: 'Club Amateur', desc: '+10% Physique, -10% Tactique | Trait: Acharné', modifiers: { physique: 10, tactique: -10 }, trait: 'Acharné' },
  { id: 'futsal', name: 'Futsal', desc: '+10% Dribble/Technique, -15% Physique | Trait: Dribbleur Fin', modifiers: { technique: 10, physique: -15 }, trait: 'Dribbleur Fin' },
  { id: 'tardif', name: 'Débutant Tardif', desc: '-5 OVR base | Trait: Poulain Brut', modifiers: { ovrOffset: -5 }, trait: 'Poulain Brut' },
  { id: 'street', name: 'Street Football', desc: '+10% Dribble, -10% Discipline | Trait: Instinct 1v1', modifiers: { technique: 10, discipline: -10 }, trait: 'Instinct 1v1' },
  { id: 'athlete', name: 'Athlète Polyvalent', desc: '+15% Vitesse/Puissance, -10% Toucher | Trait: Moteur Hybride', modifiers: { physique: 15, technique: -10 }, trait: 'Moteur Hybride' }
];

let state = {
  step: 1,
  player: JSON.parse(localStorage.getItem('career_rpg_save')) || null,
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

function generatePlayer(formData) {
  let baseOvr = randInt(35, 50);
  if (formData.origin.id === 'tardif') baseOvr += formData.origin.modifiers.ovrOffset;

  let basePot = randInt(70, 99);
  if (basePot > 98) basePot = randInt(88, 95);

  const physicalBonus = Math.floor((formData.height / 10) + (formData.weight / 10));
  const technicalPenalty = Math.floor((formData.height / 20) + (formData.weight / 20));

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

  const hiddenStats = {
    regularite: randInt(1, 20),
    matchImportant: randInt(1, 20),
    blessure: randInt(1, 20)
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

// --- BLOC 3 : INTERFACE UTILISATEUR & RENDU ---

function setPos(p) { 
  state.form.position = p; 
  render(); 
}

function selectOrigin(id) {
  state.form.origin = ORIGINS.find(o => o.id === id);
  render();
}

function setNat(name) {
  state.form.nationality = NATIONALITIES.find(n => n.name === name);
  render();
}

function submitCreation() {
  state.form.firstName = document.getElementById('inp-fn').value || 'Brandon';
  state.form.lastName = document.getElementById('inp-ln').value || 'Le Moan';
  state.form.height = parseInt(document.getElementById('inp-h').value) || 180;
  state.form.weight = parseInt(document.getElementById('inp-w').value) || 75;

  state.player = generatePlayer(state.form);
  localStorage.setItem('career_rpg_save', JSON.stringify(state.player));
  render();
}

function resetCareer() {
  localStorage.removeItem('career_rpg_save');
  state.player = null;
  state.step = 1;
  render();
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (!state.player) {
    // Écran de création unique et complet
    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
        <h1 class="text-xl font-black text-center text-emerald-400 uppercase">Création du Joueur</h1>
        
        <!-- Nom & Prénom -->
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

        <!-- Nationalité -->
        <div>
          <label class="text-xs text-slate-400 font-bold">Nationalité</label>
          <select onchange="setNat(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white mt-1">
            ${NATIONALITIES.map(n => `<option value="${n.name}" ${state.form.nationality.name === n.name ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}
          </select>
        </div>

        <!-- Taille & Poids -->
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

        <!-- Poste -->
        <div>
          <label class="text-xs text-slate-400 font-bold uppercase">Poste</label>
          <div class="grid grid-cols-5 gap-1.5 mt-1">
            ${POSITIONS.map(p => `<button type="button" onclick="setPos('${p.id}')" class="p-2 rounded border text-xs font-bold ${state.form.position === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-300'}">${p.label}</button>`).join('')}
          </div>
        </div>

        <!-- Origines -->
        <div>
          <label class="text-xs text-slate-400 font-bold uppercase">Style d'Origine</label>
          <div class="space-y-1.5 mt-1 max-h-40 overflow-y-auto pr-1">
            ${ORIGINS.map(o => `
              <div onclick="selectOrigin('${o.id}')" class="p-2.5 rounded-xl border cursor-pointer text-xs ${state.form.origin.id === o.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400'}">
                <span class="font-bold text-white">${o.name}</span> — ${o.desc}
              </div>
            `).join('')}
          </div>
        </div>

        <button onclick="submitCreation()" class="w-full py-3 bg-emerald-500 font-black rounded-xl text-slate-950 uppercase text-sm tracking-wide mt-2">Valider et Lancer la Carrière 🚀</button>
      </div>
    `;
  } else {
    // Écran principal une fois le joueur créé (Dashboard temporaire)
    app.innerHTML = `
      <div class="max-w-xl mx-auto my-6 p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-white">
        <h2 class="text-lg font-black text-emerald-400">Joueur : ${state.player.firstName} ${state.player.lastName} ${state.player.nationality.flag}</h2>
        <div class="text-xs text-slate-300 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>Poste : <span class="font-bold text-white uppercase">${state.player.position}</span> | Origine : <span class="text-emerald-400">${state.player.origin.name}</span></div>
          <div>Général (OVR) : <span class="font-bold text-yellow-400">${state.player.ovr}</span> | Potentiel : <span class="font-bold text-emerald-400">${state.player.pot}</span></div>
          <div>Morphologie : ${state.player.height}cm / ${state.player.weight}kg</div>
          <div>Trait : ${state.player.traits[0]}</div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="font-bold text-slate-400 uppercase">Stats Principales</div>
            <div>Technique : ${state.player.stats.technique}</div>
            <div>Physique : ${state.player.stats.physique}</div>
            <div>Mental : ${state.player.stats.mental}</div>
            <div>Discipline : ${state.player.stats.discipline}</div>
          </div>
          <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div class="font-bold text-slate-400 uppercase">Stats Cachées (1-20)</div>
            <div>Régularité : ${state.player.hidden.regularite}</div>
            <div>Matchs Importants : ${state.player.hidden.matchImportant}</div>
            <div>Résistance Blessure : ${state.player.hidden.blessure}</div>
          </div>
        </div>
        <button onclick="resetCareer()" class="w-full py-2 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide">Refaire un joueur</button>
      </div>
    `;
  }
}

// Lancement automatique au chargement
render();

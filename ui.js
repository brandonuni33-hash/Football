// ui.js
import { StateManager } from './state.js';
import { PlayerLogic } from './player.js';
import { POSITIONS, ORIGINS, STARTING_CLUBS } from './constants.js';

export const UIRenderer = {
    init: () => {
        const app = document.getElementById('app');
        UIRenderer.render(app);
        
        // Rafraîchissement automatique de l'UI quand l'état change
        window.addEventListener('stateChanged', () => UIRenderer.render(app));
    },

    render: (container) => {
        const state = StateManager.get();
        container.innerHTML = ''; // Nettoyage propre
        
        if (!state.isCreated) {
            container.innerHTML = UIRenderer.templates.creationForm();
            UIRenderer.bindCreationEvents();
        } else {
            container.innerHTML = UIRenderer.templates.dashboard(state);
            UIRenderer.bindDashboardEvents();
        }
    },

    templates: {
        creationForm: () => `
            <div class="bg-gray-800 p-8 rounded-xl shadow-2xl fade-in border border-gray-700">
                <h1 class="text-3xl font-bold mb-6 text-blue-400">Création de Joueur</h1>
                <form id="creation-form" class="space-y-6">
                    
                    <!-- Étape 1 : Identité -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-700 pb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Prénom</label>
                            <input type="text" id="c_first" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Nom</label>
                            <input type="text" id="c_last" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" required>
                        </div>
                        <div class="md:col-span-2">
                            <button type="button" id="btn-random-name" class="text-sm text-blue-400 hover:text-blue-300">Générer un nom aléatoire</button>
                        </div>
                    </div>

                    <!-- Étape 2 : Morphologie -->
                    <div class="grid grid-cols-2 gap-6 border-b border-gray-700 pb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Taille (<span id="height-val">175</span> cm)</label>
                            <input type="range" id="c_height" min="160" max="210" value="175" class="w-full accent-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Poids (<span id="weight-val">70</span> kg)</label>
                            <input type="range" id="c_weight" min="55" max="110" value="70" class="w-full accent-blue-500">
                        </div>
                    </div>

                    <!-- Étape 3, 4, 5, 6 : Sélecteurs -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Poste</label>
                            <select id="c_position" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${POSITIONS.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Origine & Style</label>
                            <select id="c_origin" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${Object.values(ORIGINS).map(o => `<option value="${o.id}">${o.name} (Trait: ${o.trait})</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Club de cœur</label>
                            <input type="text" id="c_favClub" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Ex: Real Madrid">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-400 mb-1">Club de Départ</label>
                            <select id="c_startClub" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${STARTING_CLUBS.map(c => `<option value="${c.id}">${c.name} (${c.league})</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-6">
                        Lancer la Carrière
                    </button>
                </form>
            </div>
        `,
        dashboard: (state) => `
            <div class="fade-in">
                <header class="bg-gray-800 p-6 rounded-xl shadow-lg mb-6 border border-gray-700 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-white">${state.player.firstName} ${state.player.lastName}</h1>
                        <p class="text-blue-400 font-medium">${state.player.position} | ${state.career.age} ans | OVR: ${state.player.ovr}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Club Actuel</p>
                        <p class="font-bold text-lg text-white">${STARTING_CLUBS.find(c => c.id === state.player.currentClub)?.name || 'Agent Libre'}</p>
                    </div>
                </header>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 class="text-lg font-bold mb-4 text-gray-200 border-b border-gray-700 pb-2">Attributs</h2>
                        <ul class="space-y-2 text-sm">
                            <li class="flex justify-between"><span>Technique</span> <span>${state.player.stats.technique}</span></li>
                            <li class="flex justify-between"><span>Physique</span> <span>${state.player.stats.physique}</span></li>
                            <li class="flex justify-between"><span>Mental</span> <span>${state.player.stats.mental}</span></li>
                            <li class="flex justify-between"><span>Vitesse</span> <span>${state.player.stats.vitesse}</span></li>
                        </ul>
                    </div>

                    <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h2 class="text-lg font-bold mb-4 text-gray-200 border-b border-gray-700 pb-2">Mental & Vestiaire</h2>
                        <ul class="space-y-2 text-sm">
                            <li class="flex justify-between"><span>Confiance Coach</span> <span>${state.player.relations.coach}%</span></li>
                            <li class="flex justify-between"><span>Respect Vestiaire</span> <span>${state.player.relations.dressingRoom}%</span></li>
                            <li class="flex justify-between"><span>Arrogance</span> <span>${state.player.relations.arrogance}%</span></li>
                        </ul>
                    </div>

                    <div class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col justify-center items-center">
                        <p class="text-gray-400 mb-2">Semaine ${state.career.week} / Saison ${state.career.season}</p>
                        <button id="btn-advance" class="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Avancer la semaine
                        </button>
                    </div>
                </div>
            </div>
        `
    },

    bindCreationEvents: () => {
        // UI Sliders dynamiques
        document.getElementById('c_height')?.addEventListener('input', (e) => document.getElementById('height-val').innerText = e.target.value);
        document.getElementById('c_weight')?.addEventListener('input', (e) => document.getElementById('weight-val').innerText = e.target.value);
        
        // Bouton random
        document.getElementById('btn-random-name')?.addEventListener('click', () => {
            const fullName = PlayerLogic.generateRandomName().split(' ');
            document.getElementById('c_first').value = fullName[0];
            document.getElementById('c_last').value = fullName[1] || '';
        });

        // Soumission
        document.getElementById('creation-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = {
                firstName: document.getElementById('c_first').value,
                lastName: document.getElementById('c_last').value,
                height: parseInt(document.getElementById('c_height').value),
                weight: parseInt(document.getElementById('c_weight').value),
                position: document.getElementById('c_position').value,
                originId: document.getElementById('c_origin').value,
                favoriteClub: document.getElementById('c_favClub').value,
                startingClub: document.getElementById('c_startClub').value,
            };

            const newPlayer = PlayerLogic.createPlayerProfile(formData);
            
            StateManager.update({
                isCreated: true,
                player: newPlayer
            });
        });
    },

    bindDashboardEvents: () => {
        document.getElementById('btn-advance')?.addEventListener('click', () => {
            const state = StateManager.get();
            let newWeek = state.career.week + 1;
            let newAge = state.career.age;
            let newSeason = state.career.season;

            if (newWeek > 52) {
                newWeek = 1;
                newAge += 1;
                newSeason += 1;
            }

            StateManager.update({
                career: {
                    ...state.career,
                    week: newWeek,
                    age: newAge,
                    season: newSeason
                }
            });
            
            // Ici on pourrait déclencher l'EventEngine pour afficher une modale narrative
        });
    }
};

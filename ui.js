// ui.js
import { StateManager } from './state.js';
import { PlayerLogic } from './player.js';
import { POSITIONS, CONTINENTS, ORIGINS } from './constants.js';

export const UIRenderer = {
    init: () => {
        const app = document.getElementById('app');
        UIRenderer.render(app);
        window.addEventListener('stateChanged', () => UIRenderer.render(app));
    },

    render: (container) => {
        const currentState = StateManager.get();
        container.innerHTML = '';
        if (!currentState.isCreated) {
            container.innerHTML = UIRenderer.templates.creationForm();
            UIRenderer.bindCreationEvents();
        } else {
            container.innerHTML = UIRenderer.templates.dashboard(currentState);
            UIRenderer.bindDashboardEvents();
        }
    },

    generateNationalityOptions: () => {
        let html = '';
        for (const [continent, countries] of Object.entries(CONTINENTS)) {
            html += `<optgroup label="${continent}">`;
            countries.forEach(c => {
                html += `<option value="${c.id}">${c.flag} ${c.name}</option>`;
            });
            html += `</optgroup>`;
        }
        return html;
    },

    templates: {
        creationForm: () => `
            <div class="bg-gray-800 p-8 rounded-xl shadow-2xl fade-in border border-gray-700">
                <h1 class="text-3xl font-bold mb-6 text-blue-400">Création du Joueur</h1>
                <form id="creation-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-700 pb-4">
                        <div><label class="block text-sm text-gray-400 mb-1">Prénom</label><input type="text" id="c_first" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" required></div>
                        <div><label class="block text-sm text-gray-400 mb-1">Nom</label><input type="text" id="c_last" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" required></div>
                        <div class="md:col-span-2"><button type="button" id="btn-random-name" class="text-sm text-blue-400 hover:text-blue-300">Générer un nom aléatoire</button></div>
                        <div class="md:col-span-2">
                            <label class="block text-sm text-gray-400 mb-1">Nationalité</label>
                            <select id="c_nat" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${UIRenderer.generateNationalityOptions()}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Poste de Prédilection</label>
                            <select id="c_pos" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${POSITIONS.map(p => `<option value="${p.id}">${p.id} - ${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Origine du Joueur</label>
                            <select id="c_ori" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${Object.values(ORIGINS).map(o => `<option value="${o.id}">${o.name} (Trait: ${o.trait})</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-lg mt-6 shadow-lg">Générer les Statistiques</button>
                </form>
            </div>
        `,
        dashboard: (s) => `
            <div class="fade-in space-y-6">
                <header class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl border-2 border-blue-500 font-bold">${s.player.position}</div>
                        <div>
                            <h1 class="text-2xl font-bold text-white">${s.player.firstName} ${s.player.lastName}</h1>
                            <p class="text-blue-400 font-medium">${ORIGINS[s.player.origin].name} | ${s.career.age} ans</p>
                        </div>
                    </div>
                    <div class="mt-4 md:mt-0 text-center md:text-right">
                        <p class="text-sm text-gray-400">Général (OVR) / Potentiel</p>
                        <p class="font-bold text-3xl text-white"><span class="text-green-400">${s.player.ovr}</span> <span class="text-gray-500 text-xl">/ ${s.player.pot}</span></p>
                    </div>
                </header>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 class="text-lg font-bold mb-4 text-blue-300 border-b border-gray-700 pb-2">Attributs Purs</h2>
                        <ul class="space-y-3 text-sm font-mono">
                            <li class="flex justify-between items-center"><span>Technique</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.technique}</span></li>
                            <li class="flex justify-between items-center"><span>Physique</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.physique}</span></li>
                            <li class="flex justify-between items-center"><span>Mental</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.mental}</span></li>
                        </ul>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 class="text-lg font-bold mb-4 text-purple-300 border-b border-gray-700 pb-2">Carrière & Social</h2>
                        <ul class="space-y-3 text-sm font-mono">
                            <li class="flex justify-between items-center"><span>Charisme</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.charisme}</span></li>
                            <li class="flex justify-between items-center"><span>Réputation</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.reputation}</span></li>
                            <li class="flex justify-between items-center"><span>Discipline</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.discipline}</span></li>
                        </ul>
                    </div>
                    <div class="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 class="text-lg font-bold mb-4 text-yellow-300 border-b border-gray-700 pb-2">Relations</h2>
                        <ul class="space-y-3 text-sm font-mono">
                            <li class="flex justify-between items-center"><span>Relation Coach</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.relationCoach}</span></li>
                            <li class="flex justify-between items-center"><span>Vestiaire</span> <span class="bg-gray-700 px-2 py-1 rounded">${s.player.stats.vestiaire}</span></li>
                        </ul>
                        <div class="mt-4 p-3 bg-gray-900 rounded border border-gray-600 text-xs text-gray-400">
                            <p class="font-bold text-gray-200 mb-1">Trait Unique :</p>
                            <p>${s.player.trait}</p>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-8">
                     <button id="btn-reset" class="text-sm text-red-500 hover:text-red-400 underline">Effacer la sauvegarde et recommencer</button>
                </div>
            </div>
        `
    },

    bindCreationEvents: () => {
        document.getElementById('btn-random-name')?.addEventListener('click', () => {
            const name = PlayerLogic.generateRandomName().split(' ');
            document.getElementById('c_first').value = name[0];
            document.getElementById('c_last').value = name[1];
        });
        document.getElementById('creation-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPlayer = PlayerLogic.createPlayerProfile({
                firstName: document.getElementById('c_first').value,
                lastName: document.getElementById('c_last').value,
                nationality: document.getElementById('c_nat').value,
                position: document.getElementById('c_pos').value,
                originId: document.getElementById('c_ori').value
            });
            StateManager.update({ isCreated: true, player: newPlayer });
        });
    },

    bindDashboardEvents: () => {
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            localStorage.removeItem('fc_career_save_v2.0');
            location.reload();
        });
    }
};

// ui.js
import { StateManager } from './state.js';
import { PlayerLogic } from './player.js';
import { POSITIONS, CONTINENTS, ORIGINS, HEART_CLUBS } from './constants.js';

let currentStep = 1;
let formDataTemp = {
    firstName: '',
    lastName: '',
    nationality: 'FR',
    position: 'BU',
    height: 180,
    weight: 75,
    originId: 'CENTRE_FORMATION',
    heartClub: 'ARS'
};

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
            container.innerHTML = UIRenderer.templates.wizardForm();
            UIRenderer.bindWizardEvents();
        } else {
            container.innerHTML = UIRenderer.templates.dashboard(currentState);
            UIRenderer.bindDashboardEvents();
        }
    },

    generateNationalityOptions: (selected) => {
        let html = '';
        for (const [continent, countries] of Object.entries(CONTINENTS)) {
            html += `<optgroup label="${continent}">`;
            countries.forEach(c => {
                const isSel = c.id === selected ? 'selected' : '';
                html += `<option value="${c.id}" ${isSel}>${c.flag} ${c.name}</option>`;
            });
            html += `</optgroup>`;
        }
        return html;
    },

    generateHeartClubOptions: (selected) => {
        let html = '';
        for (const [league, clubs] of Object.entries(HEART_CLUBS)) {
            html += `<optgroup label="${league}">`;
            clubs.forEach(c => {
                const isSel = c.id === selected ? 'selected' : '';
                html += `<option value="${c.id}" ${isSel}>${c.name}</option>`;
            });
            html += `</optgroup>`;
        }
        return html;
    },

    templates: {
        wizardForm: () => `
            <div class="bg-gray-800 p-8 rounded-xl shadow-2xl fade-in border border-gray-700 max-w-2xl mx-auto">
                <div class="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                    <h1 class="text-2xl font-bold text-blue-400">Création du Joueur</h1>
                    <span class="text-sm text-gray-400 font-mono">Étape ${currentStep} / 4</span>
                </div>

                <div id="wizard-step-content">
                    ${UIRenderer.getStepContent()}
                </div>

                <div class="flex justify-between mt-8 pt-4 border-t border-gray-700">
                    ${currentStep > 1 ? '<button type="button" id="btn-prev" class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Précédent</button>' : '<div></div>'}
                    ${currentStep < 4 ? '<button type="button" id="btn-next" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold">Suivant</button>' : '<button type="button" id="btn-submit" class="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold">Générer le Joueur</button>'}
                </div>
            </div>
        `
    },

    getStepContent: () => {
        switch(currentStep) {
            case 1:
                return `
                    <div class="space-y-4 fade-in">
                        <h2 class="text-lg font-semibold text-gray-200 mb-2">1. Identité & Nationalité</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="block text-sm text-gray-400 mb-1">Prénom</label><input type="text" id="w_first" value="${formDataTemp.firstName}" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"></div>
                            <div><label class="block text-sm text-gray-400 mb-1">Nom</label><input type="text" id="w_last" value="${formDataTemp.lastName}" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"></div>
                        </div>
                        <div><button type="button" id="btn-random-name" class="text-sm text-blue-400 hover:text-blue-300">Générer un nom aléatoire</button></div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Nationalité</label>
                            <select id="w_nat" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${UIRenderer.generateNationalityOptions(formDataTemp.nationality)}
                            </select>
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <div class="space-y-4 fade-in">
                        <h2 class="text-lg font-semibold text-gray-200 mb-2">2. Poste & Morphologie</h2>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Poste de Prédilection</label>
                            <select id="w_pos" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${POSITIONS.map(p => `<option value="${p.id}" ${formDataTemp.position === p.id ? 'selected' : ''}>${p.id} - ${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label class="block text-sm text-gray-400 mb-1">Taille (cm)</label><input type="number" id="w_height" value="${formDataTemp.height}" min="155" max="215" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"></div>
                            <div><label class="block text-sm text-gray-400 mb-1">Poids (kg)</label><input type="number" id="w_weight" value="${formDataTemp.weight}" min="50" max="110" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"></div>
                        </div>
                        <p class="text-xs text-gray-400">💡 La taille et le poids influencent subtilement vos attributs physiques et techniques de départ.</p>
                    </div>
                `;
            case 3:
                return `
                    <div class="space-y-4 fade-in">
                        <h2 class="text-lg font-semibold text-gray-200 mb-2">3. Origine du Joueur</h2>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Sélectionnez votre parcours</label>
                            <select id="w_ori" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mb-3">
                                ${Object.values(ORIGINS).map(o => `<option value="${o.id}" ${formDataTemp.originId === o.id ? 'selected' : ''}>${o.name} (Trait: ${o.trait})</option>`).join('')}
                            </select>
                        </div>
                        <div id="origin-description" class="p-4 bg-gray-900 rounded-lg border border-gray-700 text-sm text-gray-300">
                            ${ORIGINS[formDataTemp.originId].desc}
                        </div>
                    </div>
                `;
            case 4:
                return `
                    <div class="space-y-4 fade-in">
                        <h2 class="text-lg font-semibold text-gray-200 mb-2">4. Club de Cœur</h2>
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Équipe favorite parmi les 5 grands championnats</label>
                            <select id="w_heart" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white">
                                ${UIRenderer.generateHeartClubOptions(formDataTemp.heartClub)}
                            </select>
                        </div>
                        <p class="text-xs text-gray-400">💡 Signer dans ce club ou l'affronter déclenchera des bonus contextuels uniques au cours de votre carrière.</p>
                    </div>
                `;
            default:
                return '';
        }
    },

    saveCurrentStepData: () => {
        if (currentStep === 1) {
            formDataTemp.firstName = document.getElementById('w_first')?.value || formDataTemp.firstName;
            formDataTemp.lastName = document.getElementById('w_last')?.value || formDataTemp.lastName;
            formDataTemp.nationality = document.getElementById('w_nat')?.value || formDataTemp.nationality;
        } else if (currentStep === 2) {
            formDataTemp.position = document.getElementById('w_pos')?.value || formDataTemp.position;
            formDataTemp.height = document.getElementById('w_height')?.value || formDataTemp.height;
            formDataTemp.weight = document.getElementById('w_weight')?.value || formDataTemp.weight;
        } else if (currentStep === 3) {
            formDataTemp.originId = document.getElementById('w_ori')?.value || formDataTemp.originId;
        } else if (currentStep === 4) {
            formDataTemp.heartClub = document.getElementById('w_heart')?.value || formDataTemp.heartClub;
        }
    },

    bindWizardEvents: () => {
        document.getElementById('btn-random-name')?.addEventListener('click', () => {
            const name = PlayerLogic.generateRandomName().split(' ');
            document.getElementById('w_first').value = name[0];
            document.getElementById('w_last').value = name[1];
            formDataTemp.firstName = name[0];
            formDataTemp.lastName = name[1];
        });

        document.getElementById('w_ori')?.addEventListener('change', (e) => {
            formDataTemp.originId = e.target.value;
            const descBox = document.getElementById('origin-description');
            if (descBox) descBox.innerHTML = ORIGINS[formDataTemp.originId].desc;
        });

        document.getElementById('btn-next')?.addEventListener('click', () => {
            UIRenderer.saveCurrentStepData();
            if (currentStep < 4) {
                currentStep++;
                const app = document.getElementById('app');
                app.innerHTML = UIRenderer.templates.wizardForm();
                UIRenderer.bindWizardEvents();
            }
        });

        document.getElementById('btn-prev')?.addEventListener('click', () => {
            UIRenderer.saveCurrentStepData();
            if (currentStep > 1) {
                currentStep--;
                const app = document.getElementById('app');
                app.innerHTML = UIRenderer.templates.wizardForm();
                UIRenderer.bindWizardEvents();
            }
        });

        document.getElementById('btn-submit')?.addEventListener('click', () => {
            UIRenderer.saveCurrentStepData();
            const newPlayer = PlayerLogic.createPlayerProfile(formDataTemp);
            StateManager.update({ isCreated: true, player: newPlayer });
        });
    },

    templates_dashboard: null, // (Garde ton template dashboard actuel tel quel)
    
    // Le reste du code dashboard...
    templates: {
        wizardForm: () => `...`,
        dashboard: (s) => `
            <div class="fade-in space-y-6">
                <header class="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl border-2 border-blue-500 font-bold">${s.player.position}</div>
                        <div>
                            <h1 class="text-2xl font-bold text-white">${s.player.firstName} ${s.player.lastName}</h1>
                            <p class="text-blue-400 font-medium">${ORIGINS[s.player.origin].name} | ${s.player.height} cm, ${s.player.weight} kg</p>
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
                        <h2 class="text-lg font-bold mb-4 text-yellow-300 border-b border-gray-700 pb-2">Traits & Club</h2>
                        <div class="space-y-3 text-xs text-gray-300">
                            <p><strong class="text-gray-100">Trait Unique :</strong><br>${s.player.trait}</p>
                            <p><strong class="text-gray-100">Club de Cœur :</strong><br>${s.player.heartClub}</p>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-8">
                     <button id="btn-reset" class="text-sm text-red-500 hover:text-red-400 underline">Effacer la sauvegarde et recommencer</button>
                </div>
            </div>
        `
    },

    bindDashboardEvents: () => {
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            localStorage.removeItem('fc_career_save_v2.0');
            location.reload();
        });
    }
};

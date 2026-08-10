// ui.js
import { CompetitionSystem } from './competitionSystem.js';
import { POSITIONS as _POSITIONS, CONTINENTS as _CONTINENTS, ORIGINS as _ORIGINS, HEART_CLUBS as _HEART_CLUBS, YOUTH_CLUBS_POOL as _YOUTH_CLUBS_POOL, COACH_VISIONS as _COACH_VISIONS, COACH_NAMES as _COACH_NAMES } from './constants.js';
import { EventEngine as _EventEngine } from './events.js';
import { TrainingManager as _TrainingManager } from './entrainement.js';
import { MatchChoiceManager as _MatchChoiceManager } from './matchChoices.js';
import { TransferMarket as _TransferMarket } from './transferMarket.js';
import { CoachSystem as _CoachSystem } from './coachSystem.js';
import { ConsequenceSystem as _ConsequenceSystem } from './consequenceSystem.js';
import { CareerSystem as _CareerSystem } from './careerSystem.js';
import { WorldSystem } from './worldSystem.js';

// Sécurisation des données importées
const POSITIONS = Array.isArray(_POSITIONS) ? _POSITIONS : Object.values(_POSITIONS || {});
const CONTINENTS = _CONTINENTS || {};
const ORIGINS = _ORIGINS || {};
const HEART_CLUBS = _HEART_CLUBS || {};
const YOUTH_CLUBS_POOL = Array.isArray(_YOUTH_CLUBS_POOL) ? _YOUTH_CLUBS_POOL : Object.values(_YOUTH_CLUBS_POOL || {});
const COACH_VISIONS = _COACH_VISIONS || [{ title: 'Équilibré' }];
const COACH_NAMES = _COACH_NAMES || ['Thomas Tuchel', 'Pep Guardiola'];

const EventEngine = _EventEngine || { checkAndTriggerEvent: () => null };
const TrainingManager = _TrainingManager || { FOCUS_TYPES: { TECHNIQUE: { name: 'Technique', description: 'Améliore la maîtrise globale du ballon' } } };
const MatchChoiceManager = _MatchChoiceManager || {
    shouldTriggerDilemma: () => true,
    getMatchDilemma: (type = 'standard', opponent = '') => ({
        title: 'Match sous Haute Tension',
        description: `Face à ${opponent || "l'adversaire"}, chaque décision comptera.`,
        choices: [
            { texte: '🛡️ Analyse & Rigueur', impacts: {} },
            { texte: '⚡ Offensive Totale', impacts: {} }
        ]
    })
};
const TransferMarket = _TransferMarket || {
    calculateMarketValue: () => 100000,
    formatPrice: (p) => `${(p || 0).toLocaleString('fr-FR')} €`,
    generateTransferOffer: () => null
};
const ConsequenceSystem = _ConsequenceSystem || { preview: () => ({ effects: [] }) };
const CareerSystem = _CareerSystem || { getStage: age => age < 16 ? 'academy' : age < 18 ? 'semi_pro' : 'professional', positionName: id => id };
const CoachSystem = _CoachSystem || {
    getCoachData: () => null,
    checkCoachInteraction: () => null,
    resolveCoachChoice: () => null
};

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentStep = 1;
        this.activeApp = 'home';
        this.selectedData = {
            firstname: '',
            lastname: '',
            position: null,
            continent: null,
            country: null,
            origin: null,
            heartClub: null,
            youthClub: null,
            coachVision: null,
            coachName: null
        };
        this.randomYouthClubs = [];
        this.injectStyles();
        this.initDOM();
    }

    init() {
        this.render();
    }

    injectStyles() {
        if (document.getElementById('pro-ui-styles')) return;
        const style = document.createElement('style');
        style.id = 'pro-ui-styles';
        style.innerHTML = `
            :root {
                --bg-glass: rgba(15, 23, 42, 0.85);
                --bg-card: rgba(30, 41, 59, 0.9);
                --border-glass: rgba(255, 255, 255, 0.25);
                --accent-green: #10b981;
                --accent-blue: #3b82f6;
                --accent-purple: #8b5cf6;
                --accent-gold: #f59e0b;
                --text-main: #ffffff;
                --text-sub: #e2e8f0;
            }

            .phone-frame {
                width: 100%;
                max-width: 430px;
                height: 100dvh;
                max-height: 900px;
                margin: 0 auto;
                border-radius: 36px;
                background: rgba(10, 15, 30, 0.5);
                border: 1.5px solid var(--border-glass);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
                position: relative;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: var(--text-main);
                backdrop-filter: blur(12px);
            }

            .phone-status-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: calc(env(safe-area-inset-top, 12px) + 6px) 20px 8px;
                font-size: 0.8rem;
                font-weight: 700;
                color: #ffffff;
                background: rgba(15, 23, 42, 0.75);
                backdrop-filter: blur(16px);
                z-index: 10;
            }

            .phone-home-screen, .app-content-body {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                padding-bottom: calc(20px + env(safe-area-inset-bottom, 10px));
                display: flex;
                flex-direction: column;
                gap: 16px;
                scrollbar-width: thin;
            }

            /* Widget Hero Joueur */
            .player-widget-enhanced {
                background: rgba(15, 23, 42, 0.88);
                border: 1px solid var(--border-glass);
                border-radius: 24px;
                padding: 18px;
                backdrop-filter: blur(20px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }

            .widget-header-line {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.8rem;
                color: var(--accent-blue);
                font-weight: 800;
                margin-bottom: 12px;
            }

            .player-card-banner {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 14px;
            }

            .player-image-badge {
                width: 56px;
                height: 56px;
                border-radius: 18px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
            }

            .jersey-number {
                font-size: 1.4rem;
                font-weight: 900;
                color: #fff;
            }

            .player-main-info .widget-title {
                font-weight: 800;
                font-size: 1.25rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .player-club-sub {
                font-size: 0.88rem;
                color: var(--text-sub);
                margin-top: 2px;
            }

            .widget-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .stat-pill {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 8px 12px;
                font-size: 0.85rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .stat-pill strong {
                font-size: 0.95rem;
                color: #fff;
            }

            .widget-secret-tag {
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px dashed rgba(255, 255, 255, 0.2);
                font-size: 0.8rem;
                color: #fbbf24;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            /* Grille d'Applications iOS Ultra Visibles */
            .apps-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 14px;
                margin-top: 6px;
            }

            .app-icon {
                display: flex;
                flex-direction: column;
                align-items: center;
                background: transparent;
                border: none;
                cursor: pointer;
                position: relative;
                transition: transform 0.15s ease, filter 0.15s ease;
            }

            .app-icon:active {
                transform: scale(0.92);
            }

            .app-logo {
                width: 62px;
                height: 62px;
                border-radius: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.7rem;
                background: #1e293b;
                border: 1.5px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
                margin-bottom: 6px;
            }

            .app-label {
                font-size: 0.75rem;
                font-weight: 700;
                color: #ffffff;
                text-align: center;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
            }

            .notification-badge {
                position: absolute;
                top: -2px;
                right: 4px;
                background: #ef4444;
                color: white;
                font-size: 0.7rem;
                font-weight: 900;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #0f172a;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }

            /* Bouton Paramètres Flottant */
            .btn-settings-floating {
                position: absolute;
                right: 20px;
                bottom: calc(90px + env(safe-area-inset-bottom, 0px));
                width: 46px;
                height: 46px;
                border-radius: 50%;
                background: #1e293b;
                border: 1.5px solid var(--border-glass);
                color: #fff;
                font-size: 1.3rem;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
                z-index: 5;
            }

            /* Actions Principales */
            .btn-play-block {
                width: 100%;
                padding: 16px;
                border-radius: 20px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: #fff;
                font-weight: 800;
                font-size: 1rem;
                border: none;
                cursor: pointer;
                box-shadow: 0 10px 25px -4px rgba(16, 185, 129, 0.6);
            }

            .btn-play-block:active {
                transform: scale(0.98);
            }

            /* Style des Vues Applicatives */
            .app-pane {
                background: rgba(15, 23, 42, 0.9);
                border: 1px solid var(--border-glass);
                border-radius: 20px;
                padding: 16px;
                backdrop-filter: blur(16px);
            }

            .pane-title {
                font-size: 1.15rem;
                font-weight: 800;
                margin-top: 0;
                margin-bottom: 12px;
                color: #fff;
            }

            /* Modales */
            .event-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(2, 6, 23, 0.88);
                backdrop-filter: blur(20px);
                z-index: 100;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .event-modal-card {
                background: #1e293b;
                border: 1.5px solid var(--border-glass);
                border-radius: 26px;
                padding: 22px;
                width: 100%;
                max-width: 360px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.8);
            }

            .event-modal-category {
                font-size: 0.72rem;
                font-weight: 800;
                letter-spacing: 1px;
                color: var(--accent-gold);
                text-transform: uppercase;
            }

            .event-modal-title {
                font-size: 1.25rem;
                font-weight: 800;
                margin: 6px 0 10px;
                color: #fff;
            }

            .event-modal-desc {
                font-size: 0.9rem;
                color: var(--text-sub);
                line-height: 1.4;
                margin-bottom: 18px;
            }

            .btn-event-choice {
                width: 100%;
                padding: 14px;
                border-radius: 14px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid var(--border-glass);
                color: var(--text-main);
                font-weight: 700;
                font-size: 0.9rem;
                margin-bottom: 10px;
                cursor: pointer;
                text-align: left;
            }

            .btn-event-choice:active {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        let app = document.getElementById('app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'app';
            if (document.body) {
                document.body.appendChild(app);
            }
        }
        window.UI = this;
        return app;
    }

    render() {
        try {
            const app = this.initDOM();

            if (this.engine?.state) {
                this.renderDashboard();
                return;
            }

            app.innerHTML = `
                <div class="career-container">
                    <header class="career-header">
                        <h1>⚡ Street to Pro</h1>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(this.currentStep / 5) * 100}%"></div>
                        </div>
                    </header>
                    <main class="career-content">
                        ${this.renderStepContent()}
                    </main>
                    <footer class="career-footer">
                        ${this.currentStep > 1 ? '<button id="prev-btn" class="btn-secondary">Précédent</button>' : ''}
                        ${this.currentStep < 5 ? '<button id="next-btn" class="btn-primary" disabled>Suivant</button>' : '<button id="start-btn" class="btn-success" disabled>Lancer</button>'}
                    </footer>
                </div>
            `;
            this.bindStepEvents();
        } catch (error) {
            console.error("💥 Erreur lors du rendu UI :", error);
        }
    }

    renderStepContent() {
        switch(this.currentStep) {
            case 1: {
                return `
                    <h2>Étape 1 : Identité & Poste</h2>
                    <div class="form-group">
                        <label for="firstname">Prénom :</label>
                        <input type="text" id="firstname" value="${this.selectedData.firstname || ''}" placeholder="ex: Kylian">
                    </div>
                    <div class="form-group">
                        <label for="lastname">Nom :</label>
                        <input type="text" id="lastname" value="${this.selectedData.lastname || ''}" placeholder="ex: Mbappé">
                    </div>
                    <div class="form-group">
                        <label>Choisis ton poste sur le terrain :</label>
                        <div class="proclubs-pitch-container">
                            <div class="proclubs-soccer-pitch">
                                ${POSITIONS.map(p => {
                                    let coords = { top: '50%', left: '50%' };
                                    const id = p?.id;
                                    if (id === 'GK') coords = { top: '86%', left: '50%' };
                                    else if (['DC', 'CB'].includes(id)) coords = { top: '70%', left: '50%' };
                                    else if (['DD', 'RB'].includes(id)) coords = { top: '65%', left: '85%' };
                                    else if (['DG', 'LB'].includes(id)) coords = { top: '65%', left: '15%' };
                                    else if (['MDC', 'CDM'].includes(id)) coords = { top: '50%', left: '50%' };
                                    else if (['MC', 'CM'].includes(id)) coords = { top: '40%', left: '50%' };
                                    else if (['MO', 'CAM'].includes(id)) coords = { top: '28%', left: '50%' };
                                    else if (['AD', 'RW'].includes(id)) coords = { top: '22%', left: '80%' };
                                    else if (['AG', 'LW'].includes(id)) coords = { top: '22%', left: '20%' };
                                    else if (['BU', 'ST'].includes(id)) coords = { top: '12%', left: '50%' };

                                    const isSelected = this.selectedData.position === id ? 'selected' : '';

                                    return `
                                        <button class="proclubs-node ${isSelected}" data-pos="${id}" style="top: ${coords.top}; left: ${coords.left};" title="${p?.name || id}">
                                            <div class="proclubs-jersey">👕</div>
                                            <span class="proclubs-pos-name">${id}</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }
            case 2: {
                const selectedOriginObj = Object.values(ORIGINS).find(o => o?.id === this.selectedData.origin);
                
                return `
                    <h2>Étape 2 : Origine</h2>
                    <p class="subtitle">Comment avez-vous façonné votre jeu ?</p>
                    <div class="grid-origins-compact">
                        ${Object.values(ORIGINS).map(o => {
                            if (!o) return '';
                            let emoji = '⚡';
                            const traitLower = o.trait ? o.trait.toLowerCase() : '';
                            if (traitLower.includes('technique') || traitLower.includes('dribble')) emoji = '✨';
                            else if (traitLower.includes('physique') || traitLower.includes('force')) emoji = '💪';
                            else if (traitLower.includes('mental') || traitLower.includes('leader')) emoji = '🧠';
                            else if (traitLower.includes('vitesse') || traitLower.includes('rapide')) emoji = '🏃‍♂️';

                            return `
                                <div class="origin-card-compact ${this.selectedData.origin === o.id ? 'selected' : ''}" data-origin="${o.id}">
                                    <div class="origin-icon-small">${emoji}</div>
                                    <div class="origin-info-small">
                                        <h3>${o.name || ''}</h3>
                                        <span class="trait-tag">${o.trait || ''}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="origin-description-box">
                        ${selectedOriginObj ? `<p>📖 ${selectedOriginObj.desc || ''}</p>` : `<p class="placeholder-text">👉 Clique sur une origine pour découvrir son histoire.</p>`}
                    </div>
                `;
            }
            case 3: {
                const paysList = this.selectedData.continent && CONTINENTS[this.selectedData.continent]
                    ? (Array.isArray(CONTINENTS[this.selectedData.continent]) ? CONTINENTS[this.selectedData.continent] : Object.values(CONTINENTS[this.selectedData.continent]))
                    : [];

                return `
                    <h2>Étape 3 : Région & Pays</h2>
                    <div class="grid-continents">
                        ${Object.keys(CONTINENTS).map(continent => `
                            <button class="chip-continent ${this.selectedData.continent === continent ? 'selected' : ''}" data-continent="${continent}">${continent}</button>
                        `).join('')}
                    </div>
                    ${this.selectedData.continent && paysList.length > 0 ? `
                        <h3>Pays :</h3>
                        <div class="grid-countries">
                            ${paysList.map(c => `
                                <button class="chip-country ${this.selectedData.country === c?.name ? 'selected' : ''}" data-country="${c?.name || ''}">${c?.flag || ''} ${c?.name || ''}</button>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
            }
            case 4: {
                return `
                    <h2>Étape 4 : Club de Cœur</h2>
                    <div class="form-group">
                        <label for="heart-club-select">Club de cœur :</label>
                        <select id="heart-club-select">
                            <option value="">-- Choisir un club --</option>
                            ${Object.entries(HEART_CLUBS).map(([league, clubs]) => {
                                const clubArray = Array.isArray(clubs) ? clubs : Object.values(clubs || {});
                                return `
                                    <optgroup label="${league}">
                                        ${clubArray.map(c => `<option value="${c?.name || ''}" ${this.selectedData.heartClub === c?.name ? 'selected' : ''}>${c?.name || ''}</option>`).join('')}
                                    </optgroup>
                                `;
                            }).join('')}
                        </select>
                    </div>
                `;
            }
            case 5: {
                if (this.randomYouthClubs.length === 0 && YOUTH_CLUBS_POOL.length > 0) {
                    const shuffled = [...YOUTH_CLUBS_POOL].sort(() => 0.5 - Math.random());
                    const count = Math.floor(Math.random() * 3) + 4;
                    
                    this.randomYouthClubs = shuffled.slice(0, count).map(yc => {
                        const randomVision = COACH_VISIONS[Math.floor(Math.random() * COACH_VISIONS.length)];
                        const randomCoachName = COACH_NAMES[Math.floor(Math.random() * COACH_NAMES.length)];
                        const salary = Math.round(100 + (Math.random() * 200));
                        const playtimeOptions = ["Temps de jeu limité", "Joueur de rotation", "Espoir / Prêt potentiel", "Titulaire en jeunes"];
                        const playtime = playtimeOptions[Math.floor(Math.random() * playtimeOptions.length)];
                        const targetRating = Math.min(75, 55 + Math.round((yc?.prestige || 50) / 4));

                        return {
                            ...yc,
                            coachName: randomCoachName,
                            coachVision: randomVision?.title || 'Équilibré',
                            salary,
                            playtime,
                            targetRating
                        };
                    });
                }

                return `
                    <h2>Étape 5 : Offres de Contrat Jeune</h2>
                    <p class="subtitle">Analysez les propositions et choisissez votre point de chute :</p>
                    <div class="grid-youth-clubs">
                        ${this.randomYouthClubs.map(yc => `
                            <div class="card-select club-card ${this.selectedData.youthClub?.name === yc?.name ? 'selected' : ''}" data-club-name="${yc?.name || ''}">
                                <div class="club-header-info">
                                    <h3>${yc?.name || ''}</h3>
                                    <span class="league-tag">🏆 ${yc?.league || ''} (${yc?.country || ''})</span>
                                </div>
                                <div class="contract-details">
                                    <p><strong>👨‍💼 Entraîneur :</strong> ${yc?.coachName || ''} <em>(${yc?.coachVision || ''})</em></p>
                                    <p><strong>💶 Salaire :</strong> ${yc?.salary || 0} € / semaine</p>
                                    <p><strong>⏱️ Temps de jeu :</strong> ${yc?.playtime || ''}</p>
                                    <p><strong>🎯 Objectif :</strong> Atteindre ${yc?.targetRating || 60} Général</p>
                                </div>
                                <div class="prestige-badge">Prestige : ${yc?.prestige || 0}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            default:
                return `<p>Chargement...</p>`;
        }
    }

    bindStepEvents() {
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const startBtn = document.getElementById('start-btn');

        if (nextBtn) nextBtn.disabled = !this.isStepValid();
        if (startBtn) startBtn.disabled = !this.isStepValid();

        const firstnameInput = document.getElementById('firstname');
        const lastnameInput = document.getElementById('lastname');
        
        if (firstnameInput) {
            firstnameInput.addEventListener('input', (e) => {
                this.selectedData.firstname = e.target.value.trim();
                if (nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }
        if (lastnameInput) {
            lastnameInput.addEventListener('input', (e) => {
                this.selectedData.lastname = e.target.value.trim();
                if (nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }

        document.querySelectorAll('.proclubs-node').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.proclubs-node').forEach(b => b.classList.remove('selected'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('selected');
                this.selectedData.position = targetBtn.getAttribute('data-pos');
                if (nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        document.querySelectorAll('.origin-card-compact').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedData.origin = card.getAttribute('data-origin');
                this.render();
            });
        });

        document.querySelectorAll('.chip-continent').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedData.continent = e.target.getAttribute('data-continent');
                this.selectedData.country = null;
                this.render();
            });
        });

        document.querySelectorAll('.chip-country').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chip-country').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedData.country = e.target.getAttribute('data-country');
                if (nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        const heartSelect = document.getElementById('heart-club-select');
        if (heartSelect) {
            heartSelect.addEventListener('change', (e) => {
                this.selectedData.heartClub = e.target.value;
                if (nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }

        document.querySelectorAll('.grid-youth-clubs .card-select').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.grid-youth-clubs .card-select').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const clubName = card.getAttribute('data-club-name');
                
                const chosenOffer = this.randomYouthClubs.find(yc => yc?.name === clubName);
                if (chosenOffer) {
                    this.selectedData.youthClub = chosenOffer;
                    this.selectedData.coachVision = chosenOffer.coachVision;
                    this.selectedData.coachName = chosenOffer.coachName;
                }

                if (startBtn) startBtn.disabled = !this.isStepValid();
            });
        });

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentStep < 5) {
                    this.currentStep++;
                    this.render();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentStep > 1) {
                    this.currentStep--;
                    this.render();
                }
            });
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (typeof this.engine?.startCareer === 'function') {
                    this.engine.startCareer(this.selectedData);
                    this.renderDashboard();
                }
            });
        }
    }

    isStepValid() {
        switch(this.currentStep) {
            case 1:
                return (this.selectedData.firstname?.length || 0) > 0 && 
                       (this.selectedData.lastname?.length || 0) > 0 && 
                       this.selectedData.position !== null;
            case 2:
                return this.selectedData.origin !== null;
            case 3:
                return this.selectedData.continent !== null && this.selectedData.country !== null;
            case 4:
                return this.selectedData.heartClub !== null && this.selectedData.heartClub !== '';
            case 5:
                return this.selectedData.youthClub !== null;
            default:
                return false;
        }
    }

    renderDashboard() {
        const state = this.engine?.state;
        if (!state) return;

        const app = this.initDOM();

        if (!this.activeApp || this.activeApp === 'home') {
            app.innerHTML = `
                <div class="phone-frame">
                    <div class="phone-status-bar">
                        <span>9:41</span>
                        <span>⚽ Street to Pro</span>
                        <span>🔋 100%</span>
                    </div>
                    <div class="phone-home-screen">
                        <div class="player-widget-enhanced">
                            <div class="widget-header-line">
                                <span>📅 Saison ${state.calendar?.currentSeasonYear || 2026}/${(state.calendar?.currentSeasonYear || 2026) + 1}</span>
                                <span>${state.calendar?.currentPeriod || 'Pré-saison'}</span>
                            </div>
                            
                            <div class="player-card-banner">
                                <div class="player-image-badge">
                                    <span class="jersey-number">${state.player?.number || 33}</span>
                                </div>
                                <div class="player-main-info">
                                    <div class="widget-title">
                                        <span>${state.player?.firstname || ''} ${state.player?.lastname || ''}</span>
                                        <span style="font-size:0.85rem; opacity:0.9;">⭐ ${state.player?.workRates || 'H H'}</span>
                                    </div>
                                    <div class="player-club-sub">📍 ${state.player?.club || 'Bayer Leverkusen U19'} (${state.player?.position || 'BU'})</div>
                            <div style="margin-top:6px; font-size:0.78rem; color:#cbd5e1;">🎓 ${state.player?.careerProfile?.youthCategory || ''} · ${state.player?.contract?.label || 'Contrat jeune'} · 🏟️ Centre ${'⭐'.repeat(state.player?.careerProfile?.centerStars || 1)}</div>
                            ${state.player?.careerProfile?.role ? `<div style="margin-top:4px; font-size:0.78rem; color:#fbbf24;">🎯 Rôle : ${state.player.careerProfile.role}</div>` : ''}
                                </div>
                            </div>

                            <div class="widget-stats-grid">
                                <div class="stat-pill"><span>⚡ OVR</span><strong>${state.player?.overall || 47}</strong></div>
                                <div class="stat-pill"><span>✨ Pot</span><strong>${state.player?.potential || 78}</strong></div>
                                <div class="stat-pill"><span>🔋 Forme</span><strong>${state.player?.fitness || 90}%</strong></div>
                                <div class="stat-pill"><span>❤️ Moral</span><strong>${state.player?.morale || 80}%</strong></div>
                                <div class="stat-pill"><span>🎂 Âge</span><strong>${state.player?.age || 14} ans</strong></div>
                                <div class="stat-pill"><span>💰 Solde</span><strong>${(state.career?.balance || 750).toLocaleString('fr-FR')} €</strong></div>
                            </div>

                            ${(() => {
                                const plan = this.engine?.state ? CompetitionSystem.getBlockPlan(this.engine.state) : null;
                                const next = plan?.scheduledMatches?.[0];
                                if (!plan) return '';
                                if (plan.type === 'offseason') {
                                    return `<div class="widget-secret-tag">☀️ ${plan.monthLabel} · ${plan.activities.join(' · ')}</div>`;
                                }
                                return `<div class="widget-secret-tag">⚽ ${plan.matches} match${plan.matches > 1 ? 's' : ''} prévu${plan.matches > 1 ? 's' : ''} ce mois · ${next ? `${next.competitionName} · ${next.venue}` : 'activité de carrière'}</div>`;
                            })()}

                            <div class="widget-secret-tag">
                                🚀 Développement : fenêtre d'explosion inconnue
                            </div>
                        </div>

                        <div class="apps-grid">
                            <button class="app-icon" data-app="career">
                                <div class="app-logo" style="background: linear-gradient(135deg, #1e3a8a, #3b82f6);">⚽</div>
                                <span class="app-label">Carrière</span>
                            </button>

                            <button class="app-icon" data-app="social">
                                <div class="app-logo" style="background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045);">📱</div>
                                <span class="app-label">Instafoot</span>
                                ${state.media?.recentDilemma ? '<span class="notification-badge">1</span>' : ''}
                            </button>

                            <button class="app-icon" data-app="messages">
                                <div class="app-logo" style="background: linear-gradient(135deg, #059669, #10b981);">💬</div>
                                <span class="app-label">Messages</span>
                            </button>

                            <button class="app-icon" data-app="bank">
                                <div class="app-logo" style="background: linear-gradient(135deg, #d97706, #f59e0b);">🏦</div>
                                <span class="app-label">Banque</span>
                            </button>

                            <button class="app-icon" data-app="stats">
                                <div class="app-logo" style="background: linear-gradient(135deg, #4f46e5, #6366f1);">📊</div>
                                <span class="app-label">Stats</span>
                            </button>

                            <button class="app-icon" data-app="training">
                                <div class="app-logo" style="background: linear-gradient(135deg, #dc2626, #ef4444);">🏋️‍♂️</div>
                                <span class="app-label">Entraînement</span>
                            </button>

                            <button class="app-icon" data-app="transfers">
                                <div class="app-logo" style="background: linear-gradient(135deg, #0891b2, #06b6d4);">🔄</div>
                                <span class="app-label">Mercato</span>
                            </button>

                            <button class="app-icon" data-app="settings">
                                <div class="app-logo" style="background: linear-gradient(135deg, #475569, #64748b);">⚙️</div>
                                <span class="app-label">Réglages</span>
                            </button>
                        </div>

                        <button id="settings-floating-btn" class="btn-settings-floating" title="Réglages">⚙️</button>

                        <button id="play-block-btn" class="btn-play-block" ${state.player?.careerEnded ? 'disabled' : ''}>
                            ${state.player?.careerEnded ? '🏁 Carrière terminée' : '▶️ Lancer le prochain bloc'}
                        </button>
                    </div>
                </div>
            `;
        } else {
            app.innerHTML = `
                <div class="phone-frame">
                    <div class="phone-status-bar">
                        <span>9:41</span>
                        <span>⚡ Street to Pro</span>
                        <span>🔋 100%</span>
                    </div>
                    <div class="phone-app-view" style="flex:1; display:flex; flex-direction:column; overflow:hidden;">
                        <div class="app-header-bar" style="padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-glass); background: rgba(15, 23, 42, 0.85);">
                            <button class="btn-back-home" id="back-home-btn" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-glass); border-radius: 10px; padding: 6px 12px; color: #fff; font-weight: 700; cursor: pointer; font-size: 0.85rem;">⬅️ Accueil</button>
                            <span class="app-title-header" style="font-weight: 800; font-size:1.05rem; text-transform: capitalize;">${this.activeApp}</span>
                            <span style="width: 60px;"></span>
                        </div>
                        <div id="app-content-body" class="app-content-body">
                            ${this.renderSpecificAppContent()}
                        </div>
                    </div>
                </div>
            `;
        }

        this.bindDashboardEvents();
    }

    renderSpecificAppContent() {
        const state = this.engine?.state || {};
        const socialState = state.social || { romance: { unlocked: false }, relationships: [] };
        const mediaState = state.media || { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null };
        const attr = state.player?.attributes || {};

        const marketValue = TransferMarket.calculateMarketValue(state.player || {});
        const coachInfo = CoachSystem && typeof CoachSystem.getCoachData === 'function' ? CoachSystem.getCoachData(state) : null;

        switch(this.activeApp) {
            case 'career':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">⚽ Gestion Carrière</h3>
                        <p><strong>Joueur :</strong> ${state.player?.firstname || ''} ${state.player?.lastname || ''} (#${state.player?.number || 33})</p>
                        <p><strong>Club :</strong> ${state.player?.club || 'Libre'}</p>
                        <p><strong>Poste :</strong> ${state.player?.position || ''} | <strong>Rendement :</strong> ⭐ ${state.player?.workRates || 'H H'}</p>
                        <p><strong>Parcours :</strong> ${state.player?.careerProfile?.youthCategory || 'U15'} · ${state.player?.contract?.label || 'Contrat jeune'}</p>
                        <p><strong>Centre :</strong> ${'⭐'.repeat(state.player?.careerProfile?.centerStars || 1)} · <strong>Rôle :</strong> ${state.player?.careerProfile?.role || 'Profil encore en développement'}</p>
                        <p><strong>Saison :</strong> ${state.calendar?.currentSeasonYear || 2026} (${state.calendar?.currentPeriod || 'Pré-saison'})</p>
                        <hr style="border-color: var(--border-glass); margin: 12px 0;">
                        <p><strong>Valeur estimée :</strong> 🏷️ ${TransferMarket.formatPrice(marketValue)}</p>
                        <p><strong>Condition physique :</strong> ${state.player?.fitness || 90}%</p>
                        <p><strong>Moral du joueur :</strong> ${state.player?.morale || 80}%</p>
                        <p><strong>Pic de développement :</strong> Inconnu</p>
                        
                        ${coachInfo ? `
                            <hr style="border-color: var(--border-glass); margin: 12px 0;">
                            <h4 style="margin: 0 0 6px; color: var(--accent-gold);">👨‍💼 Entraîneur : ${coachInfo.name || ''}</h4>
                            <p style="margin:4px 0;"><strong>Philosophie :</strong> ${coachInfo.vision || ''}</p>
                            <p style="margin:4px 0;"><strong>Confiance du coach :</strong> ${coachInfo.relationshipScore || 50}/100</p>
                        ` : ''}
                    </div>
                `;
            case 'social':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">📱 Instafoot & Réseaux</h3>
                        <div style="display:flex; justify-content:space-between; background: rgba(255,255,255,0.05); padding:10px; border-radius:12px; margin-bottom:12px;">
                            <span>👥 Abonnés : <strong>${(mediaState.followers || 0).toLocaleString()}</strong></span>
                            <span>🔥 Hype : <strong>${mediaState.hypeLevel || 0}/100</strong></span>
                        </div>

                        ${mediaState.recentDilemma ? `
                            <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius:16px; padding:12px; margin-bottom:14px;">
                                <h4 style="color: #ef4444; margin:0 0 6px;">⚠️ ${mediaState.recentDilemma.title || 'Dilemma Média'}</h4>
                                <p style="font-size:0.85rem; margin:0 0 10px;">${mediaState.recentDilemma.description || ''}</p>
                                <div style="display:flex; flex-direction:column; gap:6px;">
                                    ${(mediaState.recentDilemma.choices || []).map((choice, idx) => `
                                        <button class="btn-dilemma" data-choice-idx="${idx}" style="padding:10px; border-radius:10px; background: rgba(255,255,255,0.15); border:1px solid var(--border-glass); color:#fff; cursor:pointer; font-weight:600; text-align:left;">
                                            👉 ${choice?.text || choice?.texte || ''}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="feed-list">
                            ${(mediaState.feed && mediaState.feed.length > 0) ? mediaState.feed.map(post => `
                                <div style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); border-radius:12px; padding:12px; margin-bottom:10px;">
                                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; color: var(--text-sub); margin-bottom:6px;">
                                        <span>📢 ${post?.source || 'Instafoot'}</span>
                                        <span>${post?.date || ''}</span>
                                    </div>
                                    <p style="font-size:0.88rem; margin:0 0 8px;">${post?.content || ''}</p>
                                    <div style="font-size:0.75rem; color: var(--accent-gold); display:flex; gap:14px;">
                                        <span>❤️ ${post?.likes || 0} likes</span>
                                        <span>💬 ${post?.commentsCount || 0} commentaires</span>
                                    </div>
                                </div>
                            `).join('') : '<p style="font-size:0.85rem; color: var(--text-sub);">Aucun post récent sur votre fil d\'actualité.</p>'}
                        </div>
                    </div>
                `;
            case 'messages':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">💬 Messages & Vestiaire</h3>
                        <p><strong>Statut personnel :</strong> ${socialState.romance?.unlocked ? (socialState.romance.partnerName || 'En couple') : 'Célibataire'}</p>
                        <hr style="border-color: var(--border-glass); margin: 12px 0;">
                        <h4 style="margin:0 0 8px;">Relations d'équipe :</h4>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${(socialState.relationships && socialState.relationships.length > 0) ? socialState.relationships.map(rel => `
                                <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:10px; font-size:0.85rem;">
                                    <span>${rel?.role || 'Coéquipier'} (${rel?.name || 'Inconnu'})</span>
                                    <strong>${rel?.score || 50}/100</strong>
                                </div>
                            `).join('') : '<p style="font-size:0.85rem; color: var(--text-sub);">Aucune interaction récente dans le vestiaire.</p>'}
                        </div>
                    </div>
                `;
            case 'bank':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">🏦 Banque & Finances</h3>
                        <div style="background: linear-gradient(135deg, #10b981, #047857); padding:20px; border-radius:20px; text-align:center; margin-bottom:14px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);">
                            <span style="font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; opacity:0.9;">Solde Disponible</span>
                            <div style="font-size:2rem; font-weight:900; margin-top:4px;">${(state.career?.balance || 750).toLocaleString('fr-FR')} €</div>
                        </div>
                        <p style="font-size:0.88rem;"><strong>Salaire hebdomadaire :</strong> ${(state.player?.salary || 150).toLocaleString('fr-FR')} € / sem.</p>
                    </div>
                `;
            case 'stats':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">📊 Statistiques & Attributs</h3>
                        <div style="display:flex; justify-content:space-around; background:rgba(255,255,255,0.05); padding:10px; border-radius:12px; text-align:center; font-size:0.85rem; margin-bottom:12px;">
                            <div>🎮 Matchs<br><strong>${state.player?.stats?.matchesPlayed || 0}</strong></div>
                            <div>⚽ Buts<br><strong>${state.player?.stats?.goals || 0}</strong></div>
                            <div>🎯 Passes<br><strong>${state.player?.stats?.assists || 0}</strong></div>
                        </div>
                        <hr style="border-color: var(--border-glass); margin: 12px 0;">
                        <h4 style="margin:0 0 10px;">⚡ Général (${state.player?.overall || 47}) | Potentiel (${state.player?.potential || 78})</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <div class="stat-pill">🏃‍♂️ Vitesse <strong>${attr.vitesse || 50}</strong></div>
                            <div class="stat-pill">🎯 Tir <strong>${attr.tir || 50}</strong></div>
                            <div class="stat-pill">🎯 Passe <strong>${attr.passe || 50}</strong></div>
                            <div class="stat-pill">✨ Dribble <strong>${attr.dribble || 50}</strong></div>
                            <div class="stat-pill">🛡️ Défense <strong>${attr.defense || 50}</strong></div>
                            <div class="stat-pill">💪 Physique <strong>${attr.physique || 50}</strong></div>
                        </div>
                    </div>
                `;
            case 'training':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">🏋️‍♂️ Programme d'Entraînement</h3>
                        <p style="font-size:0.85rem; color: var(--text-sub); margin-bottom:12px;">Sélectionnez le domaine à développer en priorité :</p>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${Object.entries(TrainingManager.FOCUS_TYPES || {}).map(([key, focusObj]) => `
                                <div class="card-select training-card ${state.trainingFocus === key ? 'selected' : ''}" data-focus-key="${key}" style="background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); padding:12px; border-radius:14px; cursor:pointer;">
                                    <h4 style="margin:0; font-size:0.95rem; color:#fff;">${focusObj?.name || key}</h4>
                                    <p style="margin:4px 0 0; font-size:0.8rem; color: var(--text-sub);">${focusObj?.description || ''}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'transfers':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">🔄 Marché des Transferts</h3>
                        <p><strong>Valeur marchand estimée :</strong> ${TransferMarket.formatPrice(marketValue)}</p>
                        <p style="font-size:0.85rem; color: var(--text-sub); margin-top:10px; line-height:1.4;">
                            Les propositions d'autres clubs apparaîtront automatiquement sous forme de modales de négociation lors des périodes de mercato.
                        </p>
                    </div>
                `;
            case 'settings':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title">⚙️ Réglages Carrière</h3>
                        <div style="display:flex; flex-direction:column; gap:10px; margin-top:14px;">
                            ${state.player?.canRetire && !state.player?.careerEnded ? `
                                <button id="retire-career-btn" style="padding:14px; border-radius:14px; background:rgba(239,68,68,0.25); border:1px solid #ef4444; color:#fff; font-weight:700; cursor:pointer;">
                                    🏁 Prendre sa retraite (${state.player.age} ans)
                                </button>
                            ` : ''}
                            <button id="reset-career-btn" style="padding:14px; border-radius:14px; background:rgba(255,255,255,0.1); border:1px solid var(--border-glass); color:#fff; font-weight:700; cursor:pointer;">
                                🗑️ Recommencer la carrière
                            </button>
                        </div>
                    </div>
                `;
            default:
                return `<p style="font-size:0.85rem; color:var(--text-sub);">Application en cours de chargement...</p>`;
        }
    }

    bindDashboardEvents() {
        const playBtn = document.getElementById('play-block-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                const state = this.engine?.state;
                if (!state) return;

                if (state.player?.isInjured) {
                    const result = this.engine.playBlock(null);
                    this.handleBlockResult(result);
                    return;
                }

                const isFinalPeriod = state.calendar?.currentMonth === 5;
                const matchType = isFinalPeriod ? 'final' : 'standard';

                const shouldAsk = MatchChoiceManager.shouldTriggerDilemma(matchType);

                if (shouldAsk) {
                    const dilemma = MatchChoiceManager.getMatchDilemma(matchType, "l'adversaire");

                    this.afficherModaleMatchDilemma(dilemma, (selectedChoice) => {
                        const result = this.engine.playBlock(selectedChoice);
                        this.handleBlockResult(result);
                    });
                } else {
                    const result = this.engine.playBlock(null);
                    this.handleBlockResult(result);
                }
            });
        }

        const settingsFloatingBtn = document.getElementById('settings-floating-btn');
        if (settingsFloatingBtn) {
            settingsFloatingBtn.addEventListener('click', () => {
                this.activeApp = 'settings';
                this.renderDashboard();
            });
        }

        const retireCareerBtn = document.getElementById('retire-career-btn');
        if (retireCareerBtn) {
            retireCareerBtn.addEventListener('click', () => {
                if (window.confirm(`Prendre sa retraite à ${this.engine?.state?.player?.age || 34} ans ?`)) {
                    this.engine.retireCareer();
                    this.renderDashboard();
                }
            });
        }

        const resetCareerBtn = document.getElementById('reset-career-btn');
        if (resetCareerBtn) {
            resetCareerBtn.addEventListener('click', () => {
                if (window.confirm('Réinitialiser la carrière et recommencer à zéro ?')) {
                    this.engine.resetCareer();
                }
            });
        }

        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                this.activeApp = e.currentTarget.getAttribute('data-app');
                this.renderDashboard();
            });
        });

        const backBtn = document.getElementById('back-home-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.activeApp = 'home';
                this.renderDashboard();
            });
        }

        document.querySelectorAll('.btn-dilemma').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIdx = parseInt(e.currentTarget.getAttribute('data-choice-idx'), 10);
                if (typeof this.engine?.resolveMediaDilemma === 'function') {
                    this.engine.resolveMediaDilemma(choiceIdx);
                }
                this.renderDashboard();
            });
        });

        document.querySelectorAll('.training-card').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.training-card').forEach(c => c.classList.remove('selected'));
                const cardEl = e.currentTarget;
                cardEl.classList.add('selected');
                const focusKey = cardEl.getAttribute('data-focus-key');
                this.selectedFocus = focusKey;
                if (typeof this.engine?.setTrainingFocus === 'function') {
                    this.engine.setTrainingFocus(focusKey);
                }
            });
        });
    }

    handleBlockResult(result) {
        this.renderDashboard();

        if (!result) return;

        if (result.recoveryOnly) {
            this.afficherMessageModal(
                '🏥 Récupération Médicale',
                'Période dédiée aux soins intensifs et à la rééducation.'
            );
            return;
        }

        const openPendingInteraction = () => {
            if (result.event) {
                this.afficherModaleEvent(result.event, (choiceIndex) => {
                    const consequence = this.engine.resolveEventChoice(choiceIndex);

                    const finish = () => {
                        this.renderDashboard();
                        this.handlePostInteraction();
                    };

                    if (consequence?.changes?.length || consequence?.temporary?.length || consequence?.xp) {
                        this.afficherModaleConsequences(consequence, finish);
                    } else {
                        finish();
                    }
                });
                return;
            }

            if (result.coachEvent) {
                this.afficherModaleCoach(result.coachEvent, (choiceIndex) => {
                    const consequence = this.engine.resolveCoachChoice(choiceIndex);

                    const finish = () => {
                        this.renderDashboard();
                        this.handlePostInteraction();
                    };

                    if (consequence?.changes?.length || consequence?.temporary?.length || consequence?.xp) {
                        this.afficherModaleConsequences(consequence, finish);
                    } else {
                        finish();
                    }
                });
                return;
            }

            this.handlePostInteraction();
        };

        if (result.report?.summary?.choiceConsequences) {
            this.afficherModaleConsequences(
                result.report.summary.choiceConsequences,
                openPendingInteraction
            );
            return;
        }

        openPendingInteraction();

        if (result.transferOffer) {
            this.afficherModaleTransfer(result.transferOffer);
            return;
        }

        this.handlePostInteraction();
    }

    handlePostInteraction() {
        const state = this.engine?.state;
        if (!state) return;

        if (state.pendingPositionProposal) {
            const proposal = state.pendingPositionProposal;
            this.afficherModaleMatchDilemma({
                title: '🧠 Le coach vous voit autrement',
                description: proposal.message,
                choices: [
                    { text: `✅ Essayer ${CareerSystem.positionName(proposal.to)}`, impacts: {} },
                    { text: '❌ Rester à mon poste', impacts: {} }
                ]
            }, (choice) => {
                this.engine.resolvePositionProposal(choice === 0);
                this.renderDashboard();
                this.handlePostInteraction();
            });
            return;
        }

        if (state.pendingTransferOffer) {
            this.afficherModaleTransfer(state.pendingTransferOffer);
        }
    }

    afficherMessageModal(title, description) {
        this.afficherModaleMatchDilemma({
            title,
            description,
            choices: [{ text: 'Continuer', impacts: {} }]
        }, () => this.renderDashboard());
    }

    afficherModaleEvent(event, onChoiceMade) {
        this.afficherModaleMatchDilemma({
            title: event?.titre || 'Événement Carrière',
            description: event?.description || '',
            choices: (event?.choix || []).map(choice => ({
                ...choice,
                text: choice?.texte || 'Valider'
            }))
        }, (_, index) => {
            const choices = event?.choix || [];
            const selectedIndex = choices.findIndex(choice => choice === _);
            onChoiceMade(selectedIndex >= 0 ? selectedIndex : index);
        });
    }

    afficherModaleCoach(event, onChoiceMade) {
        this.afficherModaleMatchDilemma({
            title: event?.title || 'Entretien avec le Coach',
            description: event?.description || '',
            choices: event?.choices || []
        }, (choice, index) => {
            const choices = event?.choices || [];
            const selectedIndex = choices.findIndex(item => item === choice);
            onChoiceMade(selectedIndex >= 0 ? selectedIndex : index);
        });
    }

    afficherModaleTransfer(offer) {
        let modal = document.getElementById('event-modal-container');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.className = 'event-modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">🔄 OFFRE DE TRANSFERT</span>
                <h3 class="event-modal-title">${offer?.club || 'Club intéressé'}</h3>
                <p class="event-modal-desc">${offer?.message || 'Une offre ferme a été déposée sur la table des négociations.'}</p>
                <div style="background: rgba(255,255,255,0.05); padding:12px; border-radius:12px; margin-bottom:16px; font-size:0.85rem;">
                    <p style="margin:4px 0;"><strong>Rôle proposé :</strong> ${offer?.rolePropose || 'Titulaire'}</p>
                    <p style="margin:4px 0;"><strong>Salaire :</strong> ${(offer?.salaireHebdo || 0).toLocaleString('fr-FR')} € / sem.</p>
                    <p style="margin:4px 0;"><strong>Indemnité :</strong> ${(offer?.montant || 0).toLocaleString('fr-FR')} €</p>
                </div>
                <div class="event-modal-choices">
                    <button class="btn-event-choice" data-transfer="accept">✅ Accepter l'Offre</button>
                    <button class="btn-event-choice" data-transfer="reject" style="opacity:0.7;">❌ Refuser</button>
                </div>
            </div>
        `;

        modal.querySelector('[data-transfer="accept"]')?.addEventListener('click', () => {
            const result = this.engine.acceptTransferOffer();
            modal.remove();
            this.renderDashboard();
            this.afficherMessageModal(
                '✈️ Transfert Bouclé !',
                result
                    ? `Nouveau club : ${result.newClub}. Ton nouveau salaire est fixé à ${result.salary.toLocaleString('fr-FR')} € / semaine.`
                    : 'Transfert accepté.'
            );
        });

        modal.querySelector('[data-transfer="reject"]')?.addEventListener('click', () => {
            this.engine.rejectTransferOffer();
            modal.remove();
            this.renderDashboard();
        });
    }

    afficherModaleConsequences(result, onContinue = null) {
        let modal = document.getElementById('event-modal-container');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.className = 'event-modal-overlay';
            document.body.appendChild(modal);
        }

        const changes = result?.changes || [];
        const temporary = result?.temporary || [];
        const effects = [
            ...changes.map(change => ({
                label: change.label || change.stat,
                delta: change.delta,
                type: 'permanent'
            })),
            ...temporary.map(effect => ({
                label: effect.label || effect.stat,
                delta: effect.value,
                type: 'temporary',
                duration: effect.duration
            }))
        ];

        if (result?.xp) {
            effects.push({
                label: 'XP Gagné',
                delta: result.xp,
                type: 'xp'
            });
        }

        const html = effects.map(effect => {
            const positive = Number(effect.delta) > 0;
            const sign = positive ? '+' : '';
            const value = effect.type === 'temporary'
                ? `${sign}${Math.round(Number(effect.delta) * 100)}%`
                : `${sign}${effect.delta}`;

            const duration = effect.type === 'temporary'
                ? `<small style="opacity:0.6;"> · ${effect.duration} match(s)</small>`
                : '';

            return `
                <div class="consequence-result-row" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size:0.85rem; color: ${positive ? '#10b981' : '#ef4444'};">
                    <span>${positive ? '▲' : '▼'} ${effect.label}</span>
                    <strong>${value}${duration}</strong>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">📊 IMPACT & BILAN</span>
                <h3 class="event-modal-title">${result?.title || 'Résultats'}</h3>
                ${result?.message ? `<p class="event-modal-desc">${result.message}</p>` : ''}
                <div class="consequence-result-list" style="margin-bottom:16px;">
                    ${html || '<p style="font-size:0.85rem; color:var(--text-sub);">Aucun changement direct sur vos statistiques.</p>'}
                </div>
                <div class="event-modal-choices">
                    <button class="btn-event-choice consequence-continue" style="text-align:center;">Continuer</button>
                </div>
            </div>
        `;

        modal.querySelector('.consequence-continue')?.addEventListener('click', () => {
            modal.remove();
            if (typeof onContinue === 'function') {
                onContinue();
            }
        });
    }

    afficherModaleMatchDilemma(dilemma, onChoiceMade) {
        let modal = document.getElementById('event-modal-container');

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.className = 'event-modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">⚡ ÉVÉNEMENT & TACTIQUE</span>
                <h3 class="event-modal-title">${dilemma?.title || 'Décision'}</h3>
                <p class="event-modal-desc">${dilemma?.description || ''}</p>

                <div class="event-modal-choices">
                    ${(dilemma?.choices || []).map((choix, index) => `
                        <button class="btn-event-choice" data-choice-index="${index}" type="button">
                            👉 ${choix?.texte || choix?.text || choix?.label || 'Valider'}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelectorAll('.btn-event-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(
                    e.currentTarget.getAttribute('data-choice-index'),
                    10
                );

                const choixSelectionne = dilemma?.choices?.[choiceIndex];

                modal.remove();

                if (typeof onChoiceMade === 'function') {
                    onChoiceMade(choixSelectionne, choiceIndex);
                }
            });
        });
    }
}

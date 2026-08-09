// ui.js
import { POSITIONS as _POSITIONS, CONTINENTS as _CONTINENTS, ORIGINS as _ORIGINS, HEART_CLUBS as _HEART_CLUBS, YOUTH_CLUBS_POOL as _YOUTH_CLUBS_POOL, COACH_VISIONS as _COACH_VISIONS, COACH_NAMES as _COACH_NAMES } from './constants.js';
import { EventEngine as _EventEngine } from './events.js';
import { TrainingManager as _TrainingManager } from './entrainement.js';
import { MatchChoiceManager as _MatchChoiceManager } from './matchChoices.js';
import { TransferMarket as _TransferMarket } from './transferMarket.js';
import { CoachSystem as _CoachSystem } from './coachSystem.js';

// Sécurisation absolue (transformation en tableaux si les imports sont des objets)
const POSITIONS = Array.isArray(_POSITIONS) ? _POSITIONS : Object.values(_POSITIONS || {});
const CONTINENTS = _CONTINENTS || {};
const ORIGINS = _ORIGINS || {};
const HEART_CLUBS = _HEART_CLUBS || {};
const YOUTH_CLUBS_POOL = Array.isArray(_YOUTH_CLUBS_POOL) ? _YOUTH_CLUBS_POOL : Object.values(_YOUTH_CLUBS_POOL || {});
const COACH_VISIONS = _COACH_VISIONS || [{ title: 'Équilibré' }];
const COACH_NAMES = _COACH_NAMES || ['Thomas Tuchel', 'Pep Guardiola'];

const EventEngine = _EventEngine || { checkAndTriggerEvent: () => null };
const TrainingManager = _TrainingManager || { FOCUS_TYPES: { TECHNIQUE: { name: 'Technique', description: 'Améliore la technique pure' } } };
const MatchChoiceManager = _MatchChoiceManager || { getMatchDilemma: () => ({ title: 'Match important', description: 'Préparez votre rencontre.', choices: [{ texte: 'Jouer prudemment', impacts: {} }] }) };
const TransferMarket = _TransferMarket || { 
    calculateMarketValue: () => 100000, 
    formatPrice: (p) => `${p || 0} €`, 
    generateTransferOffer: () => null 
};
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
        
        this.initDOM();
    }

    init() {
        console.log("Initialisation et rendu de l'interface utilisateur...");
        this.render();
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
            console.error("💥 CRASH CRITIQUE DANS RENDER() :", error);
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = `<div style="padding: 20px; color: white; background: red; border-radius: 8px;">
                    <h3>⚠️ Erreur d'interface</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 12px; margin-top: 10px;">Vérifie la console Eruda pour plus de détails.</p>
                </div>`;
            }
        }
    }

    renderStepContent() {
        // Ajout des blocs { } pour chaque case afin de protéger le scope des variables (const/let)
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
                        <span>⚡ Street to Pro</span>
                        <span>🔋 100%</span>
                    </div>
                    <div class="phone-home-screen">
                        <div class="player-widget-enhanced">
                            <div class="widget-subtitle">📅 Saison ${state.calendar?.currentSeasonYear || 2026}/${(state.calendar?.currentSeasonYear || 2026) + 1} — ${state.calendar?.currentPeriod || ''}</div>
                            
                            <div class="player-card-banner">
                                <div class="player-image-badge">
                                    <img src="assets/IMG_8758.jpg" alt="Avatar" onerror="this.style.display='none'">
                                    <span class="jersey-number">99</span>
                                </div>
                                <div class="player-main-info">
                                    <div class="widget-title">⭐ ${state.player?.firstname || ''} ${state.player?.lastname || ''}</div>
                                    <div class="player-club-sub">📍 ${state.player?.club || 'Sans club'} (${state.player?.position || ''})</div>
                                </div>
                            </div>

                            <div class="widget-stats-grid">
                                <div class="stat-pill">⚡ OVR : <strong>${state.player?.overall || 50}</strong></div>
                                <div class="stat-pill">✨ Pot : <strong>${state.player?.potential || 75}</strong></div>
                                <div class="stat-pill">🔋 Forme : <strong>${state.player?.fitness || 100}%</strong></div>
                                <div class="stat-pill">❤️ Moral : <strong>${state.player?.morale || 100}%</strong></div>
                                <div class="stat-pill">💰 <strong>${state.career?.balance || 0} €</strong></div>
                            </div>
                        </div>

                        <div class="apps-grid">
                            <button class="app-icon" data-app="career">
                                <div class="app-logo career-logo">⚽</div>
                                <span class="app-label">Carrière</span>
                            </button>

                            <button class="app-icon" data-app="social">
                                <div class="app-logo social-logo">📱</div>
                                <span class="app-label">Instafoot</span>
                                ${state.media?.recentDilemma ? '<span class="notification-badge">1</span>' : ''}
                            </button>

                            <button class="app-icon" data-app="messages">
                                <div class="app-logo messages-logo">💬</div>
                                <span class="app-label">Messages</span>
                            </button>

                            <button class="app-icon" data-app="bank">
                                <div class="app-logo bank-logo">🏦</div>
                                <span class="app-label">Banque</span>
                            </button>

                            <button class="app-icon" data-app="stats">
                                <div class="app-logo stats-logo">📊</div>
                                <span class="app-label">Stats</span>
                            </button>

                            <button class="app-icon" data-app="training">
                                <div class="app-logo training-logo">🏋️‍♂️</div>
                                <span class="app-label">Entraînement</span>
                            </button>
                        </div>

                        <button id="play-block-btn" class="btn-play-block">
                            ▶️ Lancer le prochain bloc
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
                    <div class="phone-app-view">
                        <div class="app-header-bar">
                            <button class="btn-back-home" id="back-home-btn">⬅️ Accueil</button>
                            <span class="app-title-header">${this.activeApp}</span>
                            <span></span>
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
                        <h3 class="pane-title career-color">⚽ Gestion Carrière</h3>
                        <p><strong>Club :</strong> ${state.player?.club || ''}</p>
                        <p><strong>Poste :</strong> ${state.player?.position || ''} | <strong>Âge :</strong> ${state.player?.age || 17} ans</p>
                        <p><strong>Saison :</strong> ${state.calendar?.currentSeasonYear || 2026}</p>
                        <p><strong>Période :</strong> ${state.calendar?.currentPeriod || ''}</p>
                        <hr class="pane-divider">
                        <p><strong>Valeur marchande :</strong> 🏷️ ${TransferMarket.formatPrice(marketValue)}</p>
                        <p><strong>Forme physique :</strong> ${state.player?.fitness || 100}%</p>
                        <p><strong>Moral :</strong> ${state.player?.morale || 100}%</p>
                        
                        ${coachInfo ? `
                            <hr class="pane-divider">
                            <h4 class="history-section-title">👨‍💼 Entraîneur : ${coachInfo.name || ''}</h4>
                            <p><strong>Vision :</strong> ${coachInfo.vision || ''}</p>
                            <p><strong>Relation :</strong> ${coachInfo.relationshipScore || 50}/100</p>
                        ` : ''}
                    </div>
                `;
            case 'social':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title social-color">📱 Instafoot & Médias</h3>
                        <div class="social-stats-row">
                            <span>👥 Abonnés : <strong>${(mediaState.followers || 0).toLocaleString()}</strong></span>
                            <span>🔥 Hype : <strong>${mediaState.hypeLevel || 0}/100</strong></span>
                        </div>

                        ${mediaState.recentDilemma ? `
                            <div class="dilemma-box">
                                <h4 class="dilemma-title">${mediaState.recentDilemma.title || ''}</h4>
                                <p class="dilemma-desc">${mediaState.recentDilemma.description || ''}</p>
                                <div class="dilemma-choices">
                                    ${(mediaState.recentDilemma.choices || []).map((choice, idx) => `
                                        <button class="btn-dilemma" data-choice-idx="${idx}">
                                            👉 ${choice?.text || choice?.texte || ''}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="feed-list">
                            ${(mediaState.feed || []).map(post => `
                                <div class="feed-item">
                                    <div class="feed-item-header">
                                        <span>📢 ${post?.source || ''}</span>
                                        <span>${post?.date || ''}</span>
                                    </div>
                                    <p class="feed-item-content">${post?.content || ''}</p>
                                    <div class="feed-item-footer">
                                        <span>❤️ ${post?.likes || 0}</span>
                                        <span>💬 ${post?.commentsCount || 0}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 'messages':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title messages-color">💬 Messages & Vestiaire</h3>
                        <p><strong>Situation :</strong> ${socialState.romance?.unlocked ? (socialState.romance.partnerName || 'En couple') : 'Célibataire'}</p>
                        <hr class="pane-divider">
                        <p class="relations-subtitle">Relations clés :</p>
                        <ul class="relations-list">
                            ${(socialState.relationships || []).map(rel => `<li>${rel?.role || ''} (${rel?.name || ''}) : ${rel?.score || 50}/100</li>`).join('')}
                        </ul>
                    </div>
                `;
            case 'bank':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title bank-color">🏦 Banque & Finances</h3>
                        <div class="bank-card-balance">
                            <span class="balance-label">Solde actuel</span>
                            <div class="balance-amount">${state.career?.balance || 0} €</div>
                        </div>
                    </div>
                `;
            case 'stats':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title stats-color">📊 Statistiques & Attributs</h3>
                        <p><strong>Matchs :</strong> ${state.player?.stats?.matchesPlayed || 0} | <strong>Buts :</strong> ${state.player?.stats?.goals || 0}</p>
                        <hr class="pane-divider">
                        <h4 class="history-section-title">⚡ Attributs (OVR : ${state.player?.overall || 50})</h4>
                        <div class="attributes-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.9rem;">
                            <div class="stat-pill">🏃‍♂️ Vitesse : <strong>${attr.vitesse || 50}</strong></div>
                            <div class="stat-pill">🎯 Tir : <strong>${attr.tir || 50}</strong></div>
                            <div class="stat-pill">🎯 Passe : <strong>${attr.passe || 50}</strong></div>
                            <div class="stat-pill">✨ Dribble : <strong>${attr.dribble || 50}</strong></div>
                            <div class="stat-pill">🛡️ Défense : <strong>${attr.defense || 50}</strong></div>
                            <div class="stat-pill">💪 Physique : <strong>${attr.physique || 50}</strong></div>
                        </div>
                    </div>
                `;
            case 'training':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title training-color">🏋️‍♂️ Centre d'Entraînement</h3>
                        <p class="subtitle">Choisis ton axe de travail :</p>
                        <div class="grid-focus">
                            ${Object.entries(TrainingManager.FOCUS_TYPES || {}).map(([key, focusObj]) => `
                                <div class="card-select training-card ${state.trainingFocus === key ? 'selected' : ''}" data-focus-key="${key}">
                                    <h4>${focusObj?.name || key}</h4>
                                    <p>${focusObj?.description || ''}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            default:
                return `<p class="fallback-text">Application en cours de développement...</p>`;
        }
    }

    bindDashboardEvents() {
        const playBtn = document.getElementById('play-block-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                const state = this.engine?.state;
                if (!state) return;

                if (state.player && state.player.isInjured) {
                    alert("Votre joueur est blessé.");
                    return;
                }

                const isFinalPeriod = state.calendar?.currentMonth === 5; 
                const matchType = isFinalPeriod ? 'final' : 'standard';
                const matchDilemma = MatchChoiceManager.getMatchDilemma(matchType, "l'adversaire");

                this.afficherModaleMatchDilemma(matchDilemma, (selectedChoice) => {
                    if (typeof this.engine.playBlock === 'function') {
                        this.engine.playBlock(selectedChoice);
                    }
                    this.renderDashboard();
                });
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
                <span class="event-modal-category">⚡ MATCH CLÉ</span>
                <h3 class="event-modal-title">${dilemma?.title || 'Match'}</h3>
                <p class="event-modal-desc">${dilemma?.description || ''}</p>
                <div class="event-modal-choices">
                    ${(dilemma?.choices || []).map((choix, index) => `
                        <button class="btn-event-choice" data-choice-index="${index}">
                            👉 ${choix?.texte || choix?.text || 'Continuer'}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelectorAll('.btn-event-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.currentTarget.getAttribute('data-choice-index'), 10);
                const choixSelectionne = dilemma?.choices[choiceIndex];

                modal.remove();
                if (typeof onChoiceMade === 'function') {
                    onChoiceMade(choixSelectionne);
                }
            });
        });
    }
}

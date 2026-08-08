// ui.js
import { POSITIONS, CONTINENTS, ORIGINS, HEART_CLUBS, YOUTH_CLUBS_POOL, COACH_VISIONS, COACH_NAMES } from './constants.js';
import { EventEngine } from './events.js';
import { TrainingManager } from './entrainement.js';
import { MatchChoiceManager } from './matchChoices.js'; // Import du gestionnaire de choix de match

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentStep = 1;
        this.activeApp = 'home';
        this.selectedFocus = 'TECHNIQUE'; // Synchronisé avec la valeur par défaut du state du GameEngine
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
        this.render();
    }

    initDOM() {
        let app = document.getElementById('app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'app';
            document.body.appendChild(app);
        }
    }

    render() {
        if (this.engine.state) {
            this.renderDashboard();
            return;
        }

        const app = document.getElementById('app');
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
    }

    renderStepContent() {
        switch(this.currentStep) {
            case 1:
                return `
                    <h2>Étape 1 : Identité & Poste</h2>
                    <div class="form-group">
                        <label for="firstname">Prénom :</label>
                        <input type="text" id="firstname" value="${this.selectedData.firstname}" placeholder="ex: Kylian">
                    </div>
                    <div class="form-group">
                        <label for="lastname">Nom :</label>
                        <input type="text" id="lastname" value="${this.selectedData.lastname}" placeholder="ex: Mbappé">
                    </div>
                    <div class="form-group">
                        <label>Choisis ton poste sur le terrain :</label>
                        <div class="proclubs-pitch-container">
                            <div class="proclubs-soccer-pitch">
                                ${POSITIONS.map(p => {
                                    let coords = { top: '50%', left: '50%' };
                                    const id = p.id;
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

                                    const isSelected = this.selectedData.position === p.id ? 'selected' : '';

                                    return `
                                        <button class="proclubs-node ${isSelected}" data-pos="${p.id}" style="top: ${coords.top}; left: ${coords.left};" title="${p.name}">
                                            <div class="proclubs-jersey">👕</div>
                                            <span class="proclubs-pos-name">${p.id}</span>
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            case 2:
                const selectedOriginObj = Object.values(ORIGINS).find(o => o.id === this.selectedData.origin);
                
                return `
                    <h2>Étape 2 : Origine</h2>
                    <p class="subtitle">Comment avez-vous façonné votre jeu ?</p>
                    <div class="grid-origins-compact">
                        ${Object.values(ORIGINS).map(o => {
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
                                        <h3>${o.name}</h3>
                                        <span class="trait-tag">${o.trait}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="origin-description-box">
                        ${selectedOriginObj ? `<p>📖 ${selectedOriginObj.desc}</p>` : `<p class="placeholder-text">👉 Clique sur une origine pour découvrir son histoire et son impact sur ton jeu.</p>`}
                    </div>
                `;
            case 3:
                return `
                    <h2>Étape 3 : Région & Pays</h2>
                    <div class="grid-continents">
                        ${Object.keys(CONTINENTS).map(continent => `
                            <button class="chip-continent ${this.selectedData.continent === continent ? 'selected' : ''}" data-continent="${continent}">${continent}</button>
                        `).join('')}
                    </div>
                    ${this.selectedData.continent ? `
                        <h3>Pays :</h3>
                        <div class="grid-countries">
                            ${CONTINENTS[this.selectedData.continent].map(c => `
                                <button class="chip-country ${this.selectedData.country === c.name ? 'selected' : ''}" data-country="${c.name}">${c.flag} ${c.name}</button>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
            case 4:
                return `
                    <h2>Étape 4 : Club de Cœur</h2>
                    <div class="form-group">
                        <label for="heart-club-select">Club de cœur :</label>
                        <select id="heart-club-select">
                            <option value="">-- Choisir un club --</option>
                            ${Object.entries(HEART_CLUBS).map(([league, clubs]) => `
                                <optgroup label="${league}">
                                    ${clubs.map(c => `<option value="${c.name}" ${this.selectedData.heartClub === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </optgroup>
                            `).join('')}
                        </select>
                    </div>
                `;
            case 5:
                if (this.randomYouthClubs.length === 0) {
                    const shuffled = [...YOUTH_CLUBS_POOL].sort(() => 0.5 - Math.random());
                    const count = Math.floor(Math.random() * 3) + 4; 
                    
                    this.randomYouthClubs = shuffled.slice(0, count).map(yc => {
                        const randomVision = COACH_VISIONS[Math.floor(Math.random() * COACH_VISIONS.length)];
                        const randomCoachName = COACH_NAMES[Math.floor(Math.random() * COACH_NAMES.length)];
                        const salary = Math.round(100 + (Math.random() * 200));
                        const playtimeOptions = ["Temps de jeu limité", "Joueur de rotation", "Espoir / Prêt potentiel", "Titulaire en jeunes"];
                        const playtime = playtimeOptions[Math.floor(Math.random() * playtimeOptions.length)];
                        const targetRating = Math.min(75, 55 + Math.round(yc.prestige / 4));

                        return {
                            ...yc,
                            coachName: randomCoachName,
                            coachVision: randomVision.title,
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
                            <div class="card-select club-card ${this.selectedData.youthClub?.name === yc.name ? 'selected' : ''}" data-club-name="${yc.name}">
                                <div class="club-header-info">
                                    <h3>${yc.name}</h3>
                                    <span class="league-tag">🏆 ${yc.league} (${yc.country})</span>
                                </div>
                                <div class="contract-details">
                                    <p><strong>👨‍💼 Entraîneur :</strong> ${yc.coachName} <em>(${yc.coachVision})</em></p>
                                    <p><strong>💶 Salaire :</strong> ${yc.salary} € / semaine</p>
                                    <p><strong>⏱️ Temps de jeu :</strong> ${yc.playtime}</p>
                                    <p><strong>🎯 Objectif / Note visée :</strong> Atteindre ${yc.targetRating} Général en fin de saison</p>
                                </div>
                                <div class="prestige-badge">Prestige du club : ${yc.prestige}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
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
                
                const chosenOffer = this.randomYouthClubs.find(yc => yc.name === clubName);
                this.selectedData.youthClub = chosenOffer;
                this.selectedData.coachVision = chosenOffer.coachVision;
                this.selectedData.coachName = chosenOffer.coachName;

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
                if (typeof this.engine.startCareer === 'function') {
                    this.engine.startCareer(this.selectedData);
                    this.renderDashboard();
                }
            });
        }
    }

    isStepValid() {
        switch(this.currentStep) {
            case 1:
                return this.selectedData.firstname.length > 0 && 
                       this.selectedData.lastname.length > 0 && 
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
        const state = this.engine.state;
        if (!state) return;

        const app = document.getElementById('app');

        if (!this.activeApp || this.activeApp === 'home') {
            app.innerHTML = `
                <div class="phone-frame">
                    <div class="phone-status-bar">
                        <span>9:41</span>
                        <span>⚡ Street to Pro</span>
                        <span>🔋 100%</span>
                    </div>
                    <div class="phone-home-screen">
                        <!-- Widget Joueur Enrichi : Maillot floqué & Stats -->
                        <div class="player-widget-enhanced">
                            <div class="widget-subtitle">📅 Saison ${state.calendar.currentSeasonYear}/${state.calendar.currentSeasonYear + 1} — ${state.calendar.currentPeriod}</div>
                            
                            <div class="player-card-banner">
                                <div class="player-image-badge">
                                    <img src="assets/IMG_8758.jpg" alt="Avatar">
                                    <span class="jersey-number">99</span>
                                </div>
                                <div class="player-main-info">
                                    <div class="widget-title">⭐ ${state.player.firstname} ${state.player.lastname}</div>
                                    <div class="player-club-sub">📍 ${state.player.club} (${state.player.position})</div>
                                </div>
                            </div>

                            <div class="widget-stats-grid">
                                <div class="stat-pill">⚡ OVR : <strong>${state.player.overall}</strong></div>
                                <div class="stat-pill">✨ Pot : <strong>${state.player.potential}</strong></div>
                                <div class="stat-pill">🔋 Forme : <strong>${state.player.fitness}%</strong></div>
                                <div class="stat-pill">❤️ Moral : <strong>${state.player.morale}%</strong></div>
                                <div class="stat-pill">💰 <strong>${state.career.balance} €</strong></div>
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
                                ${state.media.recentDilemma ? '<span class="notification-badge">1</span>' : ''}
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
        const state = this.engine.state;
        const socialState = state.social || { romance: { unlocked: false }, relationships: [] };
        const mediaState = state.media || { followers: 0, hypeLevel: 0, feed: [], recentDilemma: null };
        const history = state.career.seasonHistory || [];

        switch(this.activeApp) {
            case 'career':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title career-color">⚽ Gestion Carrière</h3>
                        <p><strong>Club :</strong> ${state.player.club}</p>
                        <p><strong>Poste :</strong> ${state.player.position} | <strong>Âge :</strong> ${state.player.age} ans</p>
                        <p><strong>Saison :</strong> ${state.calendar.currentSeasonYear}/${state.calendar.currentSeasonYear + 1}</p>
                        <p><strong>Période :</strong> ${state.calendar.currentPeriod}</p>
                        <hr class="pane-divider">
                        <p><strong>Forme physique :</strong> ${state.player.fitness}%</p>
                        <p><strong>Moral :</strong> ${state.player.morale}%</p>
                    </div>
                `;
            case 'social':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title social-color">📱 Instafoot & Médias</h3>
                        <div class="social-stats-row">
                            <span>👥 Abonnés : <strong>${mediaState.followers.toLocaleString()}</strong></span>
                            <span>🔥 Hype : <strong>${mediaState.hypeLevel}/100</strong></span>
                        </div>

                        ${mediaState.recentDilemma ? `
                            <div class="dilemma-box">
                                <h4 class="dilemma-title">${mediaState.recentDilemma.title}</h4>
                                <p class="dilemma-desc">${mediaState.recentDilemma.description}</p>
                                <div class="dilemma-choices">
                                    ${mediaState.recentDilemma.choices.map((choice, idx) => `
                                        <button class="btn-dilemma" data-choice-idx="${idx}">
                                            👉 ${choice.text}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="feed-list">
                            ${mediaState.feed.map(post => `
                                <div class="feed-item">
                                    <div class="feed-item-header">
                                        <span>📢 ${post.source}</span>
                                        <span>${post.date}</span>
                                    </div>
                                    <p class="feed-item-content">${post.content}</p>
                                    <div class="feed-item-footer">
                                        <span>❤️ ${post.likes}</span>
                                        <span>💬 ${post.commentsCount}</span>
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
                        <p><strong>Situation amoureuse :</strong> ${socialState.romance.unlocked ? (socialState.romance.partnerName ? `${socialState.romance.partnerName} (${socialState.romance.status} - ${socialState.romance.affection}%)` : 'Célibataire') : '🔒 Disponible à 18 ans'}</p>
                        <hr class="pane-divider">
                        <p class="relations-subtitle">Relations clés :</p>
                        <ul class="relations-list">
                            ${socialState.relationships.map(rel => `<li>${rel.role} (${rel.name}) : ${rel.score}/100 [${rel.status}]</li>`).join('')}
                        </ul>
                    </div>
                `;
            case 'bank':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title bank-color">🏦 Banque & Finances</h3>
                        <div class="bank-card-balance">
                            <span class="balance-label">Solde actuel</span>
                            <div class="balance-amount">${state.career.balance} €</div>
                        </div>
                        <p class="bank-info-text">Revenus hebdomadaires basés sur ton contrat en cours avec ${state.player.club}.</p>
                    </div>
                `;
            case 'stats':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title stats-color">📊 Statistiques de Saison</h3>
                        <p><strong>Club actuel :</strong> ${state.player.club}</p>
                        <p><strong>Matchs joués :</strong> ${state.player.stats.matchesPlayed}</p>
                        <p><strong>Buts :</strong> ${state.player.stats.goals}</p>
                        <p><strong>Passes décisives :</strong> ${state.player.stats.assists}</p>
                        <p><strong>Note moyenne :</strong> ${state.player.stats.averageRating}</p>
                        <p><strong>Note globale (OVR) :</strong> ${state.player.overall}</p>

                        <hr class="pane-divider-large">
                        <h4 class="history-section-title">📁 Historique des Saisons</h4>
                        ${history.length === 0 ? '<p class="empty-history">Aucune saison archivée pour l\'instant.</p>' : `
                            <div class="history-list">
                                ${history.map(season => `
                                    <div class="history-item">
                                        <div class="history-item-title">Saison ${season.seasonLabel} — ${season.club}</div>
                                        <div class="history-item-sub">Âge : ${season.age} | OVR : ${season.overall}</div>
                                        <div class="history-item-details">
                                            Matchs : ${season.stats.matchesPlayed} | Buts : ${season.stats.goals} | Passes : ${season.stats.assists} | Note : ${season.stats.averageRating}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                `;
            case 'training':
                return `
                    <div class="app-pane">
                        <h3 class="pane-title training-color">🏋️‍♂️ Centre d'Entraînement</h3>
                        <p class="subtitle">Choisis ton axe de travail pour le prochain bloc mensuel :</p>
                        <div class="grid-focus">
                            ${Object.entries(TrainingManager.FOCUS_TYPES).map(([key, focusObj]) => `
                                <div class="card-select training-card ${state.trainingFocus === key ? 'selected' : ''}" data-focus-key="${key}">
                                    <h4>${focusObj.name}</h4>
                                    <p>${focusObj.description}</p>
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
                const state = this.engine.state;

                // Vérification si le joueur est blessé
                if (state && state.player && state.player.isInjured) {
                    const weeksLeft = state.player.injuryDuration || 1;
                    
                    const wantSimulate = confirm(`⚠️ Impossible de jouer, votre joueur est blessé pour encore ${weeksLeft} bloc(s).\n\nVoulez-vous simuler automatiquement jusqu'à votre guérison ?`);
                    
                    if (wantSimulate) {
                        while (state.player.isInjured && (state.player.injuryDuration > 0)) {
                            this.engine.playBlock();
                            state.player.injuryDuration--;
                            
                            if (state.player.injuryDuration <= 0) {
                                state.player.isInjured = false;
                                state.player.injuryDuration = 0;
                            }
                        }
                        alert("🎉 Votre joueur est totalement guéri et de retour sur les terrains !");
                        this.renderDashboard();
                    }
                    return;
                }

                // Détermination du type de match (ex: Fin de saison en mai = finale, ou aléatoire/rival)
                const isFinalPeriod = state.calendar.currentMonth === 5; 
                const matchType = isFinalPeriod ? 'final' : (Math.random() < 0.25 ? 'rival' : 'standard');
                
                // Récupération du dilemme d'avant-match
                const matchDilemma = MatchChoiceManager.getMatchDilemma(matchType, "l'adversaire direct");

                // Affichage de la modale de choix tactique avant de simuler le bloc
                this.afficherModaleMatchDilemma(matchDilemma, (selectedChoice) => {
                    // Une fois le choix fait, on lance le bloc en passant le bonus choisi
                    this.engine.playBlock(selectedChoice);

                    const eventActuel = EventEngine.checkTriggers ? EventEngine.checkTriggers() : null;
                    if (eventActuel) {
                        this.afficherModaleEvenement(eventActuel);
                    } else {
                        this.renderDashboard();
                    }
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
                this.engine.resolveMediaDilemma(choiceIdx);
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
                // Synchronisation immédiate avec le GameEngine
                if (typeof this.engine.setTrainingFocus === 'function') {
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
                <span class="event-modal-category">⚡ CONSIGNE TACTIQUE & MATCH CLÉ</span>
                <h3 class="event-modal-title">${dilemma.title}</h3>
                <p class="event-modal-desc">${dilemma.description}</p>
                
                <div class="event-modal-choices">
                    ${dilemma.choices.map((choix, index) => `
                        <button class="btn-event-choice" data-choice-index="${index}">
                            👉 ${choix.texte}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelectorAll('.btn-event-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.currentTarget.getAttribute('data-choice-index'), 10);
                const choixSelectionne = dilemma.choices[choiceIndex];

                // Appliquer les impacts directs (ex: moral, physique, etc.)
                if (choixSelectionne.impacts) {
                    this.appliquerImpactsChoix(choixSelectionne.impacts);
                }

                modal.remove();
                
                // Exécuter le callback avec les bonus du match
                if (typeof onChoiceMade === 'function') {
                    onChoiceMade(choixSelectionne);
                }
            });
        });
    }

    afficherModaleEvenement(event) {
        let modal = document.getElementById('event-modal-container');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.className = 'event-modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">${event.categorie}</span>
                <h3 class="event-modal-title">${event.titre}</h3>
                <p class="event-modal-desc">${event.description}</p>
                
                <div class="event-modal-choices">
                    ${event.choix.map((choix, index) => `
                        <button class="btn-event-choice" data-choice-index="${index}">
                            👉 ${choix.texte}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelectorAll('.btn-event-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.currentTarget.getAttribute('data-choice-index'), 10);
                const choixSelectionne = event.choix[choiceIndex];

                this.appliquerImpactsChoix(choixSelectionne.impacts);

                modal.remove();
                this.renderDashboard();
            });
        });
    }

    appliquerImpactsChoix(impacts) {
        const state = this.engine.state;
        if (!state) return;

        for (const [stat, valeur] of Object.entries(impacts)) {
            if (state.player && state.player[stat] !== undefined) {
                state.player[stat] += valeur;
            } else if (state.career && state.career[stat] !== undefined) {
                state.career[stat] += valeur;
            } else {
                console.warn(`Statistique "${stat}" non trouvée dans le state.`);
            }
        }
    }
}

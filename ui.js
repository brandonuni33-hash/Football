// ui.js
import { POSITIONS, CONTINENTS, ORIGINS, HEART_CLUBS, YOUTH_CLUBS_POOL, COACH_VISIONS, COACH_NAMES } from './constants.js';
import { EventEngine } from './events.js';

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentStep = 1;
        this.activeApp = 'home'; // Gère l'application ouverte dans le smartphone ('home', 'career', 'social', 'messages', 'bank', 'stats')
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
                        <label>Prénom :</label>
                        <input type="text" id="firstname" value="${this.selectedData.firstname}" placeholder="ex: Kylian">
                    </div>
                    <div class="form-group">
                        <label>Nom :</label>
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
                                    else if (id === 'DC' || id === 'CB') coords = { top: '70%', left: '50%' };
                                    else if (id === 'DD' || id === 'RB') coords = { top: '65%', left: '85%' };
                                    else if (id === 'DG' || id === 'LB') coords = { top: '65%', left: '15%' };
                                    else if (id === 'MDC' || id === 'CDM') coords = { top: '50%', left: '50%' };
                                    else if (id === 'MC' || id === 'CM') coords = { top: '40%', left: '50%' };
                                    else if (id === 'MO' || id === 'CAM') coords = { top: '28%', left: '50%' };
                                    else if (id === 'AD' || id === 'RW') coords = { top: '22%', left: '80%' };
                                    else if (id === 'AG' || id === 'LW') coords = { top: '22%', left: '20%' };
                                    else if (id === 'BU' || id === 'ST') coords = { top: '12%', left: '50%' };

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
                    <div class="origin-description-box" style="margin-top: 15px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px; min-height: 50px;">
                        ${selectedOriginObj ? `<p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">📖 ${selectedOriginObj.desc}</p>` : `<p style="margin: 0; font-size: 13px; color: #6b7280; font-style: italic;">👉 Clique sur une origine pour découvrir son histoire et son impact sur ton jeu.</p>`}
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
                        <label>Club de cœur :</label>
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
                            salary: salary,
                            playtime: playtime,
                            targetRating: targetRating
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
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }
        if (lastnameInput) {
            lastnameInput.addEventListener('input', (e) => {
                this.selectedData.lastname = e.target.value.trim();
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }

        document.querySelectorAll('.proclubs-node').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.proclubs-node').forEach(b => b.classList.remove('selected'));
                const targetBtn = e.currentTarget;
                targetBtn.classList.add('selected');
                this.selectedData.position = targetBtn.getAttribute('data-pos');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
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
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        const heartSelect = document.getElementById('heart-club-select');
        if (heartSelect) {
            heartSelect.addEventListener('change', (e) => {
                this.selectedData.heartClub = e.target.value;
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
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

                if(startBtn) startBtn.disabled = !this.isStepValid();
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
                        <div style="background: rgba(255,255,255,0.05); padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
                            <div style="font-size: 13px; color: #94a3b8;">📅 Saison ${state.calendar.currentSeasonYear}/${state.calendar.currentSeasonYear + 1} — ${state.calendar.currentPeriod}</div>
                            <div style="font-size: 16px; font-weight: bold; color: white; margin-top: 2px;">⭐ ${state.player.firstname} ${state.player.lastname} (${state.player.club})</div>
                            <div style="font-size: 12px; color: #34d399; margin-top: 4px;">OVR : ${state.player.overall} | 💰 ${state.career.balance} €</div>
                        </div>

                        <div class="apps-grid">
                            <button class="app-icon" data-app="career">
                                <div class="app-logo" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">⚽</div>
                                <span class="app-label">Carrière</span>
                            </button>

                            <button class="app-icon" data-app="social">
                                <div class="app-logo" style="background: linear-gradient(135deg, #ec4899, #be185d);">📱</div>
                                <span class="app-label">Instafoot</span>
                                ${state.media.recentDilemma ? '<span class="notification-badge">1</span>' : ''}
                            </button>

                            <button class="app-icon" data-app="messages">
                                <div class="app-logo" style="background: linear-gradient(135deg, #10b981, #047857);">💬</div>
                                <span class="app-label">Messages</span>
                            </button>

                            <button class="app-icon" data-app="bank">
                                <div class="app-logo" style="background: linear-gradient(135deg, #f59e0b, #b45309);">🏦</div>
                                <span class="app-label">Banque</span>
                            </button>

                            <button class="app-icon" data-app="stats">
                                <div class="app-logo" style="background: linear-gradient(135deg, #8b5cf6, #6d28d9);">📊</div>
                                <span class="app-label">Stats</span>
                            </button>
                        </div>

                        <button id="play-block-btn" style="background: #22c55e; color: white; border: none; padding: 14px; border-radius: 14px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 4px 12px rgba(34,197,94,0.3);">
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
                            <span style="font-weight: bold; color: white; text-transform: uppercase; font-size: 13px;">${this.activeApp}</span>
                            <span></span>
                        </div>
                        <div id="app-content-body" style="flex: 1; overflow-y: auto;">
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
                    <div style="color: white; font-size: 0.9rem;">
                        <h3 style="margin-top: 0; color: #60a5fa;">⚽ Gestion Carrière</h3>
                        <p><strong>Club :</strong> ${state.player.club}</p>
                        <p><strong>Poste :</strong> ${state.player.position} | <strong>Âge :</strong> ${state.player.age} ans</p>
                        <p><strong>Saison :</strong> ${state.calendar.currentSeasonYear}/${state.calendar.currentSeasonYear + 1}</p>
                        <p><strong>Période :</strong> ${state.calendar.currentPeriod}</p>
                        <hr style="border-color: #374151;">
                        <p><strong>Forme physique :</strong> ${state.player.fitness}%</p>
                        <p><strong>Moral :</strong> ${state.player.morale}%</p>
                    </div>
                `;
            case 'social':
                return `
                    <div style="color: white; font-size: 0.9rem;">
                        <h3 style="margin-top: 0; color: #f472b6;">📱 Instafoot & Médias</h3>
                        <div style="display: flex; gap: 15px; margin-bottom: 12px; font-size: 0.85rem;">
                            <span>👥 Abonnés : <strong>${mediaState.followers.toLocaleString()}</strong></span>
                            <span>🔥 Hype : <strong>${mediaState.hypeLevel}/100</strong></span>
                        </div>

                        ${mediaState.recentDilemma ? `
                            <div style="background: rgba(59, 130, 246, 0.15); border: 1px solid #3b82f6; padding: 10px; border-radius: 6px; margin-bottom: 12px;">
                                <h4 style="margin: 0 0 6px 0; color: #60a5fa; font-size: 0.95rem;">${mediaState.recentDilemma.title}</h4>
                                <p style="font-size: 0.85rem; margin: 0 0 8px 0;">${mediaState.recentDilemma.description}</p>
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    ${mediaState.recentDilemma.choices.map((choice, idx) => `
                                        <button class="btn-dilemma" data-choice-idx="${idx}" style="background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; text-align: left; font-size: 0.8rem;">
                                            👉 ${choice.text}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${mediaState.feed.map(post => `
                                <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                                    <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 0.7rem; margin-bottom: 2px;">
                                        <span>📢 ${post.source}</span>
                                        <span>${post.date}</span>
                                    </div>
                                    <p style="margin: 0; color: #e2e8f0;">${post.content}</p>
                                    <div style="display: flex; gap: 10px; margin-top: 4px; color: #94a3b8; font-size: 0.7rem;">
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
                    <div style="color: white; font-size: 0.9rem;">
                        <h3 style="margin-top: 0; color: #34d399;">💬 Messages & Vestiaire</h3>
                        <p><strong>Situation amoureuse :</strong> ${socialState.romance.unlocked ? (socialState.romance.partnerName ? `${socialState.romance.partnerName} (${socialState.romance.status} - ${socialState.romance.affection}%)` : 'Célibataire') : '🔒 Disponible à 18 ans'}</p>
                        <hr style="border-color: #374151;">
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 6px;">Relations clés :</p>
                        <ul style="padding-left: 15px; margin: 0; font-size: 0.85rem; color: #cbd5e1;">
                            ${socialState.relationships.map(rel => `<li>${rel.role} (${rel.name}) : ${rel.score}/100 [${rel.status}]</li>`).join('')}
                        </ul>
                    </div>
                `;
            case 'bank':
                return `
                    <div style="color: white; font-size: 0.9rem;">
                        <h3 style="margin-top: 0; color: #fbbf24;">🏦 Banque & Finances</h3>
                        <div style="background: rgba(255,255,255,0.04); padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
                            <span style="font-size: 12px; color: #94a3b8;">Solde actuel</span>
                            <div style="font-size: 22px; font-weight: bold; color: #34d399; margin-top: 4px;">${state.career.balance} €</div>
                        </div>
                        <p style="font-size: 0.85rem; color: #94a3b8;">Revenus hebdomadaires basés sur ton contrat en cours avec ${state.player.club}.</p>
                    </div>
                `;
            case 'stats':
                return `
                    <div style="color: white; font-size: 0.9rem;">
                        <h3 style="margin-top: 0; color: #a78bfa;">📊 Statistiques de Saison</h3>
                        <p><strong>Club actuel :</strong> ${state.player.club}</p>
                        <p><strong>Matchs joués :</strong> ${state.player.stats.matchesPlayed}</p>
                        <p><strong>Buts :</strong> ${state.player.stats.goals}</p>
                        <p><strong>Passes décisives :</strong> ${state.player.stats.assists}</p>
                        <p><strong>Note moyenne :</strong> ${state.player.stats.averageRating}</p>
                        <p><strong>Note globale (OVR) :</strong> ${state.player.overall}</p>

                        <hr style="border-color: #374151; margin: 15px 0;">
                        <h4 style="color: #a78bfa; margin-bottom: 8px;">📁 Historique des Saisons</h4>
                        ${history.length === 0 ? '<p style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">Aucune saison archivée pour l\'instant.</p>' : `
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${history.map(season => `
                                    <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 8px; border-radius: 6px; font-size: 0.8rem;">
                                        <div style="font-weight: bold; color: #60a5fa; margin-bottom: 2px;">Saison ${season.seasonLabel} — ${season.club}</div>
                                        <div style="color: #cbd5e1;">Âge : ${season.age} | OVR : ${season.overall}</div>
                                        <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 4px;">
                                            Matchs : ${season.stats.matchesPlayed} | Buts : ${season.stats.goals} | Passes : ${season.stats.assists} | Note : ${season.stats.averageRating}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                `;
            default:
                return `<p style="color: white;">Application en cours de développement...</p>`;
        }
    }

    bindDashboardEvents() {
        const playBtn = document.getElementById('play-block-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                // 1. Avancer dans le jeu
                this.engine.playBlock();

                // 2. Vérifier si un événement se déclenche via l'EventEngine
                const eventActuel = EventEngine.checkTriggers();
                
                if (eventActuel) {
                    this.afficherModaleEvenement(eventActuel);
                } else {
                    this.renderDashboard();
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
                const choiceIdx = parseInt(e.currentTarget.getAttribute('data-choice-idx'));
                this.engine.resolveMediaDilemma(choiceIdx);
                this.renderDashboard();
            });
        });
    }

    afficherModaleEvenement(event) {
        let modal = document.getElementById('event-modal-container');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center;
                align-items: center; z-index: 9999;
            `;
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px; width: 90%; max-width: 400px; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <span style="font-size: 11px; text-transform: uppercase; background: #3b82f6; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${event.categorie}</span>
                <h3 style="margin: 10px 0 5px 0; font-size: 18px; color: #f8fafc;">${event.titre}</h3>
                <p style="font-size: 13px; color: #94a3b8; line-height: 1.4; margin-bottom: 20px;">${event.description}</p>
                
                <div style="display: flex; flex-direction: column; gap: 10px;" id="event-choices-container">
                    ${event.choix.map((choix, index) => `
                        <button class="btn-event-choice" data-choice-index="${index}" style="background: #334155; color: white; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; cursor: pointer; text-align: left; font-size: 13px; transition: background 0.2s;">
                            👉 ${choix.texte}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        modal.querySelectorAll('.btn-event-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const choiceIndex = parseInt(e.currentTarget.getAttribute('data-choice-index'));
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

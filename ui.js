// ui.js
import { POSITIONS, CONTINENTS, ORIGINS, HEART_CLUBS, YOUTH_CLUBS_POOL, COACH_VISIONS, COACH_NAMES } from './constants.js';

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentStep = 1;
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
        this.randomYouthClubs = []; // Stocke les offres détaillées tirées au sort pour cette partie
        
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
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="career-container">
                <header class="career-header">
                    <h1>⚽ Mode Carrière</h1>
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
                        <label>Poste :</label>
                        <div class="grid-positions">
                            ${POSITIONS.map(p => `
                                <button class="chip ${this.selectedData.position === p.id ? 'selected' : ''}" data-pos="${p.id}">${p.name}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <h2>Étape 2 : Origine</h2>
                    <p class="subtitle">Comment avez-vous façonné votre jeu ?</p>
                    <div class="grid-origins">
                        ${Object.values(ORIGINS).map(o => {
                            let emoji = '⚡';
                            const traitLower = o.trait ? o.trait.toLowerCase() : '';
                            if (traitLower.includes('technique') || traitLower.includes('dribble')) emoji = '✨';
                            else if (traitLower.includes('physique') || traitLower.includes('force')) emoji = '💪';
                            else if (traitLower.includes('mental') || traitLower.includes('leader')) emoji = '🧠';
                            else if (traitLower.includes('vitesse') || traitLower.includes('rapide')) emoji = '🏃‍♂️';

                            return `
                                <div class="card-select ${this.selectedData.origin === o.id ? 'selected' : ''}" data-origin="${o.id}">
                                    <h3>${o.name}</h3>
                                    <div class="trait-badge">${emoji} ${o.trait}</div>
                                    <p>${o.desc}</p>
                                </div>
                            `;
                        }).join('')}
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
                    const count = Math.floor(Math.random() * 3) + 4; // Entre 4 et 6 clubs
                    
                    this.randomYouthClubs = shuffled.slice(0, count).map(yc => {
                        const randomVision = COACH_VISIONS[Math.floor(Math.random() * COACH_VISIONS.length)];
                        const randomCoachName = COACH_NAMES[Math.floor(Math.random() * COACH_NAMES.length)];
                        
                        const salary = Math.round((yc.prestige * 150) + (Math.random() * 500));
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

        document.querySelectorAll('.chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedData.position = e.target.getAttribute('data-pos');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        document.querySelectorAll('.grid-origins .card-select').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.grid-origins .card-select').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedData.origin = card.getAttribute('data-origin');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
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
                } else {
                    console.error("La méthode startCareer n'existe pas dans le moteur.");
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
}

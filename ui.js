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
        
        this.initDOM();
        this.bindEvents();
    }

    initDOM() {
        // Conteneur principal injecté dynamiquement si absent
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
                    <h1>⚽ Mode Carrière - Création de Profil</h1>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(this.currentStep / 5) * 100}%"></div>
                    </div>
                </header>
                <main class="career-content">
                    ${this.renderStepContent()}
                </main>
                <footer class="career-footer">
                    ${this.currentStep > 1 ? '<button id="prev-btn" class="btn-secondary">Précédent</button>' : ''}
                    ${this.currentStep < 5 ? '<button id="next-btn" class="btn-primary" disabled>Suivant</button>' : '<button id="start-btn" class="btn-success" disabled>Lancer la Carrière</button>'}
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
                        <label>Poste de prédilection :</label>
                        <div class="grid-positions">
                            ${POSITIONS.map(p => `
                                <button class="chip ${this.selectedData.position === p.id ? 'selected' : ''}" data-pos="${p.id}">${p.name}</button>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 2:
                return `
                    <h2>Étape 2 : Origine & Contexte de Formation</h2>
                    <p class="subtitle">Comment avez-vous façonné votre jeu avant d'intégrer le circuit ?</p>
                    <div class="grid-origins">
                        ${Object.values(ORIGINS.origins || ORIGINS).map(o => `
                            <div class="card-select ${this.selectedData.origin === o.id ? 'selected' : ''}" data-origin="${o.id}">
                                <h3>${o.name} <span class="trait-badge">${o.trait}</span></h3>
                                <p>${o.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            case 3:
                return `
                    <h2>Étape 3 : Zone Géographique & Pays</h2>
                    <p class="subtitle">Sélectionnez votre continent d'origine ou d'implantation :</p>
                    <div class="grid-continents">
                        ${Object.keys(CONTINENTS).map(continent => `
                            <button class="chip-continent ${this.selectedData.continent === continent ? 'selected' : ''}" data-continent="${continent}">${continent}</button>
                        `).join('')}
                    </div>
                    ${this.selectedData.continent ? `
                        <h3>Choisissez votre pays :</h3>
                        <div class="grid-countries">
                            ${CONTINENTS[this.selectedData.continent].map(c => `
                                <button class="chip-country ${this.selectedData.country === c.name ? 'selected' : ''}" data-country="${c.name}">${c.flag} ${c.name}</button>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
            case 4:
                return `
                    <h2>Étape 4 : Club de Cœur & Mentor</h2>
                    <div class="form-group">
                        <label>Votre club de cœur (Inspiration) :</label>
                        <select id="heart-club-select">
                            <option value="">-- Sélectionnez un championnat puis un club --</option>
                            ${Object.entries(HEART_CLUBS).map(([league, clubs]) => `
                                <optgroup label="${league}">
                                    ${clubs.map(c => `<option value="${c.name}" ${this.selectedData.heartClub === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </optgroup>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Profil du Coach formateur initial :</label>
                        <div class="grid-visions">
                            ${COACH_VISIONS.map(cv => `
                                <div class="card-select ${this.selectedData.coachVision === cv.title ? 'selected' : ''}" data-vision="${cv.title}">
                                    <h4>${cv.title}</h4>
                                    <p>${cv.desc}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            case 5:
                return `
                    <h2>Étape 5 : Point de Chute Initial (Tremplin ou Élite)</h2>
                    <p class="subtitle">Choisissez où débuter votre aventure professionnelle ou votre pré-formation :</p>
                    <div class="grid-youth-clubs">
                        ${YOUTH_CLUBS_POOL.map(yc => `
                            <div class="card-select club-card ${this.selectedData.youthClub?.name === yc.name ? 'selected' : ''}" data-club-name="${yc.name}">
                                <div class="club-info">
                                    <h4>${yc.name}</h4>
                                    <span class="league-tag">${yc.league} (${yc.country})</span>
                                </div>
                                <div class="prestige-badge">Prestige : ${yc.prestige}</div>
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

        // Validation dynamique des boutons
        if (nextBtn) nextBtn.disabled = !this.isStepValid();
        if (startBtn) startBtn.disabled = !this.isStepValid();

        // Inputs textuels (Étape 1)
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

        // Boutons positions (Étape 1)
        document.querySelectorAll('.chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chip').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedData.position = e.target.getAttribute('data-pos');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        // Origines (Étape 2)
        document.querySelectorAll('.grid-origins .card-select').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.grid-origins .card-select').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedData.origin = card.getAttribute('data-origin');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        // Continents (Étape 3)
        document.querySelectorAll('.chip-continent').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedData.continent = e.target.getAttribute('data-continent');
                this.selectedData.country = null; // Reset country
                this.render();
            });
        });

        // Pays (Étape 3)
        document.querySelectorAll('.chip-country').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chip-country').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedData.country = e.target.getAttribute('data-country');
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        // Heart Club (Étape 4)
        const heartSelect = document.getElementById('heart-club-select');
        if (heartSelect) {
            heartSelect.addEventListener('change', (e) => {
                this.selectedData.heartClub = e.target.value;
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        }

        // Coach Vision (Étape 4)
        document.querySelectorAll('.grid-visions .card-select').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.grid-visions .card-select').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedData.coachVision = card.getAttribute('data-vision');
                // Assigner un nom aléatoire de coach
                this.selectedData.coachName = COACH_NAMES[Math.floor(Math.random() * COACH_NAMES.length)];
                if(nextBtn) nextBtn.disabled = !this.isStepValid();
            });
        });

        // Youth Clubs / Régionaux (Étape 5)
        document.querySelectorAll('.grid-youth-clubs .card-select').forEach(card => {
            card.addEventListener('click', (e) => {
                document.querySelectorAll('.grid-youth-clubs .card-select').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                const clubName = card.getAttribute('data-club-name');
                this.selectedData.youthClub = YOUTH_CLUBS_POOL.find(yc => yc.name === clubName);
                if(startBtn) startBtn.disabled = !this.isStepValid();
            });
        });

        // Navigation boutons bas de page
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
                this.engine.startCareer(this.selectedData);
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
                return this.selectedData.heartClub !== null && this.selectedData.heartClub !== '' && 
                       this.selectedData.coachVision !== null;
            case 5:
                return this.selectedData.youthClub !== null;
            default:
                return false;
        }
    }

    bindEvents() {
        // Global events if necessary
    }
}

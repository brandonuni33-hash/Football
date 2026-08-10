// ui.js
// Street to Pro — UI v3 SAFE
// Remplacement complet de l'interface.
// Objectifs :
// - éviter les écrans noirs lors du lancement d'une carrière
// - conserver les systèmes existants du moteur
// - identité : drapeau + prénom nom + âge, sans étoiles / H H / solde
// - offres : drapeau du pays du club
// - dashboard : matchs, note moyenne, buts, passes D
// - calendrier / compétitions / coupes / international visibles
// - entraînement, mercato, coach, événements et statistiques accessibles
//
// IMPORTANT : cette UI ne réécrit jamais le state du moteur pendant un render.
// Les appels moteur sont protégés par try/catch afin qu'une erreur affiche un
// message dans l'interface au lieu de vider l'écran.

import { CompetitionSystem } from './competitionSystem.js';
import {
    POSITIONS as _POSITIONS,
    CONTINENTS as _CONTINENTS,
    ORIGINS as _ORIGINS,
    HEART_CLUBS as _HEART_CLUBS,
    YOUTH_CLUBS_POOL as _YOUTH_CLUBS_POOL,
    COACH_VISIONS as _COACH_VISIONS,
    COACH_NAMES as _COACH_NAMES
} from './constants.js';
import { TrainingManager as _TrainingManager } from './entrainement.js';
import { CareerSystem as _CareerSystem } from './careerSystem.js';
import { CoachSystem as _CoachSystem } from './coachSystem.js';
import { TransferMarket as _TransferMarket } from './transferMarket.js';

const POSITIONS = Array.isArray(_POSITIONS) ? _POSITIONS : Object.values(_POSITIONS || {});
const CONTINENTS = _CONTINENTS || {};
const ORIGINS = _ORIGINS || {};
const HEART_CLUBS = _HEART_CLUBS || {};
const YOUTH_CLUBS_POOL = Array.isArray(_YOUTH_CLUBS_POOL)
    ? _YOUTH_CLUBS_POOL
    : Object.values(_YOUTH_CLUBS_POOL || {});
const COACH_VISIONS = Array.isArray(_COACH_VISIONS)
    ? _COACH_VISIONS
    : Object.values(_COACH_VISIONS || {});
const COACH_NAMES = Array.isArray(_COACH_NAMES)
    ? _COACH_NAMES
    : Object.values(_COACH_NAMES || {});

const TrainingManager = _TrainingManager || { FOCUS_TYPES: {} };
const CareerSystem = _CareerSystem || {};
const CoachSystem = _CoachSystem || {};
const TransferMarket = _TransferMarket || {};

const FLAGS = {
    France: '🇫🇷',
    Angleterre: '🇬🇧',
    Espagne: '🇪🇸',
    Italie: '🇮🇹',
    Allemagne: '🇩🇪',
    Portugal: '🇵🇹',
    Belgique: '🇧🇪',
    'Pays-Bas': '🇳🇱',
    Suisse: '🇨🇭',
    Autriche: '🇦🇹',
    Brésil: '🇧🇷',
    Argentine: '🇦🇷',
    Uruguay: '🇺🇾',
    Colombie: '🇨🇴',
    Mexique: '🇲🇽',
    Japon: '🇯🇵',
    'Corée du Sud': '🇰🇷',
    Sénégal: '🇸🇳',
    Maroc: '🇲🇦',
    Algérie: '🇩🇿',
    Tunisie: '🇹🇳',
    Cameroun: '🇨🇲',
    Ghana: '🇬🇭',
    Nigeria: '🇳🇬',
    'Côte d’Ivoire': '🇨🇮',
    "Côte d'Ivoire": '🇨🇮',
    Canada: '🇨🇦',
    'États-Unis': '🇺🇸'
};

const escapeHTML = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const flagFor = (country) => FLAGS[country] || '🌍';

const getPlayerName = (player) =>
    `${player?.firstname || player?.firstName || ''} ${player?.lastname || player?.lastName || ''}`.trim() || 'Joueur';

function safeCall(fn, fallback = null) {
    try {
        return typeof fn === 'function' ? fn() : fallback;
    } catch (error) {
        console.error('[UI] appel protégé en erreur:', error);
        return fallback;
    }
}

export class UserInterface {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.currentStep = 1;
        this.activeApp = 'home';
        this.notice = null;
        this.rendering = false;
        this.launching = false;
        this.randomYouthClubs = [];
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
        this.injectStyles();
    }

    init() {
        this.render();
    }

    initDOM() {
        let app = document.getElementById('app');
        if (!app) {
            app = document.createElement('div');
            app.id = 'app';
            document.body?.appendChild(app);
        }
        window.UI = this;
        return app;
    }

    injectStyles() {
        if (document.getElementById('stp-ui-v3-styles')) return;

        const style = document.createElement('style');
        style.id = 'stp-ui-v3-styles';
        style.textContent = `
            :root {
                --stp-bg: #070b16;
                --stp-card: rgba(17, 24, 39, .94);
                --stp-card-2: rgba(24, 33, 52, .96);
                --stp-line: rgba(148, 163, 184, .20);
                --stp-text: #f8fafc;
                --stp-muted: #94a3b8;
                --stp-green: #10b981;
                --stp-green-2: #059669;
                --stp-blue: #3b82f6;
                --stp-gold: #f5b942;
                --stp-red: #ef4444;
            }

            * { box-sizing: border-box; }
            html, body {
                margin: 0;
                min-height: 100%;
                background: var(--stp-bg);
                color: var(--stp-text);
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
            }
            body { overflow-x: hidden; }
            button, input, select { font: inherit; }
            button { -webkit-tap-highlight-color: transparent; }

            .stp-shell {
                min-height: 100dvh;
                width: 100%;
                max-width: 520px;
                margin: 0 auto;
                background:
                    radial-gradient(circle at 20% 0%, rgba(59,130,246,.15), transparent 35%),
                    radial-gradient(circle at 100% 50%, rgba(16,185,129,.10), transparent 35%),
                    var(--stp-bg);
            }

            .stp-topbar {
                position: sticky;
                top: 0;
                z-index: 30;
                display:flex;
                justify-content:space-between;
                align-items:center;
                min-height:58px;
                padding: max(10px, env(safe-area-inset-top)) 16px 10px;
                background: rgba(7,11,22,.88);
                border-bottom:1px solid var(--stp-line);
                backdrop-filter: blur(18px);
            }

            .stp-brand { font-weight:900; letter-spacing:-.02em; }
            .stp-brand small { display:block; color:var(--stp-muted); font-weight:600; font-size:.68rem; }
            .stp-top-value { color:#a7f3d0; font-weight:800; font-size:.82rem; }

            .stp-content {
                padding:16px;
                padding-bottom: calc(30px + env(safe-area-inset-bottom));
            }

            .stp-card {
                background: linear-gradient(145deg, var(--stp-card), rgba(10,15,28,.96));
                border:1px solid var(--stp-line);
                border-radius:24px;
                padding:16px;
                box-shadow:0 18px 40px rgba(0,0,0,.28);
                margin-bottom:14px;
            }

            .stp-title { margin:0 0 6px; font-size:1.45rem; font-weight:900; }
            .stp-subtitle { margin:0 0 16px; color:var(--stp-muted); line-height:1.45; }
            .stp-section-title { margin:20px 0 10px; font-size:1rem; font-weight:900; }

            .stp-player-head { display:flex; gap:14px; align-items:center; }
            .stp-number {
                width:58px; height:58px; border-radius:18px;
                display:flex; align-items:center; justify-content:center;
                background:linear-gradient(145deg,#2563eb,#1d4ed8);
                font-size:1.45rem; font-weight:950;
                flex:none;
            }
            .stp-player-name { font-size:1.25rem; font-weight:900; line-height:1.15; }
            .stp-player-meta { color:#cbd5e1; margin-top:5px; font-size:.86rem; }
            .stp-flag { font-size:1.1em; margin-right:5px; }

            .stp-metrics {
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:8px;
                margin-top:15px;
            }
            .stp-metric {
                border:1px solid rgba(255,255,255,.09);
                background:rgba(255,255,255,.045);
                border-radius:14px;
                padding:11px;
            }
            .stp-metric span { display:block; color:var(--stp-muted); font-size:.68rem; font-weight:700; }
            .stp-metric strong { display:block; margin-top:3px; font-size:1.05rem; }

            .stp-season-stats {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:6px;
                margin-top:10px;
            }
            .stp-season-stat {
                text-align:center;
                border-radius:12px;
                padding:9px 3px;
                background:rgba(255,255,255,.045);
                border:1px solid rgba(255,255,255,.08);
            }
            .stp-season-stat span { display:block; color:var(--stp-muted); font-size:.59rem; }
            .stp-season-stat strong { display:block; margin-top:3px; font-size:.95rem; }

            .stp-highlight {
                margin-top:12px; padding:11px 12px; border-radius:14px;
                background:rgba(16,185,129,.08);
                border:1px solid rgba(16,185,129,.18);
                color:#d1fae5; font-size:.82rem; line-height:1.4;
            }

            .stp-apps {
                display:grid;
                grid-template-columns:repeat(4,1fr);
                gap:12px;
                margin:16px 0;
            }
            .stp-app {
                border:0; background:transparent; color:#fff; text-align:center; cursor:pointer;
            }
            .stp-app-icon {
                width:64px; height:64px; margin:0 auto 6px;
                border-radius:19px; display:flex; align-items:center; justify-content:center;
                font-size:1.7rem; border:1px solid rgba(255,255,255,.14);
                box-shadow:0 10px 24px rgba(0,0,0,.35);
            }
            .stp-app-label { font-size:.72rem; font-weight:800; }

            .stp-primary, .stp-secondary, .stp-danger {
                border:0; border-radius:16px; padding:14px 16px;
                font-weight:900; cursor:pointer; width:100%;
            }
            .stp-primary { color:#fff; background:linear-gradient(135deg,var(--stp-green),var(--stp-green-2)); }
            .stp-secondary { color:#e2e8f0; background:#263247; border:1px solid var(--stp-line); }
            .stp-danger { color:#fff; background:#7f1d1d; }
            .stp-primary:disabled { opacity:.45; cursor:not-allowed; }
            .stp-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

            .stp-alert {
                padding:12px; border-radius:14px; margin-bottom:12px;
                background:rgba(239,68,68,.10); border:1px solid rgba(239,68,68,.28);
                color:#fecaca; font-size:.82rem; line-height:1.45;
            }
            .stp-success {
                background:rgba(16,185,129,.10); border-color:rgba(16,185,129,.28); color:#bbf7d0;
            }

            .stp-grid { display:grid; gap:10px; }
            .stp-grid-2 { grid-template-columns:repeat(2,1fr); }
            .stp-grid-3 { grid-template-columns:repeat(3,1fr); }

            .stp-choice, .stp-option {
                width:100%; text-align:left; color:#fff; cursor:pointer;
                border:1px solid var(--stp-line); background:rgba(255,255,255,.045);
                border-radius:16px; padding:13px;
            }
            .stp-choice.selected, .stp-option.selected {
                border-color:rgba(16,185,129,.7);
                background:rgba(16,185,129,.12);
            }

            .stp-input, .stp-select {
                width:100%; color:#fff; background:#111827;
                border:1px solid var(--stp-line); border-radius:14px;
                padding:13px; outline:none;
            }
            .stp-label { display:block; color:#cbd5e1; font-size:.78rem; font-weight:800; margin:0 0 6px; }
            .stp-field { margin-bottom:12px; }

            .stp-pitch {
                position:relative; height:330px; border-radius:24px;
                overflow:hidden;
                background:linear-gradient(180deg,#159447,#0d7a3a);
                border:2px solid rgba(255,255,255,.28);
                box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);
            }
            .stp-pitch:before, .stp-pitch:after {
                content:""; position:absolute; border:2px solid rgba(255,255,255,.6); pointer-events:none;
            }
            .stp-pitch:before { inset:10px; border-radius:12px; }
            .stp-pitch:after { left:25%; right:25%; top:50%; height:0; }
            .stp-node {
                position:absolute; transform:translate(-50%,-50%);
                width:52px; height:52px; border-radius:50%; border:2px solid #fff;
                background:#0f172a; color:#fff; font-weight:900; cursor:pointer;
                box-shadow:0 7px 16px rgba(0,0,0,.35);
            }
            .stp-node.selected { background:var(--stp-green); transform:translate(-50%,-50%) scale(1.08); }
            .stp-node small { display:block; font-size:.62rem; }

            .stp-offer {
                position:relative;
                cursor:pointer;
                border:1px solid var(--stp-line);
                background:linear-gradient(145deg,#121a2a,#0c1220);
                border-radius:20px;
                padding:15px;
            }
            .stp-offer.selected { border-color:var(--stp-green); box-shadow:0 0 0 1px rgba(16,185,129,.25); }
            .stp-offer-head { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
            .stp-offer-club { font-size:1.08rem; font-weight:900; }
            .stp-offer-country { color:#cbd5e1; font-size:.78rem; margin-top:4px; }
            .stp-offer-row { display:flex; justify-content:space-between; gap:8px; padding:9px 0; border-top:1px solid rgba(255,255,255,.07); font-size:.8rem; }
            .stp-offer-row span { color:var(--stp-muted); }
            .stp-offer-prestige { color:#fcd34d; font-weight:900; font-size:.78rem; }

            .stp-back { margin-bottom:12px; width:auto; padding:9px 12px; }
            .stp-list { display:grid; gap:8px; }
            .stp-list-item { padding:12px; border:1px solid var(--stp-line); border-radius:14px; background:rgba(255,255,255,.035); }
            .stp-list-item strong { display:block; }
            .stp-list-item span { color:var(--stp-muted); font-size:.78rem; }

            .stp-tabs { display:flex; gap:7px; overflow:auto; padding-bottom:4px; margin-bottom:12px; }
            .stp-tab { white-space:nowrap; border:1px solid var(--stp-line); background:rgba(255,255,255,.04); color:#cbd5e1; border-radius:999px; padding:8px 11px; font-size:.76rem; font-weight:800; }
            .stp-tab.active { background:rgba(59,130,246,.15); border-color:rgba(59,130,246,.45); color:#bfdbfe; }

            .stp-modal {
                position:fixed; inset:0; z-index:100;
                background:rgba(2,6,23,.88); backdrop-filter:blur(16px);
                display:flex; align-items:center; justify-content:center; padding:18px;
            }
            .stp-modal-card { width:min(430px,100%); max-height:88dvh; overflow:auto; border-radius:24px; background:#111827; border:1px solid var(--stp-line); padding:18px; }
            .stp-modal-title { margin:0 0 8px; font-size:1.2rem; font-weight:900; }
            .stp-modal-text { color:#cbd5e1; line-height:1.5; font-size:.88rem; }

            @media (max-width:390px) {
                .stp-apps { gap:7px; }
                .stp-app-icon { width:58px; height:58px; }
                .stp-season-stat span { font-size:.54rem; }
                .stp-season-stat strong { font-size:.85rem; }
            }
        `;
        document.head.appendChild(style);
    }

    render() {
        if (this.rendering) return;
        this.rendering = true;

        try {
            const app = this.initDOM();

            if (this.engine?.state?.player) {
                this.renderDashboard();
            } else {
                this.renderCreation();
            }
        } catch (error) {
            console.error('[UI] render error:', error);
            this.showFatalUI(error);
        } finally {
            this.rendering = false;
        }
    }

    showFatalUI(error) {
        const app = this.initDOM();
        app.innerHTML = `
            <div class="stp-shell">
                <div class="stp-content">
                    <div class="stp-card">
                        <h1 class="stp-title">Street to Pro</h1>
                        <div class="stp-alert">
                            L'interface a rencontré une erreur, mais le jeu n'a pas été volontairement effacé.
                        </div>
                        <p class="stp-subtitle">${escapeHTML(error?.message || 'Erreur inconnue')}</p>
                        <button class="stp-secondary" id="stp-retry">Réessayer</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('stp-retry')?.addEventListener('click', () => this.render());
    }

    renderCreation() {
        const app = this.initDOM();

        app.innerHTML = `
            <div class="stp-shell">
                <div class="stp-topbar">
                    <div class="stp-brand">⚡ Street to Pro<small>Création du joueur</small></div>
                    <div class="stp-top-value">${this.currentStep}/5</div>
                </div>

                <main class="stp-content">
                    ${this.notice ? `<div class="stp-alert stp-success">${escapeHTML(this.notice)}</div>` : ''}
                    <div class="stp-card">
                        <h1 class="stp-title">${this.creationTitle()}</h1>
                        <p class="stp-subtitle">${this.creationSubtitle()}</p>
                        ${this.renderStep()}
                    </div>

                    <div class="stp-actions">
                        ${this.currentStep > 1 ? '<button class="stp-secondary" id="stp-prev">Précédent</button>' : '<div></div>'}
                        ${this.currentStep < 5
                            ? '<button class="stp-primary" id="stp-next">Suivant</button>'
                            : '<button class="stp-primary" id="stp-launch">Lancer</button>'}
                    </div>
                </main>
            </div>
        `;

        this.bindCreation();
    }

    creationTitle() {
        return [
            'Créer ton joueur',
            'Ton origine',
            'Ton pays',
            'Ton club de cœur',
            'Choisis ton point de départ'
        ][this.currentStep - 1] || 'Créer ton joueur';
    }

    creationSubtitle() {
        return [
            'Construis ton identité et choisis ton poste.',
            'Ton histoire influence ton profil de départ.',
            'Le pays choisi devient aussi ta nationalité.',
            'Un club important pour ton histoire.',
            'Compare les offres avant de lancer ta carrière.'
        ][this.currentStep - 1] || '';
    }

    renderStep() {
        switch (this.currentStep) {
            case 1:
                return this.renderCreationStep1();
            case 2:
                return this.renderCreationStep2();
            case 3:
                return this.renderCreationStep3();
            case 4:
                return this.renderCreationStep4();
            case 5:
                return this.renderCreationStep5();
            default:
                return '';
        }
    }

    renderCreationStep1() {
        return `
            <div class="stp-field">
                <label class="stp-label">Prénom</label>
                <input class="stp-input" id="stp-firstname" value="${escapeHTML(this.selectedData.firstname)}" placeholder="Ex. Kylian">
            </div>
            <div class="stp-field">
                <label class="stp-label">Nom</label>
                <input class="stp-input" id="stp-lastname" value="${escapeHTML(this.selectedData.lastname)}" placeholder="Ex. Mbappé">
            </div>
            <div class="stp-section-title">Choisis ton poste</div>
            <div class="stp-pitch">
                ${this.renderPositionNodes()}
            </div>
        `;
    }

    renderPositionNodes() {
        const positions = POSITIONS.length ? POSITIONS : [
            { id:'GK', name:'Gardien' }, { id:'DC', name:'Défenseur' },
            { id:'MC', name:'Milieu' }, { id:'MO', name:'Milieu offensif' },
            { id:'AD', name:'Ailier droit' }, { id:'AG', name:'Ailier gauche' },
            { id:'BU', name:'Buteur' }
        ];

        const coords = {
            GK:[50,90], DC:[50,70], DD:[83,67], DG:[17,67],
            MDC:[50,55], MC:[50,43], MO:[50,30],
            AD:[78,22], AG:[22,22], BU:[50,10]
        };

        return positions.map(p => {
            const id = p?.id || p?.name;
            const [left, top] = coords[id] || [50,50];
            const selected = this.selectedData.position === id ? 'selected' : '';
            return `
                <button class="stp-node ${selected}" data-position="${escapeHTML(id)}"
                    style="left:${left}%;top:${top}%">
                    ${escapeHTML(id)}
                    <small>${escapeHTML(p?.name || id)}</small>
                </button>
            `;
        }).join('');
    }

    renderCreationStep2() {
        const origins = Object.values(ORIGINS);
        return `
            <div class="stp-grid">
                ${origins.map(origin => `
                    <button class="stp-choice ${this.selectedData.origin === origin?.id ? 'selected' : ''}"
                        data-origin="${escapeHTML(origin?.id)}">
                        <strong>${escapeHTML(origin?.name || origin?.id)}</strong>
                        <div style="color:#94a3b8;margin-top:4px;font-size:.78rem">${escapeHTML(origin?.trait || '')}</div>
                    </button>
                `).join('')}
            </div>
            ${this.selectedData.origin ? `
                <div class="stp-highlight">
                    ${escapeHTML(Object.values(ORIGINS).find(o => o?.id === this.selectedData.origin)?.desc || '')}
                </div>` : ''}
        `;
    }

    renderCreationStep3() {
        const continentKeys = Object.keys(CONTINENTS);
        const countries = this.selectedData.continent
            ? (Array.isArray(CONTINENTS[this.selectedData.continent])
                ? CONTINENTS[this.selectedData.continent]
                : Object.values(CONTINENTS[this.selectedData.continent] || {}))
            : [];

        return `
            <div class="stp-grid stp-grid-2">
                ${continentKeys.map(continent => `
                    <button class="stp-choice ${this.selectedData.continent === continent ? 'selected' : ''}"
                        data-continent="${escapeHTML(continent)}">${escapeHTML(continent)}</button>
                `).join('')}
            </div>
            ${countries.length ? `
                <div class="stp-section-title">Pays</div>
                <div class="stp-grid stp-grid-2">
                    ${countries.map(country => `
                        <button class="stp-choice ${this.selectedData.country === country?.name ? 'selected' : ''}"
                            data-country="${escapeHTML(country?.name)}">
                            ${escapeHTML(country?.flag || flagFor(country?.name))} ${escapeHTML(country?.name)}
                        </button>
                    `).join('')}
                </div>` : ''}
        `;
    }

    renderCreationStep4() {
        return `
            <div class="stp-field">
                <label class="stp-label">Club de cœur</label>
                <select class="stp-select" id="stp-heart">
                    <option value="">Choisir</option>
                    ${Object.entries(HEART_CLUBS).map(([league, clubs]) => {
                        const list = Array.isArray(clubs) ? clubs : Object.values(clubs || {});
                        return `<optgroup label="${escapeHTML(league)}">
                            ${list.map(c => `<option value="${escapeHTML(c?.name)}" ${this.selectedData.heartClub === c?.name ? 'selected' : ''}>${escapeHTML(c?.name)}</option>`).join('')}
                        </optgroup>`;
                    }).join('')}
                </select>
            </div>
        `;
    }

    buildOffers() {
        if (this.randomYouthClubs.length) return;

        const pool = [...YOUTH_CLUBS_POOL].sort(() => Math.random() - .5);
        const count = Math.min(pool.length, 4 + Math.floor(Math.random() * 3));

        this.randomYouthClubs = pool.slice(0, count).map(club => {
            const vision = COACH_VISIONS[Math.floor(Math.random() * Math.max(1, COACH_VISIONS.length))] || { title:'Équilibré' };
            const coachName = COACH_NAMES[Math.floor(Math.random() * Math.max(1, COACH_NAMES.length))] || 'L’entraîneur';
            const prestige = safeNumber(club?.prestige, 40);
            return {
                ...club,
                coachName,
                coachVision: vision?.title || 'Équilibré',
                salary: Math.round(100 + Math.random() * 200),
                playtime: ['Temps de jeu limité','Joueur de rotation','Espoir / Prêt potentiel','Titulaire en jeunes'][Math.floor(Math.random()*4)],
                targetRating: Math.min(75, 55 + Math.round(prestige / 4))
            };
        });
    }

    renderCreationStep5() {
        this.buildOffers();

        return `
            <div class="stp-grid">
                ${this.randomYouthClubs.map(club => {
                    const selected = this.selectedData.youthClub?.name === club?.name ? 'selected' : '';
                    return `
                        <button class="stp-offer ${selected}" data-youth-club="${escapeHTML(club?.name)}">
                            <div class="stp-offer-head">
                                <div>
                                    <div class="stp-offer-club">
                                        <span class="stp-flag">${flagFor(club?.country)}</span>${escapeHTML(club?.name)}
                                    </div>
                                    <div class="stp-offer-country">${escapeHTML(club?.league || '')} · ${escapeHTML(club?.country || '')}</div>
                                </div>
                                <div class="stp-offer-prestige">Prestige ${safeNumber(club?.prestige)}</div>
                            </div>
                            <div style="height:10px"></div>
                            <div class="stp-offer-row"><span>Entraîneur</span><strong>${escapeHTML(club?.coachName)}</strong></div>
                            <div class="stp-offer-row"><span>Vision</span><strong>${escapeHTML(club?.coachVision)}</strong></div>
                            <div class="stp-offer-row"><span>Salaire</span><strong>${safeNumber(club?.salary)} € / semaine</strong></div>
                            <div class="stp-offer-row"><span>Temps de jeu</span><strong>${escapeHTML(club?.playtime)}</strong></div>
                            <div class="stp-offer-row"><span>Objectif</span><strong>${safeNumber(club?.targetRating)} Général</strong></div>
                        </button>
                    `;
                }).join('')}
            </div>
        `;
    }

    bindCreation() {
        const next = document.getElementById('stp-next');
        const prev = document.getElementById('stp-prev');
        const launch = document.getElementById('stp-launch');

        const validate = () => {
            const ok = this.isStepValid();
            if (next) next.disabled = !ok;
            if (launch) launch.disabled = !ok || this.launching;
        };

        document.getElementById('stp-firstname')?.addEventListener('input', e => {
            this.selectedData.firstname = e.target.value.trim();
            validate();
        });
        document.getElementById('stp-lastname')?.addEventListener('input', e => {
            this.selectedData.lastname = e.target.value.trim();
            validate();
        });

        document.querySelectorAll('[data-position]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedData.position = btn.dataset.position;
                this.renderCreation();
            });
        });

        document.querySelectorAll('[data-origin]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedData.origin = btn.dataset.origin;
                this.renderCreation();
            });
        });

        document.querySelectorAll('[data-continent]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedData.continent = btn.dataset.continent;
                this.selectedData.country = null;
                this.renderCreation();
            });
        });

        document.querySelectorAll('[data-country]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedData.country = btn.dataset.country;
                validate();
                this.renderCreation();
            });
        });

        document.getElementById('stp-heart')?.addEventListener('change', e => {
            this.selectedData.heartClub = e.target.value;
            validate();
        });

        document.querySelectorAll('[data-youth-club]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedData.youthClub = this.randomYouthClubs.find(
                    club => club?.name === btn.dataset.youthClub
                ) || null;

                if (this.selectedData.youthClub) {
                    this.selectedData.coachName = this.selectedData.youthClub.coachName;
                    this.selectedData.coachVision = this.selectedData.youthClub.coachVision;
                }

                this.renderCreation();
            });
        });

        next?.addEventListener('click', () => {
            if (!this.isStepValid()) return;
            this.currentStep = Math.min(5, this.currentStep + 1);
            this.notice = null;
            this.renderCreation();
        });

        prev?.addEventListener('click', () => {
            this.currentStep = Math.max(1, this.currentStep - 1);
            this.notice = null;
            this.renderCreation();
        });

        launch?.addEventListener('click', () => this.launchCareerSafely());
        validate();
    }

    isStepValid() {
        switch (this.currentStep) {
            case 1:
                return !!this.selectedData.firstname &&
                    !!this.selectedData.lastname &&
                    !!this.selectedData.position;
            case 2:
                return !!this.selectedData.origin;
            case 3:
                return !!this.selectedData.continent && !!this.selectedData.country;
            case 4:
                return !!this.selectedData.heartClub;
            case 5:
                return !!this.selectedData.youthClub;
            default:
                return false;
        }
    }

    launchCareerSafely() {
        if (this.launching || !this.engine || typeof this.engine.startCareer !== 'function') return;

        this.launching = true;
        this.notice = 'Création de ta carrière…';

        const app = this.initDOM();
        const launchButton = document.getElementById('stp-launch');
        if (launchButton) {
            launchButton.disabled = true;
            launchButton.textContent = 'Création…';
        }

        try {
            const result = this.engine.startCareer({ ...this.selectedData });

            if (!result || !this.engine.state?.player) {
                throw new Error('La carrière n’a pas été initialisée correctement.');
            }

            this.activeApp = 'home';
            this.notice = null;

            // On laisse le navigateur terminer le clic avant de reconstruire
            // toute l'interface : cela évite les états intermédiaires sur iOS.
            requestAnimationFrame(() => {
                try {
                    this.renderDashboard();
                } catch (error) {
                    console.error('[UI] erreur après lancement:', error);
                    this.showFatalUI(error);
                } finally {
                    this.launching = false;
                }
            });
        } catch (error) {
            console.error('[UI] startCareer error:', error);
            this.launching = false;
            this.notice = `Impossible de lancer la carrière : ${error?.message || 'erreur inconnue'}`;
            this.renderCreation();
        }
    }

    renderDashboard() {
        const app = this.initDOM();
        const state = this.engine?.state;

        if (!state?.player) {
            this.renderCreation();
            return;
        }

        const player = state.player;
        const calendar = state.calendar || {};
        const stats = player.stats || {};
        const plan = safeCall(
            () => CompetitionSystem.getBlockPlan(state),
            { type:'career_activity', matches:0, scheduledMatches:[], activities:[] }
        );
        const nextMatch = plan?.scheduledMatches?.[0] || null;

        const country = player.country || player.nationality || '';
        const clubCountry = player.clubCountry || country;
        const currentSeason = safeNumber(calendar.currentSeasonYear, new Date().getFullYear());

        app.innerHTML = `
            <div class="stp-shell">
                <div class="stp-topbar">
                    <div class="stp-brand">⚽ Street to Pro<small>${escapeHTML(calendar.currentPeriod || 'Saison')}</small></div>
                    <div class="stp-top-value">${currentSeason}/${currentSeason + 1}</div>
                </div>

                <main class="stp-content">
                    ${this.notice ? `<div class="stp-alert stp-success">${escapeHTML(this.notice)}</div>` : ''}

                    <section class="stp-card">
                        <div class="stp-player-head">
                            <div class="stp-number">${safeNumber(player.number, 33)}</div>
                            <div>
                                <div class="stp-player-name">
                                    <span class="stp-flag">${flagFor(country)}</span>${escapeHTML(getPlayerName(player))}
                                    <span style="font-size:.8rem;color:#cbd5e1;font-weight:800">· ${safeNumber(player.age)} ans</span>
                                </div>
                                <div class="stp-player-meta">
                                    ${flagFor(clubCountry)} ${escapeHTML(player.club || 'Centre de Formation')}
                                    · ${escapeHTML(player.position || 'BU')}
                                </div>
                                <div class="stp-player-meta">
                                    ${escapeHTML(player.careerProfile?.youthCategory || player.careerProfile?.stage || 'Formation')}
                                    · ${escapeHTML(player.contract?.label || 'Contrat')}
                                </div>
                            </div>
                        </div>

                        <div class="stp-metrics">
                            <div class="stp-metric"><span>GÉNÉRAL</span><strong>${safeNumber(player.overall)}</strong></div>
                            <div class="stp-metric"><span>POTENTIEL</span><strong>${safeNumber(player.potential)}</strong></div>
                            <div class="stp-metric"><span>FORME</span><strong>${safeNumber(player.fitness)}%</strong></div>
                            <div class="stp-metric"><span>MORAL</span><strong>${safeNumber(player.morale)}%</strong></div>
                        </div>

                        <div class="stp-season-stats">
                            <div class="stp-season-stat"><span>Matchs joués</span><strong>${safeNumber(stats.matchesPlayed)}</strong></div>
                            <div class="stp-season-stat"><span>Note moyenne</span><strong>${safeNumber(stats.averageRating) ? safeNumber(stats.averageRating).toFixed(1) : '—'}</strong></div>
                            <div class="stp-season-stat"><span>Buts</span><strong>${safeNumber(stats.goals)}</strong></div>
                            <div class="stp-season-stat"><span>Passes D</span><strong>${safeNumber(stats.assists)}</strong></div>
                        </div>

                        <div class="stp-highlight">
                            ${plan?.type === 'offseason'
                                ? `Intersaison · ${escapeHTML(plan?.monthLabel || '')} · ${(plan?.activities || []).join(' · ')}`
                                : `${safeNumber(plan?.matches)} match${safeNumber(plan?.matches) > 1 ? 's' : ''} prévu${safeNumber(plan?.matches) > 1 ? 's' : ''} ce mois${nextMatch ? ` · ${escapeHTML(nextMatch.competitionName || '')}` : ''}`}
                        </div>
                    </section>

                    ${this.renderPendingState(state)}

                    <div class="stp-apps">
                        ${this.appButton('career','⚽','Carrière')}
                        ${this.appButton('calendar','📅','Calendrier')}
                        ${this.appButton('stats','📊','Stats')}
                        ${this.appButton('training','🏋️','Entraînement')}
                        ${this.appButton('transfers','🔄','Mercato')}
                        ${this.appButton('coach','🧑‍🏫','Coach')}
                        ${this.appButton('social','💬','Relations')}
                        ${this.appButton('settings','⚙️','Réglages')}
                    </div>

                    <button class="stp-primary" id="stp-play" ${player.careerEnded || this.launching ? 'disabled' : ''}>
                        ${player.careerEnded ? 'Carrière terminée' : '▶ Lancer le prochain bloc'}
                    </button>
                </main>
            </div>
        `;

        this.bindDashboard();
    }

    appButton(id, icon, label) {
        return `
            <button class="stp-app" data-app="${escapeHTML(id)}">
                <div class="stp-app-icon">${icon}</div>
                <div class="stp-app-label">${escapeHTML(label)}</div>
            </button>
        `;
    }

    renderPendingState(state) {
        const pending = [];

        if (state.pendingEvent) pending.push(['Événement', state.pendingEvent.title || 'Un événement demande une décision.']);
        if (state.pendingCoachEvent) pending.push(['Coach', state.pendingCoachEvent.title || 'Ton entraîneur attend une réponse.']);
        if (state.pendingTransferOffer) pending.push(['Offre', `Une proposition est arrivée pour ${state.pendingTransferOffer.club || 'un nouveau club'}.`]);
        if (state.pendingPositionProposal) pending.push(['Position', 'Une évolution de poste est proposée.']);
        if (state.media?.recentDilemma) pending.push(['Média', state.media.recentDilemma.title || 'Une décision médiatique est disponible.']);

        if (!pending.length) return '';

        return `
            <section class="stp-card">
                <h2 class="stp-section-title" style="margin-top:0">À traiter</h2>
                <div class="stp-list">
                    ${pending.map(([title, text]) => `
                        <button class="stp-list-item" data-pending="${escapeHTML(title)}">
                            <strong>${escapeHTML(title)}</strong>
                            <span>${escapeHTML(text)}</span>
                        </button>
                    `).join('')}
                </div>
            </section>
        `;
    }

    bindDashboard() {
        document.querySelectorAll('[data-app]').forEach(button => {
            button.addEventListener('click', () => {
                this.activeApp = button.dataset.app;
                this.renderApp();
            });
        });

        document.querySelectorAll('[data-pending]').forEach(button => {
            button.addEventListener('click', () => this.openPending(button.dataset.pending));
        });

        document.getElementById('stp-play')?.addEventListener('click', () => this.playBlockSafely());
    }

    playBlockSafely() {
        if (this.launching || !this.engine?.state?.player) return;
        this.launching = true;

        try {
            const result = this.engine.playBlock();
            this.notice = null;

            if (result?.event) this.notice = 'Un événement demande ton attention.';
            else if (result?.coachEvent) this.notice = 'Ton entraîneur souhaite te parler.';
            else if (result?.transferOffer) this.notice = 'Une nouvelle offre est disponible.';

            this.renderDashboard();
        } catch (error) {
            console.error('[UI] playBlock error:', error);
            this.notice = `Le bloc n’a pas pu être simulé : ${error?.message || 'erreur inconnue'}`;
            this.renderDashboard();
        } finally {
            this.launching = false;
        }
    }

    openPending(type) {
        const state = this.engine?.state;
        if (!state) return;

        if (type === 'Événement') return this.openDecisionModal(state.pendingEvent, 'event');
        if (type === 'Coach') return this.openDecisionModal(state.pendingCoachEvent, 'coach');
        if (type === 'Média') return this.openDecisionModal(state.media?.recentDilemma, 'media');
        if (type === 'Offre') return this.renderApp('transfers');
        if (type === 'Position') return this.openPositionModal();
    }

    openDecisionModal(item, kind) {
        if (!item) return;

        const choices = item.choices || item.options || [];
        const app = this.initDOM();

        app.insertAdjacentHTML('beforeend', `
            <div class="stp-modal" id="stp-modal">
                <div class="stp-modal-card">
                    <h2 class="stp-modal-title">${escapeHTML(item.title || 'Décision')}</h2>
                    <p class="stp-modal-text">${escapeHTML(item.description || item.desc || 'Choisis une option.')}</p>
                    <div class="stp-grid" style="margin-top:14px">
                        ${choices.map((choice, index) => `
                            <button class="stp-choice" data-decision="${index}">
                                <strong>${escapeHTML(choice.texte || choice.text || choice.label || `Choix ${index + 1}`)}</strong>
                            </button>
                        `).join('')}
                    </div>
                    <button class="stp-secondary" id="stp-close-modal" style="margin-top:10px">Fermer</button>
                </div>
            </div>
        `);

        document.querySelectorAll('[data-decision]').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.decision);
                try {
                    if (kind === 'event') this.engine.resolveEventChoice(index);
                    if (kind === 'coach') this.engine.resolveCoachChoice(index);
                    if (kind === 'media') this.engine.resolveMediaDilemma(index);
                    document.getElementById('stp-modal')?.remove();
                    this.renderDashboard();
                } catch (error) {
                    console.error('[UI] decision error:', error);
                    document.getElementById('stp-modal')?.remove();
                    this.notice = `Décision impossible : ${error?.message || 'erreur inconnue'}`;
                    this.renderDashboard();
                }
            });
        });

        document.getElementById('stp-close-modal')?.addEventListener('click', () => {
            document.getElementById('stp-modal')?.remove();
        });
    }

    openPositionModal() {
        const proposal = this.engine?.state?.pendingPositionProposal;
        if (!proposal) return;

        const app = this.initDOM();
        app.insertAdjacentHTML('beforeend', `
            <div class="stp-modal" id="stp-modal">
                <div class="stp-modal-card">
                    <h2 class="stp-modal-title">Évolution de poste</h2>
                    <p class="stp-modal-text">${escapeHTML(proposal.description || 'Une nouvelle position est proposée.')}</p>
                    <div class="stp-actions" style="margin-top:14px">
                        <button class="stp-secondary" id="position-no">Refuser</button>
                        <button class="stp-primary" id="position-yes">Accepter</button>
                    </div>
                </div>
            </div>
        `);

        document.getElementById('position-no')?.addEventListener('click', () => {
            this.engine.resolvePositionProposal(false);
            document.getElementById('stp-modal')?.remove();
            this.renderDashboard();
        });
        document.getElementById('position-yes')?.addEventListener('click', () => {
            this.engine.resolvePositionProposal(true);
            document.getElementById('stp-modal')?.remove();
            this.renderDashboard();
        });
    }

    renderApp() {
        const app = this.initDOM();
        const state = this.engine?.state || {};

        app.innerHTML = `
            <div class="stp-shell">
                <div class="stp-topbar">
                    <button class="stp-secondary stp-back" id="stp-home">Accueil</button>
                    <div class="stp-brand">${escapeHTML(this.appLabel(this.activeApp))}<small>Street to Pro</small></div>
                    <div></div>
                </div>
                <main class="stp-content">
                    ${this.renderAppContent(state)}
                </main>
            </div>
        `;

        document.getElementById('stp-home')?.addEventListener('click', () => {
            this.activeApp = 'home';
            this.renderDashboard();
        });

        this.bindAppActions();
    }

    appLabel(app) {
        return {
            career:'Carrière', calendar:'Calendrier', stats:'Statistiques',
            training:'Entraînement', transfers:'Mercato', coach:'Coach',
            social:'Relations', settings:'Réglages'
        }[app] || 'Application';
    }

    renderAppContent(state) {
        const player = state.player || {};
        const stats = player.stats || {};

        switch (this.activeApp) {
            case 'career':
                return this.renderCareerApp(state);
            case 'calendar':
                return this.renderCalendarApp(state);
            case 'stats':
                return this.renderStatsApp(state);
            case 'training':
                return this.renderTrainingApp(state);
            case 'transfers':
                return this.renderTransfersApp(state);
            case 'coach':
                return this.renderCoachApp(state);
            case 'social':
                return this.renderSocialApp(state);
            case 'settings':
                return this.renderSettingsApp(state);
            default:
                return `<div class="stp-card"><h1 class="stp-title">Street to Pro</h1><p class="stp-subtitle">Application inconnue.</p></div>`;
        }
    }

    renderCareerApp(state) {
        const p = state.player;
        const history = state.career?.seasonHistory || [];

        return `
            <div class="stp-card">
                <h1 class="stp-title">Carrière</h1>
                <p class="stp-subtitle">${escapeHTML(getPlayerName(p))} · ${safeNumber(p.age)} ans · ${safeNumber(p.overall)} Général</p>
                <div class="stp-metrics">
                    <div class="stp-metric"><span>Club</span><strong>${escapeHTML(p.club || '—')}</strong></div>
                    <div class="stp-metric"><span>Potentiel</span><strong>${safeNumber(p.potential)}</strong></div>
                    <div class="stp-metric"><span>Étape</span><strong>${escapeHTML(safeCall(() => CareerSystem.getStage?.(p.age), 'Carrière'))}</strong></div>
                    <div class="stp-metric"><span>Valeur</span><strong>${escapeHTML(safeCall(() => TransferMarket.formatPrice?.(TransferMarket.calculateMarketValue?.(p)), '—'))}</strong></div>
                </div>
            </div>

            <div class="stp-card">
                <h2 class="stp-section-title" style="margin-top:0">Historique des saisons</h2>
                <div class="stp-list">
                    ${history.length ? [...history].reverse().map(s => `
                        <div class="stp-list-item">
                            <strong>${escapeHTML(s.seasonLabel || 'Saison')} · ${escapeHTML(s.club || '')}</strong>
                            <span>${safeNumber(s.age)} ans · ${safeNumber(s.overall)} Général · ${safeNumber(s.matches)} matchs · ${safeNumber(s.goals)} buts · ${safeNumber(s.assists)} passes · ${safeNumber(s.averageRating) ? safeNumber(s.averageRating).toFixed(1) : '—'}</span>
                        </div>
                    `).join('') : '<div class="stp-list-item"><span>Aucune saison archivée.</span></div>'}
                </div>
            </div>
        `;
    }

    renderCalendarApp(state) {
        const plan = safeCall(() => CompetitionSystem.getBlockPlan(state), null);
        const schedule = state.calendar?.seasonSchedule;
        const byMonth = schedule?.byMonth || {};
        const month = safeNumber(state.calendar?.currentMonth, 8);

        return `
            <div class="stp-card">
                <h1 class="stp-title">Calendrier</h1>
                <p class="stp-subtitle">${escapeHTML(state.calendar?.currentPeriod || '')}</p>
                <div class="stp-highlight">
                    ${plan?.type === 'offseason'
                        ? `Intersaison · ${(plan.activities || []).join(' · ')}`
                        : `${safeNumber(plan?.matches)} match(s) prévus ce mois.`}
                </div>
            </div>

            <div class="stp-card">
                <h2 class="stp-section-title" style="margin-top:0">Saison ${safeNumber(state.calendar?.currentSeasonYear)}/${safeNumber(state.calendar?.currentSeasonYear)+1}</h2>
                <div class="stp-list">
                    ${Object.entries(byMonth).map(([key, data]) => `
                        <div class="stp-list-item" style="${Number(key) === month ? 'border-color:rgba(59,130,246,.55)' : ''}">
                            <strong>${escapeHTML(data.label || `Mois ${key}`)}</strong>
                            <span>${escapeHTML(data.period || '')} · ${Array.isArray(data.matches) ? data.matches.length : 0} match(s)</span>
                        </div>
                    `).join('') || '<div class="stp-list-item"><span>Calendrier en préparation.</span></div>'}
                </div>
            </div>
        `;
    }

    renderStatsApp(state) {
        const p = state.player || {};
        const s = p.stats || {};
        const attributes = p.attributes || {};

        return `
            <div class="stp-card">
                <h1 class="stp-title">Statistiques</h1>
                <div class="stp-season-stats">
                    <div class="stp-season-stat"><span>Matchs</span><strong>${safeNumber(s.matchesPlayed)}</strong></div>
                    <div class="stp-season-stat"><span>Note</span><strong>${safeNumber(s.averageRating) ? safeNumber(s.averageRating).toFixed(1) : '—'}</strong></div>
                    <div class="stp-season-stat"><span>Buts</span><strong>${safeNumber(s.goals)}</strong></div>
                    <div class="stp-season-stat"><span>Passes</span><strong>${safeNumber(s.assists)}</strong></div>
                </div>
            </div>

            <div class="stp-card">
                <h2 class="stp-section-title" style="margin-top:0">Profil technique</h2>
                <div class="stp-grid stp-grid-2">
                    ${Object.entries(attributes).map(([key, value]) => `
                        <div class="stp-metric"><span>${escapeHTML(key)}</span><strong>${safeNumber(value)}</strong></div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTrainingApp(state) {
        const focusTypes = TrainingManager.FOCUS_TYPES || {};
        const current = state.trainingFocus || 'TECHNIQUE';

        return `
            <div class="stp-card">
                <h1 class="stp-title">Entraînement</h1>
                <p class="stp-subtitle">Choisis l'axe qui guidera le prochain bloc.</p>
                <div class="stp-grid">
                    ${Object.entries(focusTypes).map(([key, focus]) => `
                        <button class="stp-choice ${current === key ? 'selected' : ''}" data-training="${escapeHTML(key)}">
                            <strong>${escapeHTML(focus?.name || key)}</strong>
                            <div style="color:#94a3b8;margin-top:4px;font-size:.78rem">${escapeHTML(focus?.description || '')}</div>
                        </button>
                    `).join('') || '<div class="stp-list-item"><span>Les entraînements sont gérés par le moteur.</span></div>'}
                </div>
            </div>
        `;
    }

    renderTransfersApp(state) {
        const offer = state.pendingTransferOffer;

        return `
            <div class="stp-card">
                <h1 class="stp-title">Mercato</h1>
                <p class="stp-subtitle">Offres, évolution de club et trajectoire professionnelle.</p>
            </div>

            ${offer ? `
                <div class="stp-card">
                    <h2 class="stp-section-title" style="margin-top:0">Nouvelle offre</h2>
                    <div class="stp-offer">
                        <div class="stp-offer-club">
                            ${flagFor(offer.country || state.player?.clubCountry)}
                            ${escapeHTML(offer.club || 'Nouveau club')}
                        </div>
                        <div class="stp-offer-row"><span>Salaire</span><strong>${safeNumber(offer.salaireHebdo)} € / semaine</strong></div>
                        <div class="stp-offer-row"><span>Motif</span><strong>${escapeHTML(offer.reason || 'Opportunité')}</strong></div>
                    </div>
                    <div class="stp-actions" style="margin-top:10px">
                        <button class="stp-secondary" id="stp-reject-transfer">Refuser</button>
                        <button class="stp-primary" id="stp-accept-transfer">Accepter</button>
                    </div>
                </div>
            ` : `
                <div class="stp-card"><div class="stp-list-item"><strong>Aucune offre en attente</strong><span>Les opportunités apparaissent après les blocs et selon ta carrière.</span></div></div>
            `}
        `;
    }

    renderCoachApp(state) {
        const data = safeCall(() => CoachSystem.getCoachData?.(state), null);
        const coach = state.social?.coachData || {};

        return `
            <div class="stp-card">
                <h1 class="stp-title">Coach</h1>
                <p class="stp-subtitle">Ta relation avec ton entraîneur.</p>
                <div class="stp-metrics">
                    <div class="stp-metric"><span>Entraîneur</span><strong>${escapeHTML(coach.name || state.player?.coachName || '—')}</strong></div>
                    <div class="stp-metric"><span>Relation</span><strong>${safeNumber(coach.relation, safeNumber(state.player?.stats?.relationCoach,50))}/100</strong></div>
                    <div class="stp-metric"><span>Opinion</span><strong>${escapeHTML(coach.opinion || 'Neutre')}</strong></div>
                    <div class="stp-metric"><span>Vision</span><strong>${escapeHTML(state.player?.coachVision || data?.vision || '—')}</strong></div>
                </div>
            </div>

            ${state.pendingCoachEvent ? `
                <div class="stp-card">
                    <h2 class="stp-section-title" style="margin-top:0">Interaction en attente</h2>
                    <button class="stp-primary" id="stp-open-coach">Ouvrir</button>
                </div>` : ''}
        `;
    }

    renderSocialApp(state) {
        const social = state.social || {};
        const relationships = Array.isArray(social.relationships) ? social.relationships : [];

        return `
            <div class="stp-card">
                <h1 class="stp-title">Relations</h1>
                <p class="stp-subtitle">Le réseau autour du joueur évolue avec la carrière.</p>
                <div class="stp-list">
                    <div class="stp-list-item">
                        <strong>Coach</strong>
                        <span>${escapeHTML(social.coachData?.name || state.player?.coachName || '—')} · relation ${safeNumber(social.coachData?.relation,50)}/100</span>
                    </div>
                    ${relationships.map(r => `
                        <div class="stp-list-item">
                            <strong>${escapeHTML(r.name || r.type || 'Relation')}</strong>
                            <span>${escapeHTML(r.role || '')} · ${safeNumber(r.relation,50)}/100</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSettingsApp() {
        return `
            <div class="stp-card">
                <h1 class="stp-title">Réglages</h1>
                <p class="stp-subtitle">Actions techniques de la carrière.</p>
                <div class="stp-grid">
                    <button class="stp-secondary" id="stp-refresh-ui">Rafraîchir l'interface</button>
                    <button class="stp-danger" id="stp-reset-career">Réinitialiser la carrière</button>
                </div>
            </div>
        `;
    }

    bindAppActions() {
        document.querySelectorAll('[data-training]').forEach(button => {
            button.addEventListener('click', () => {
                const focus = button.dataset.training;
                const ok = safeCall(() => this.engine.setTrainingFocus(focus), false);
                this.notice = ok ? 'Entraînement mis à jour.' : 'Impossible de modifier l’entraînement.';
                this.renderApp();
            });
        });

        document.getElementById('stp-accept-transfer')?.addEventListener('click', () => {
            safeCall(() => this.engine.acceptTransferOffer());
            this.renderApp();
        });

        document.getElementById('stp-reject-transfer')?.addEventListener('click', () => {
            safeCall(() => this.engine.rejectTransferOffer());
            this.renderApp();
        });

        document.getElementById('stp-open-coach')?.addEventListener('click', () => {
            this.openDecisionModal(this.engine?.state?.pendingCoachEvent, 'coach');
        });

        document.getElementById('stp-refresh-ui')?.addEventListener('click', () => {
            this.activeApp = 'home';
            this.renderDashboard();
        });

        document.getElementById('stp-reset-career')?.addEventListener('click', () => {
            if (confirm('Réinitialiser complètement cette carrière ?')) {
                safeCall(() => this.engine.resetCareer());
                this.render();
            }
        });
    }
}

export default UserInterface;

// Visualisation plein écran d'un match déjà simulé.
// Aucun input de déplacement, passe, tir ou dribble n'est exposé ici.
import { buildSimulatedMatchTimeline } from '../domain/match/simulatedMatchTimeline.js';
import { buildSimulatedMatchTacticalSituation } from '../domain/match/simulatedMatchTacticalSituation.js';

const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const scoreText = score => `${Number(score?.home) || 0} – ${Number(score?.away) || 0}`;

function actorHtml(point, index, team) {
    const role = esc(point.role || 'outfield');
    return `<span class="sim-match-actor sim-match-${team}" data-sim-team="${team}" data-sim-index="${index}" data-role="${role}" style="left:${point.x}%;top:${point.y}%;--facing:${Number(point.facing) || 0}deg"></span>`;
}

function pitchHtml(tactical) {
    const home = tactical.home.map((point, index) => actorHtml(point, index, 'home')).join('');
    const away = tactical.away.map((point, index) => actorHtml(point, index, 'away')).join('');
    return `<div class="sim-match-pitch" data-simulated-pitch>
        <i class="sim-pitch-halfway"></i><i class="sim-pitch-circle"></i>
        <i class="sim-pitch-box sim-pitch-box-left"></i><i class="sim-pitch-box sim-pitch-box-right"></i>
        <i class="sim-pitch-goal sim-pitch-goal-left"></i><i class="sim-pitch-goal sim-pitch-goal-right"></i>
        ${home}${away}<span class="sim-match-ball" data-ball-owner="${esc(tactical.ball.owner ? `${tactical.ball.owner.team}:${tactical.ball.owner.index}` : 'none')}" style="left:${tactical.ball.x}%;top:${tactical.ball.y}%;"></span>
    </div>`;
}

export class SimulatedMatchVisualizationController {
    constructor() {
        this.timeline = null;
        this.index = 0;
        this.overlay = null;
        this.textTimer = null;
        this.textComplete = true;
        this.onComplete = null;
    }

    clearTextTimer() {
        if (this.textTimer) window.clearInterval(this.textTimer);
        this.textTimer = null;
    }

    clear() {
        this.clearTextTimer();
        this.overlay?.remove();
        this.overlay = null;
        this.timeline = null;
        this.index = 0;
        this.textComplete = true;
    }

    show(match, { player = {}, seed = null, onComplete = null } = {}) {
        if (!match) return false;
        this.clear();
        this.timeline = buildSimulatedMatchTimeline(match, { player, seed: seed || match.matchId || match.fixture?.id });
        this.onComplete = onComplete;
        const overlay = document.createElement('div');
        overlay.className = 'simulated-match-overlay';
        overlay.dataset.simulatedMatchVisualization = 'true';
        overlay.innerHTML = `<section class="simulated-match-shell" role="dialog" aria-modal="true" aria-label="Visualisation du match simulé">
            <header class="simulated-match-header">
                <div><small>${esc(this.timeline.competition)}</small><strong>${esc(this.timeline.homeTeam)}</strong></div>
                <div class="simulated-match-clock"><span data-sim-minute>0'</span><b data-sim-score>0 – 0</b></div>
                <div class="simulated-match-away"><small>ADVERSAIRE</small><strong>${esc(this.timeline.awayTeam)}</strong></div>
            </header>
            <div class="simulated-match-stage" data-sim-stage></div>
            <div class="simulated-match-progress" aria-hidden="true"><span data-sim-progress></span></div>
            <section class="simulated-match-copy" data-sim-copy tabindex="0" aria-live="polite">
                <span data-sim-label>MATCH</span>
                <h2 data-sim-title>Le match commence</h2>
                <p data-sim-text data-text-complete="true"></p>
                <small class="simulated-match-hint">Touchez le texte pour l'afficher instantanément</small>
            </section>
            <button class="simulated-match-continue" type="button" data-sim-continue>Continuer</button>
        </section>`;
        (document.getElementById('app') || document.body).appendChild(overlay);
        this.overlay = overlay;
        overlay.querySelector('[data-sim-copy]')?.addEventListener('click', () => this.revealImmediately());
        overlay.querySelector('[data-sim-copy]')?.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.revealImmediately(); } });
        overlay.querySelector('[data-sim-continue]')?.addEventListener('click', () => this.advance());
        this.renderCurrent();
        return true;
    }

    renderCurrent() {
        const event = this.timeline?.events?.[this.index];
        if (!event || !this.overlay) return;
        const tactical = buildSimulatedMatchTacticalSituation(event, {
            playerAge: this.timeline.playerAge,
            competition: this.timeline.competition,
            seed: `${this.timeline.matchId}:${event.id}`
        });
        const stage = this.overlay.querySelector('[data-sim-stage]');
        if (stage) stage.innerHTML = pitchHtml(tactical);
        this.overlay.dataset.eventType = event.type;
        this.overlay.dataset.cameraState = event.cameraState;
        this.overlay.dataset.tacticalLevel = tactical.organization.level;
        const minute = this.overlay.querySelector('[data-sim-minute]');
        const score = this.overlay.querySelector('[data-sim-score]');
        const label = this.overlay.querySelector('[data-sim-label]');
        const title = this.overlay.querySelector('[data-sim-title]');
        const progress = this.overlay.querySelector('[data-sim-progress]');
        const button = this.overlay.querySelector('[data-sim-continue]');
        if (minute) minute.textContent = event.minuteLabel;
        if (score) score.textContent = scoreText(event.score);
        if (label) label.textContent = event.type === 'GOAL' ? 'BUT' : event.type === 'FULL_TIME' ? 'FIN DU MATCH' : 'MATCH EN COURS';
        if (title) title.textContent = this.titleFor(event);
        if (progress) progress.style.width = `${Math.round(((this.index + 1) / this.timeline.events.length) * 100)}%`;
        if (button) button.textContent = this.index === this.timeline.events.length - 1 ? 'Terminer' : 'Continuer';
        this.revealProgressively(event.text || '');
    }

    titleFor(event) {
        const titles = {
            KICKOFF: 'Le bloc se met en place', BUILD_UP: 'La construction prend forme', PRESSING: 'Le pressing resserre le jeu',
            DUEL: 'Le duel se rapproche', COUNTER_ATTACK: 'La transition accélère', CROSS: 'Le jeu s'ouvre sur un côté',
            SHOT: 'Une fenêtre de frappe', SET_PIECE: 'Coup de pied arrêté', GOAL: 'Le score change', FULL_TIME: 'Coup de sifflet final'
        };
        return titles[event.type] || 'Le match continue';
    }

    revealProgressively(text) {
        this.clearTextTimer();
        const node = this.overlay?.querySelector('[data-sim-text]');
        if (!node) return;
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
        const parts = String(text).split(/(\s+)/).filter(Boolean);
        if (reduced || parts.length <= 2) {
            node.textContent = text;
            node.dataset.textComplete = 'true';
            this.textComplete = true;
            return;
        }
        node.textContent = '';
        node.dataset.textComplete = 'false';
        this.textComplete = false;
        let cursor = 0;
        this.textTimer = window.setInterval(() => {
            node.textContent += parts[cursor++] || '';
            if (cursor >= parts.length) {
                this.clearTextTimer();
                node.dataset.textComplete = 'true';
                this.textComplete = true;
            }
        }, 28);
    }

    revealImmediately() {
        if (this.textComplete) return false;
        const event = this.timeline?.events?.[this.index];
        const node = this.overlay?.querySelector('[data-sim-text]');
        if (!event || !node) return false;
        this.clearTextTimer();
        node.textContent = event.text || '';
        node.dataset.textComplete = 'true';
        this.textComplete = true;
        return true;
    }

    advance() {
        if (!this.textComplete) {
            this.revealImmediately();
            return;
        }
        if (!this.timeline || this.index >= this.timeline.events.length - 1) {
            const callback = this.onComplete;
            this.clear();
            callback?.();
            return;
        }
        this.index += 1;
        this.renderCurrent();
    }
}

export default SimulatedMatchVisualizationController;

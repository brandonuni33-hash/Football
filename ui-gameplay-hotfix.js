// ui-gameplay-hotfix.js
// Couche gameplay temporaire : dilemmes avant match et résolution des décisions.
// Elle reste autonome : aucun autre hotfix UI n'est requis.

import { UserInterface } from './ui.js';
import { MatchChoiceManager } from './matchChoices.js';
import { CompetitionSystem } from './competitionSystem.js';

const escapeHTML = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function getMatchType(match) {
    const phase = String(match?.phase || '').toLowerCase();
    const round = String(match?.round || match?.europeanRound || '').toLowerCase();
    if (phase.includes('final') || round.includes('final')) return 'final';
    return 'classic';
}

function getNextMatch(state) {
    try {
        const plan = CompetitionSystem.getBlockPlan(state);
        return plan?.scheduledMatches?.[0] || null;
    } catch (error) {
        console.error('[UI Gameplay] impossible de récupérer le prochain match:', error);
        return null;
    }
}

function formatChanges(result) {
    const changes = Array.isArray(result?.changes) ? result.changes : [];
    const temporary = Array.isArray(result?.temporary) ? result.temporary : [];
    const lines = [];
    for (const change of changes) {
        const delta = number(change.delta);
        if (!delta) continue;
        const sign = delta > 0 ? '+' : '';
        lines.push(`<div class="stp-list-item"><strong>${escapeHTML(change.label || change.stat)}</strong><span>${sign}${delta}</span></div>`);
    }
    for (const effect of temporary) {
        const value = number(effect.value);
        const sign = value > 0 ? '+' : '';
        lines.push(`<div class="stp-list-item"><strong>${escapeHTML(effect.label || effect.stat)}</strong><span>${sign}${value} · ${number(effect.duration)} match(s)</span></div>`);
    }
    if (number(result?.xp) > 0) lines.push(`<div class="stp-list-item"><strong>Expérience</strong><span>+${number(result.xp)} XP</span></div>`);
    return lines.join('');
}

function showResult(ui, result, fallbackTitle = 'Conséquences') {
    const app = ui.initDOM();
    const changesHTML = formatChanges(result);
    const response = result?.responseText || result?.message || '';
    app.insertAdjacentHTML('beforeend', `
        <div class="stp-modal" id="stp-result-modal">
            <div class="stp-modal-card">
                <h2 class="stp-modal-title">${escapeHTML(result?.title || fallbackTitle)}</h2>
                ${result?.choiceText ? `<p class="stp-modal-text"><strong>Ton choix :</strong> ${escapeHTML(result.choiceText)}</p>` : ''}
                ${response ? `<div class="stp-highlight" style="margin-bottom:12px">${escapeHTML(response)}</div>` : ''}
                ${changesHTML ? `<h3 class="stp-section-title" style="margin-top:8px">Ce qui change</h3><div class="stp-list">${changesHTML}</div>` : `<p class="stp-modal-text">Aucune conséquence chiffrée immédiate n'est affichée.</p>`}
                <button class="stp-primary" id="stp-result-close" style="margin-top:14px">Continuer</button>
            </div>
        </div>
    `);
    document.getElementById('stp-result-close')?.addEventListener('click', () => {
        document.getElementById('stp-result-modal')?.remove();
        ui.renderDashboard();
    });
}

function openMatchDilemma(ui, dilemma, match) {
    if (!dilemma) return;
    const app = ui.initDOM();
    const opponent = match?.opponent || match?.awayClub || match?.homeClub || 'l’adversaire';
    app.insertAdjacentHTML('beforeend', `
        <div class="stp-modal" id="stp-match-modal">
            <div class="stp-modal-card">
                <h2 class="stp-modal-title">${escapeHTML(dilemma.title)}</h2>
                <p class="stp-modal-text">${escapeHTML(dilemma.description)}</p>
                <p class="stp-modal-text"><strong>Adversaire :</strong> ${escapeHTML(opponent)}</p>
                <div class="stp-grid" style="margin-top:14px">
                    ${(dilemma.choices || []).map((choice, index) => `
                        <button class="stp-choice" data-match-choice="${index}">
                            <strong>${escapeHTML(choice.text || choice.label || `Choix ${index + 1}`)}</strong>
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `);
    document.querySelectorAll('[data-match-choice]').forEach(button => {
        button.addEventListener('click', () => {
            const index = Number(button.dataset.matchChoice);
            const choice = dilemma.choices?.[index];
            document.getElementById('stp-match-modal')?.remove();
            ui._pendingMatchDilemma = null;
            ui.playBlockSafely(choice);
        });
    });
}

UserInterface.prototype.openDecisionModal = function(item, kind) {
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
                        <button class="stp-choice" data-decision-fixed="${index}">
                            <strong>${escapeHTML(choice.texte || choice.text || choice.label || `Choix ${index + 1}`)}</strong>
                        </button>
                    `).join('')}
                </div>
                <button class="stp-secondary" id="stp-close-modal" style="margin-top:10px">Fermer</button>
            </div>
        </div>
    `);
    document.querySelectorAll('[data-decision-fixed]').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.decisionFixed);
            let result = null;
            try {
                if (kind === 'event') result = this.engine.resolveEventChoice(index);
                if (kind === 'coach') result = this.engine.resolveCoachChoice(index);
                if (kind === 'media') result = this.engine.resolveMediaDilemma(index);
                document.getElementById('stp-modal')?.remove();
                if (result) showResult(this, result, kind === 'coach' ? 'Réponse au coach' : 'Conséquences');
                else this.renderDashboard();
            } catch (error) {
                console.error('[UI] decision error:', error);
                document.getElementById('stp-modal')?.remove();
                this.notice = `Décision impossible : ${error?.message || 'erreur inconnue'}`;
                this.renderDashboard();
            }
        });
    });
    document.getElementById('stp-close-modal')?.addEventListener('click', () => document.getElementById('stp-modal')?.remove());
};

// Gestion unique du lancement d'un bloc.
// Le précédent ui-hotfix.js n'est plus nécessaire.
UserInterface.prototype.playBlockSafely = function(choice = null) {
    if (!choice && !this._pendingMatchDilemma && this.engine?.state?.player) {
        const match = getNextMatch(this.engine.state);
        if (match) {
            const matchType = getMatchType(match);
            if (MatchChoiceManager.shouldTriggerDilemma(matchType)) {
                this._pendingMatchDilemma = {
                    match,
                    dilemma: MatchChoiceManager.getMatchDilemma(matchType, match.opponent || match.awayClub || match.homeClub || 'l’adversaire')
                };
                openMatchDilemma(this, this._pendingMatchDilemma.dilemma, match);
                return;
            }
        }
    }

    if (this.launching || !this.engine?.state?.player) return;

    this.launching = true;
    try {
        const result = this.engine.playBlock(choice);
        this.notice = null;
        if (result?.event) this.notice = 'Un événement demande ton attention.';
        else if (result?.coachEvent) this.notice = 'Ton entraîneur souhaite te parler.';
        else if (result?.transferOffer) this.notice = 'Une nouvelle offre est disponible.';
        this.launching = false;
        this.renderDashboard();
    } catch (error) {
        console.error('[UI Gameplay] playBlock error:', error);
        this.launching = false;
        this.notice = `Le bloc n’a pas pu être simulé : ${error?.message || 'erreur inconnue'}`;
        this.renderDashboard();
    }
};

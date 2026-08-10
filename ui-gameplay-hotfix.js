// ui-gameplay-hotfix.js
// Gameplay match UI — une seule entrée pour lancer un bloc et une vraie séquence de match.

import { UserInterface } from './ui.js';
import { MatchChoiceManager } from './matchChoices.js';
import { CompetitionSystem } from './competitionSystem.js';

const escapeHTML = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function getMatchType(match) {
    const phase = String(match?.phase || '').toLowerCase();
    const round = String(match?.round || match?.europeanRound || '').toLowerCase();
    if (phase.includes('final') || round.includes('final')) return 'final';
    if (match?.rival || match?.isDerby || String(match?.type || '').toLowerCase().includes('rival')) return 'rival';
    return 'classic';
}

function getNextMatches(state) {
    try {
        const plan = CompetitionSystem.getBlockPlan(state);
        return Array.isArray(plan?.scheduledMatches) ? plan.scheduledMatches : [];
    } catch (error) {
        console.error('[Match UI] impossible de récupérer les matchs:', error);
        return [];
    }
}

function opponentOf(match) {
    return match?.opponent || match?.awayClub || match?.homeClub || match?.opponentName || 'Adversaire';
}

function matchLabel(match) {
    return match?.competitionName || match?.competition || match?.competitionId || match?.competitionType || 'Championnat';
}

function formatChanges(result) {
    const changes = Array.isArray(result?.changes) ? result.changes : [];
    const temporary = Array.isArray(result?.temporary) ? result.temporary : [];
    const lines = [];
    for (const change of changes) {
        const delta = number(change.delta);
        if (!delta) continue;
        lines.push(`<div class="stp-list-item"><strong>${escapeHTML(change.label || change.stat)}</strong><span>${delta > 0 ? '+' : ''}${delta}</span></div>`);
    }
    for (const effect of temporary) {
        const value = number(effect.value);
        lines.push(`<div class="stp-list-item"><strong>${escapeHTML(effect.label || effect.stat)}</strong><span>${value > 0 ? '+' : ''}${value} · ${number(effect.duration)} match(s)</span></div>`);
    }
    if (number(result?.xp) > 0) lines.push(`<div class="stp-list-item"><strong>Expérience</strong><span>+${number(result.xp)} XP</span></div>`);
    return lines.join('');
}

function injectMatchStyles() {
    if (document.getElementById('stp-match-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'stp-match-ui-styles';
    style.textContent = `
      .stp-match-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,6,23,.72);backdrop-filter:blur(8px);padding:12px;box-sizing:border-box}
      .stp-match-card{width:min(100%,430px);max-height:92dvh;overflow:auto;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(7,13,27,.99));box-shadow:0 24px 70px rgba(0,0,0,.55);padding:18px;color:#f8fafc}
      .stp-match-kicker{text-align:center;color:#94a3b8;font-size:.62rem;font-weight:850;text-transform:uppercase;letter-spacing:.08em}
      .stp-match-title{text-align:center;margin:6px 0 2px;font-size:1.08rem;font-weight:900}
      .stp-match-sub{text-align:center;color:#94a3b8;font-size:.68rem;margin-bottom:14px}
      .stp-match-score{display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;gap:8px;margin:8px 0 16px}
      .stp-match-team{text-align:center;font-size:.72rem;font-weight:800;line-height:1.2}
      .stp-match-vs{text-align:center;font-size:.62rem;color:#64748b;font-weight:850}
      .stp-match-choices{display:grid;gap:8px}
      .stp-match-choice{width:100%;text-align:left;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.045);color:#f8fafc;padding:11px 12px;cursor:pointer;touch-action:manipulation}
      .stp-match-choice strong{display:block;font-size:.72rem}.stp-match-choice span{display:block;margin-top:3px;color:#94a3b8;font-size:.59rem;line-height:1.3}
      .stp-match-choice:active{transform:scale(.985);background:rgba(255,255,255,.08)}
      .stp-match-timeline{display:grid;gap:6px;margin:12px 0}.stp-match-event{display:grid;grid-template-columns:34px 22px 1fr;align-items:center;gap:5px;padding:7px 8px;border-radius:10px;background:rgba(255,255,255,.035)}.stp-match-minute{font-size:.58rem;color:#64748b;font-weight:850}.stp-match-event-icon{font-size:.78rem;text-align:center}.stp-match-event-text{font-size:.62rem;color:#cbd5e1}.stp-match-result{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:15px 8px;margin:8px 0 12px;border-radius:15px;background:rgba(255,255,255,.045)}.stp-match-result .team{text-align:center;font-size:.66rem;font-weight:800}.stp-match-result .score{text-align:center;font-size:1.5rem;font-weight:950;letter-spacing:.03em}.stp-match-rating{text-align:center;color:#aeb9ca;font-size:.64rem;margin:6px 0 12px}.stp-match-close{width:100%;border:0;border-radius:12px;padding:11px;background:#34d399;color:#06271b;font-weight:900;font-size:.68rem;cursor:pointer;touch-action:manipulation}
    `;
    document.head.appendChild(style);
}

function closeModal(id) { document.getElementById(id)?.remove(); }

function openMatchDecision(ui, match, index, total) {
    injectMatchStyles();
    const app = ui.initDOM();
    const type = getMatchType(match);
    const opponent = opponentOf(match);
    const dilemma = MatchChoiceManager.getMatchDilemma(type, opponent);
    app.insertAdjacentHTML('beforeend', `
      <div class="stp-match-modal" id="stp-match-modal">
        <div class="stp-match-card">
          <div class="stp-match-kicker">${total > 1 ? `Match ${index + 1} / ${total}` : 'Jour de match'}</div>
          <h2 class="stp-match-title">${escapeHTML(matchLabel(match))}</h2>
          <div class="stp-match-sub">${escapeHTML(match?.round || match?.phase || 'Rencontre')}</div>
          <div class="stp-match-score"><div class="stp-match-team">${escapeHTML(ui.engine.state.player.club || 'Ton équipe')}</div><div class="stp-match-vs">VS</div><div class="stp-match-team">${escapeHTML(opponent)}</div></div>
          <p style="font-size:.68rem;color:#cbd5e1;line-height:1.4;margin:0 0 10px">${escapeHTML(dilemma?.description || 'Le match commence. Quelle approche adoptes-tu ?')}</p>
          <div class="stp-match-choices">
            ${(dilemma?.choices || []).slice(0,4).map((choice, i) => `<button class="stp-match-choice" data-match-choice="${i}"><strong>${escapeHTML(choice.text || choice.texte || choice.label || `Choix ${i + 1}`)}</strong><span>Ta décision influence la performance, la fatigue et les actions du match.</span></button>`).join('')}
          </div>
        </div>
      </div>`);
    document.querySelectorAll('#stp-match-modal [data-match-choice]').forEach(button => {
        button.addEventListener('click', () => {
            const choice = dilemma.choices?.[Number(button.dataset.matchChoice)];
            closeModal('stp-match-modal');
            ui._matchSessionChoice = choice || null;
            ui._matchSessionIndex = index;
            ui._matchSessionTotal = total;
            ui.playBlockSafely(choice || null, true);
        }, { once: true });
    });
}

function showBlockMatchResults(ui, result) {
    injectMatchStyles();
    const matches = result?.report?.summary?.matchResults || result?.report?.results || [];
    const scheduled = result?.report?.summary?.scheduledMatches || [];
    const playerClub = ui.engine.state?.player?.club || 'Ton équipe';
    const rows = matches.map((r, i) => {
        const m = scheduled[i] || {};
        const opponent = opponentOf(m);
        const goals = number(r.goals), assists = number(r.assists);
        const events = [];
        if (goals) events.push(`⚽ ${goals} but${goals > 1 ? 's' : ''}`);
        if (assists) events.push(`🅰️ ${assists} passe${assists > 1 ? 's' : ''} D.`);
        events.push(`⭐ Note ${number(r.rating).toFixed(1)}`);
        return `<div class="stp-match-event"><span class="stp-match-minute">${i + 1}</span><span class="stp-match-event-icon">⚽</span><span class="stp-match-event-text"><strong>${escapeHTML(matchLabel(m))}</strong> · ${escapeHTML(playerClub)} vs ${escapeHTML(opponent)}<br>${events.join(' · ')}</span></div>`;
    }).join('');
    const summary = result?.report?.summary || {};
    const app = ui.initDOM();
    app.insertAdjacentHTML('beforeend', `<div class="stp-match-modal" id="stp-match-result-modal"><div class="stp-match-card"><div class="stp-match-kicker">Fin du bloc</div><h2 class="stp-match-title">Résultats des matchs</h2><div class="stp-match-timeline">${rows || '<div class="stp-match-event"><span class="stp-match-minute">—</span><span class="stp-match-event-icon">📅</span><span class="stp-match-event-text">Aucun match programmé sur ce bloc.</span></div>'}</div><div class="stp-match-rating">${number(summary.goals)} but(s) · ${number(summary.assists)} passe(s) D. · Note moyenne ${number(summary.rating).toFixed(1)}</div>${result?.report?.training ? `<div class="stp-match-sub">Entraînement appliqué · ${escapeHTML(result.report.training.focus || ui.engine.state.trainingFocus || '')}</div>` : ''}<button class="stp-match-close" id="stp-match-result-close">Continuer</button></div></div>`);
    document.getElementById('stp-match-result-close')?.addEventListener('click', () => { closeModal('stp-match-result-modal'); ui.renderDashboard(); }, { once: true });
}

function showResult(ui, result, fallbackTitle = 'Conséquences') {
    const app = ui.initDOM();
    const changesHTML = formatChanges(result);
    const response = result?.responseText || result?.message || '';
    app.insertAdjacentHTML('beforeend', `<div class="stp-modal" id="stp-result-modal"><div class="stp-modal-card"><h2 class="stp-modal-title">${escapeHTML(result?.title || fallbackTitle)}</h2>${result?.choiceText ? `<p class="stp-modal-text"><strong>Ton choix :</strong> ${escapeHTML(result.choiceText)}</p>` : ''}${response ? `<div class="stp-highlight" style="margin-bottom:12px">${escapeHTML(response)}</div>` : ''}${changesHTML ? `<h3 class="stp-section-title" style="margin-top:8px">Ce qui change</h3><div class="stp-list">${changesHTML}</div>` : `<p class="stp-modal-text">Aucune conséquence chiffrée immédiate n'est affichée.</p>`}<button class="stp-primary" id="stp-result-close" style="margin-top:14px">Continuer</button></div></div>`);
    document.getElementById('stp-result-close')?.addEventListener('click', () => { closeModal('stp-result-modal'); ui.renderDashboard(); }, { once: true });
}

UserInterface.prototype.openDecisionModal = function(item, kind) {
    if (!item) return;
    const choices = item.choices || item.options || [];
    const app = this.initDOM();
    app.insertAdjacentHTML('beforeend', `<div class="stp-modal" id="stp-modal"><div class="stp-modal-card"><h2 class="stp-modal-title">${escapeHTML(item.title || 'Décision')}</h2><p class="stp-modal-text">${escapeHTML(item.description || item.desc || 'Choisis une option.')}</p><div class="stp-grid" style="margin-top:14px">${choices.map((choice, index) => `<button class="stp-choice" data-decision-fixed="${index}"><strong>${escapeHTML(choice.texte || choice.text || choice.label || `Choix ${index + 1}`)}</strong></button>`).join('')}</div><button class="stp-secondary" id="stp-close-modal" style="margin-top:10px">Fermer</button></div></div>`);
    document.querySelectorAll('[data-decision-fixed]').forEach(btn => btn.addEventListener('click', () => { const index = Number(btn.dataset.decisionFixed); let result = null; try { if (kind === 'event') result = this.engine.resolveEventChoice(index); if (kind === 'coach') result = this.engine.resolveCoachChoice(index); if (kind === 'media') result = this.engine.resolveMediaDilemma(index); closeModal('stp-modal'); if (result) showResult(this, result, kind === 'coach' ? 'Réponse au coach' : 'Conséquences'); else this.renderDashboard(); } catch (error) { console.error('[UI] decision error:', error); closeModal('stp-modal'); this.notice = `Décision impossible : ${error?.message || 'erreur inconnue'}`; this.renderDashboard(); } }, { once: true }));
    document.getElementById('stp-close-modal')?.addEventListener('click', () => closeModal('stp-modal'), { once: true });
};

// Entrée unique du bouton AVANCER.
UserInterface.prototype.playBlockSafely = function(choice = null, fromMatchSession = false) {
    if (this.launching) return;
    if (!fromMatchSession && !choice && !this._matchSessionActive && this.engine?.state?.player) {
        const matches = getNextMatches(this.engine.state);
        if (matches.length) {
            this._matchSessionActive = true;
            this._matchSessionIndex = 0;
            this._matchSessionTotal = matches.length;
            this._matchSessionChoice = null;
            openMatchDecision(this, matches[0], 0, matches.length);
            return;
        }
    }

    if (this._matchSessionActive && !fromMatchSession) return;
    if (!this.engine?.state?.player) return;
    this.launching = true;
    try {
        const result = this.engine.playBlock(choice);
        this.launching = false;
        this._matchSessionActive = false;
        this._matchSessionChoice = null;
        this._matchSessionIndex = 0;
        this._matchSessionTotal = 0;
        this.notice = null;
        if (result?.event) this.notice = 'Un événement demande ton attention.';
        else if (result?.coachEvent) this.notice = 'Ton entraîneur souhaite te parler.';
        else if (result?.transferOffer) this.notice = 'Une nouvelle offre est disponible.';
        showBlockMatchResults(this, result);
    } catch (error) {
        console.error('[UI Gameplay] playBlock error:', error);
        this.launching = false;
        this._matchSessionActive = false;
        this._matchSessionChoice = null;
        this.notice = `Le bloc n’a pas pu être simulé : ${error?.message || 'erreur inconnue'}`;
        this.renderDashboard();
    }
};

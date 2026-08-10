// ui-gameplay-hotfix.js
// Couche de compatibilité conservée pendant la migration UI -> Application.
// La logique métier reste dans les systèmes du domaine.

import { UserInterface } from './ui.js';

if (!window.__STP_GAMEPLAY_HOTFIX_V2__) {
    window.__STP_GAMEPLAY_HOTFIX_V2__ = true;

    const escapeHTML = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

    function showResult(ui, result, title = 'Conséquences') {
        if (!result) return false;
        const app = ui.initDOM();
        const changes = Array.isArray(result.changes) ? result.changes : [];
        const temporary = Array.isArray(result.temporary) ? result.temporary : [];
        const rows = [
            ...changes.filter(item => number(item?.delta) !== 0).map(item => {
                const delta = number(item.delta);
                return `<div class="stp-list-item"><strong>${escapeHTML(item.label || item.stat)}</strong><span>${delta > 0 ? '+' : ''}${delta}</span></div>`;
            }),
            ...temporary.map(item => `<div class="stp-list-item"><strong>${escapeHTML(item.label || item.stat)}</strong><span>${number(item.value) > 0 ? '+' : ''}${number(item.value)} · ${number(item.duration)} match(s)</span></div>`),
            ...(number(result.xp) > 0 ? [`<div class="stp-list-item"><strong>Expérience</strong><span>+${number(result.xp)} XP</span></div>`] : [])
        ];

        app.insertAdjacentHTML('beforeend', `
            <div class="stp-modal" id="stp-result-modal">
                <div class="stp-modal-card">
                    <h2 class="stp-modal-title">${escapeHTML(result.title || title)}</h2>
                    ${result.choiceText ? `<p class="stp-modal-text"><strong>Ton choix :</strong> ${escapeHTML(result.choiceText)}</p>` : ''}
                    ${result.responseText || result.message ? `<div class="stp-highlight">${escapeHTML(result.responseText || result.message)}</div>` : ''}
                    ${rows.length ? `<h3 class="stp-section-title">Ce qui change</h3><div class="stp-list">${rows.join('')}</div>` : ''}
                    <button class="stp-primary" id="stp-result-close">Continuer</button>
                </div>
            </div>
        `);

        document.getElementById('stp-result-close')?.addEventListener('click', () => {
            document.getElementById('stp-result-modal')?.remove();
            ui.renderDashboard();
        }, { once: true });
        return true;
    }

    const originalOpenDecisionModal = UserInterface.prototype.openDecisionModal;
    if (typeof originalOpenDecisionModal === 'function') {
        UserInterface.prototype.openDecisionModal = function (item, kind) {
            const choices = item?.choices || item?.options || [];
            const app = this.initDOM();
            app.insertAdjacentHTML('beforeend', `
                <div class="stp-modal" id="stp-modal">
                    <div class="stp-modal-card">
                        <h2 class="stp-modal-title">${escapeHTML(item?.title || 'Décision')}</h2>
                        <p class="stp-modal-text">${escapeHTML(item?.description || item?.desc || 'Choisis une option.')}</p>
                        <div class="stp-grid" style="margin-top:14px">
                            ${choices.map((choice, index) => `<button class="stp-choice" data-stp-decision="${index}"><strong>${escapeHTML(choice?.texte || choice?.text || choice?.label || `Choix ${index + 1}`)}</strong></button>`).join('')}
                        </div>
                    </div>
                </div>
            `);

            document.querySelectorAll('[data-stp-decision]').forEach(button => {
                button.addEventListener('click', () => {
                    const index = Number(button.dataset.stpDecision);
                    let result = null;
                    try {
                        if (kind === 'event') result = this.engine.resolveEventChoice(index);
                        else if (kind === 'coach') result = this.engine.resolveCoachChoice(index);
                        else if (kind === 'media') result = this.engine.resolveMediaDilemma(index);
                    } catch (error) {
                        console.error('[UI Gameplay] decision error:', error);
                    }
                    document.getElementById('stp-modal')?.remove();
                    if (!showResult(this, result, kind === 'coach' ? 'Réponse au coach' : 'Conséquences')) {
                        this.renderDashboard();
                    }
                }, { once: true });
            });
        };
    }
}

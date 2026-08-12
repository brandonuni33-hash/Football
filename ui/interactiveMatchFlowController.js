// Présentation de la séquence de match jouable. Toute la logique reste dans le domaine match.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function legacyStep(result = {}) {
    const decision = result.interactiveDecision;
    if (!decision) return null;
    return {
        phase: 'moment_1', kind: 'decision', label: 'MOMENT CLÉ', progress: 40,
        minute: decision.minute, title: decision.title, text: decision.description,
        choices: decision.choices || [], items: [], score: { home: 0, away: 0 },
        team: 'Ton équipe', opponent: 'Adversaire', home: true
    };
}

function phaseTone(step = {}) {
    if (step.kind === 'decision') return 'decision';
    if (step.kind === 'reactions') return 'reactions';
    if (step.phase === 'unexpected_event') return 'unexpected';
    if (step.phase === 'final_whistle') return 'final';
    return 'narration';
}

export class InteractiveMatchFlowController {
    constructor({ ui, onResult } = {}) {
        this.ui = ui;
        this.onResult = onResult;
        this.timer = null;
        this.advancing = false;
    }

    clear() {
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = null;
        document.querySelector('[data-interactive-match-flow]')?.remove();
    }

    show(result = {}) {
        const step = result.interactiveStep || legacyStep(result);
        if (!step) return false;
        this.clear();
        this.advancing = false;

        const overlay = document.createElement('div');
        const homeTeam = step.home === false ? step.opponent : step.team;
        const awayTeam = step.home === false ? step.team : step.opponent;
        const choices = step.choices || [];
        const items = step.items || [];
        const minute = step.minute === null || step.minute === undefined ? '—' : `${step.minute}'`;
        overlay.className = `interactive-match-overlay tone-${phaseTone(step)}`;
        overlay.dataset.interactiveMatchFlow = 'true';
        overlay.dataset.interactivePhase = step.phase || 'unknown';
        overlay.innerHTML = `
            <section class="interactive-match-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(step.title || 'Match jouable')}">
                <header class="interactive-match-header">
                    <div>
                        <span class="interactive-match-kicker">${escapeHtml(step.label || 'MATCH')}</span>
                        <strong>${escapeHtml(step.competition || 'Match jouable')}</strong>
                    </div>
                    <span class="interactive-match-minute">${escapeHtml(minute)}</span>
                </header>

                <div class="interactive-match-scoreboard" aria-label="Score ${escapeHtml(step.score?.home || 0)} à ${escapeHtml(step.score?.away || 0)}">
                    <span>${escapeHtml(homeTeam || 'Domicile')}</span>
                    <strong><b>${escapeHtml(step.score?.home || 0)}</b><i>–</i><b>${escapeHtml(step.score?.away || 0)}</b></strong>
                    <span>${escapeHtml(awayTeam || 'Extérieur')}</span>
                </div>

                <div class="interactive-match-progress" aria-hidden="true"><span style="width:${Math.max(2, Math.min(100, Number(step.progress) || 0))}%"></span></div>
                <div class="interactive-match-milestones" aria-hidden="true">
                    <span>Avant-match</span><span>Moment 1</span><span>Incident</span><span>Moment 2</span><span>Réactions</span>
                </div>

                <div class="interactive-match-story">
                    <span class="interactive-match-phase-icon">${step.kind === 'decision' ? '◆' : step.kind === 'reactions' ? '◎' : step.phase === 'unexpected_event' ? '!' : '●'}</span>
                    <h2>${escapeHtml(step.title || 'Le match continue')}</h2>
                    <p>${escapeHtml(step.text || '')}</p>
                </div>

                ${items.length ? `<div class="interactive-match-reactions">
                    ${items.map(item => `<article>
                        <span>${escapeHtml(item.icon || '•')}</span>
                        <div><strong>${escapeHtml(item.label || 'RÉACTION')}</strong><p>${escapeHtml(item.text || '')}</p></div>
                    </article>`).join('')}
                </div>` : ''}

                ${choices.length ? `<div class="interactive-match-choices">
                    ${choices.map((choice, index) => `<button type="button" data-interactive-choice="${index}">
                        <span>${index + 1}</span><strong>${escapeHtml(choice.text || choice.texte || choice.label || 'Choisir')}</strong>
                    </button>`).join('')}
                </div>` : `<button class="interactive-match-continue" type="button" data-interactive-continue>
                    ${escapeHtml(step.actionLabel || 'Continuer')}
                </button>`}

                ${step.autoAdvanceMs ? '<small class="interactive-match-auto">Le match continue automatiquement…</small>' : ''}
            </section>`;

        (document.getElementById('app') || document.body).appendChild(overlay);
        overlay.querySelectorAll('[data-interactive-choice]').forEach(button => {
            button.addEventListener('click', () => this.advance(Number(button.dataset.interactiveChoice)));
        });
        overlay.querySelector('[data-interactive-continue]')?.addEventListener('click', () => this.advance(null));
        if (step.autoAdvanceMs > 0) {
            this.timer = window.setTimeout(() => this.advance(null), Math.max(900, Number(step.autoAdvanceMs)));
        }
        return true;
    }

    advance(choiceIndex) {
        if (this.advancing) return;
        this.advancing = true;
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = null;
        document.querySelector('[data-interactive-match-flow]')?.remove();
        try {
            const next = this.ui?.gateway?.playNextBlock(choiceIndex);
            this.onResult?.(next);
        } catch (error) {
            this.advancing = false;
            throw error;
        }
    }
}

export default InteractiveMatchFlowController;

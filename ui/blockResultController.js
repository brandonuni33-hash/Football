// ui/blockResultController.js
// Orchestration de l'après-bloc : narration, événements, coach, transferts et propositions.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

function matchModeLabel(match = {}) {
    if (match.playerPlayed === false) return match.appearance === 'bench' ? 'banc' : 'hors groupe';
    if (match.interactive) return 'décisions';
    if (match.started === false) return 'entré en jeu';
    return 'simulé';
}

function contributionHtml(match = {}) {
    if (match.playerPlayed === false) return '';
    const goals = Math.max(0, Number(match.goals) || 0);
    const assists = Math.max(0, Number(match.assists) || 0);
    const items = [];
    if (goals) items.push(`<span title="But${goals > 1 ? 's' : ''}" style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:999px;background:rgba(75,208,224,.11);color:#9cecf5;font-size:.68rem;font-weight:800;">⚽ ${goals}</span>`);
    if (assists) items.push(`<span title="Passe${assists > 1 ? 's' : ''} décisive${assists > 1 ? 's' : ''}" style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:999px;background:rgba(183,137,255,.11);color:#d8c0ff;font-size:.68rem;font-weight:800;">A ${assists}</span>`);
    return items.length ? `<div data-player-contributions style="display:flex;justify-content:flex-end;gap:4px;margin-top:4px;">${items.join('')}</div>` : '';
}

function matchRecapHtml(matches = []) {
    if (!Array.isArray(matches) || !matches.length) return '';
    return `
        <div data-narrative-match-recap style="display:grid;gap:9px;margin:16px 0 18px;">
            ${matches.map(match => `
                <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 12px;border:1px solid rgba(255,255,255,.12);border-radius:12px;${match.isImpactMatch ? 'background:rgba(255,255,255,.08);' : ''}">
                    <div style="min-width:0;">
                        <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                            <strong>${escapeHtml(match.opponent || 'Adversaire')}</strong>
                            ${match.isImpactMatch ? '<span style="font-size:.72rem;font-weight:800;letter-spacing:.04em;">⭐ TON MATCH</span>' : ''}
                            <span style="font-size:.7rem;opacity:.65;">${escapeHtml(matchModeLabel(match))}</span>
                        </div>
                        <div style="font-size:.8rem;opacity:.65;margin-top:2px;">${escapeHtml(match.competition || 'Match')} · ${escapeHtml(match.appearanceLabel || match.impactDetail || '')}</div>
                    </div>
                    <div style="text-align:right;white-space:nowrap;">
                        <div style="font-size:1.05rem;font-weight:800;">${escapeHtml(match.score || '0-0')}</div>
                        <div style="font-size:.72rem;opacity:.72;">${escapeHtml(match.impactLabel || '')}</div>
                        ${contributionHtml(match)}
                    </div>
                </div>`).join('')}
        </div>`;
}

export class BlockResultController {
    constructor(ui, modals) {
        this.ui = ui;
        this.modals = modals;
        this.narrativeTimers = [];
    }

    handleBlockResult(result) {
        if (!result) return;
        if (result.interactive && result.interactiveDecision) {
            this.showInteractiveDecision(result);
            return;
        }

        this.ui.renderDashboard();

        if (result.recoveryOnly) {
            this.modals.afficherMessageModal('🏥 Récupération Médicale', 'Période dédiée aux soins intensifs et à la rééducation.');
            return;
        }

        const finish = () => {
            this.ui.renderDashboard();
            this.handlePostInteraction();
        };

        const continueFlow = () => {
            if (result.report?.summary?.choiceConsequences) {
                this.modals.afficherModaleConsequences(result.report.summary.choiceConsequences, () => this.openPendingInteraction(result, finish));
                return;
            }
            this.openPendingInteraction(result, finish);
        };

        if (result.narrativeScene?.beats?.length) {
            this.showNarrativeScene(result.narrativeScene, continueFlow);
            return;
        }

        continueFlow();
    }

    showNarrativeScene(scene, onComplete) {
        this.clearNarrativeTimers();
        document.querySelector('[data-narrative-scene]')?.remove();

        const overlay = document.createElement('div');
        const isMatchScene = scene?.type === 'match.end';
        const sceneCategory = isMatchScene ? '🏟️ APRÈS-MATCH' : '🌍 CARRIÈRE';
        overlay.className = 'event-modal-overlay';
        overlay.dataset.narrativeScene = 'true';
        overlay.innerHTML = `
            <div class="event-modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(scene.title || 'Actualité de carrière')}">
                <span class="event-modal-category">${sceneCategory} · ${escapeHtml(String(scene.importance || 'normal').toUpperCase())}</span>
                <h3 class="event-modal-title">${escapeHtml(scene.title || 'Le monde continue de bouger')}</h3>
                <p class="event-modal-desc" style="opacity:.72;margin-bottom:4px;">${escapeHtml(scene.subtitle || '')}</p>
                ${matchRecapHtml(scene.matches)}
                <div data-narrative-beats style="display:grid;gap:12px;min-height:120px;"></div>
                <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px;">
                    <button class="btn-event-choice" data-narrative-skip type="button" style="width:auto;padding-inline:14px;">Passer</button>
                    <button class="btn-event-choice" data-narrative-continue type="button" style="width:auto;padding-inline:18px;display:none;">Continuer</button>
                </div>
            </div>`;

        (document.getElementById('app') || document.body).appendChild(overlay);
        const container = overlay.querySelector('[data-narrative-beats]');
        const skip = overlay.querySelector('[data-narrative-skip]');
        const next = overlay.querySelector('[data-narrative-continue]');
        const beats = Array.isArray(scene.beats) ? scene.beats : [];
        let index = 0;
        let completed = false;

        const reveal = beat => {
            const paragraph = document.createElement('p');
            paragraph.className = 'event-modal-desc';
            paragraph.style.margin = '0';
            paragraph.style.opacity = '0';
            paragraph.style.transform = 'translateY(7px)';
            paragraph.style.transition = 'opacity .35s ease, transform .35s ease';
            if (beat?.emphasis) paragraph.style.fontWeight = '700';
            if (beat?.callback) paragraph.style.fontStyle = 'italic';
            if (beat?.kind === 'world-observation' && beat?.title) {
                const label = document.createElement('span');
                label.style.display = 'block';
                label.style.marginBottom = '4px';
                label.style.fontSize = '.68rem';
                label.style.letterSpacing = '.06em';
                label.style.opacity = '.68';
                label.textContent = String(beat.title).toUpperCase();
                paragraph.append(label, document.createTextNode(beat?.text || ''));
            } else {
                paragraph.textContent = beat?.text || '';
            }
            container?.appendChild(paragraph);
            requestAnimationFrame(() => {
                paragraph.style.opacity = '1';
                paragraph.style.transform = 'translateY(0)';
            });
        };

        const finishReveal = () => {
            completed = true;
            if (skip) skip.style.display = 'none';
            if (next) next.style.display = '';
        };

        const revealRemaining = () => {
            this.clearNarrativeTimers();
            while (index < beats.length) reveal(beats[index++]);
            finishReveal();
        };

        const scheduleNext = () => {
            if (index >= beats.length) {
                finishReveal();
                return;
            }
            const beat = beats[index++];
            reveal(beat);
            const timer = window.setTimeout(scheduleNext, Math.max(450, Number(beat?.delay) || 850));
            this.narrativeTimers.push(timer);
        };

        skip?.addEventListener('click', revealRemaining);
        next?.addEventListener('click', () => {
            if (!completed) return;
            this.clearNarrativeTimers();
            overlay.remove();
            onComplete?.();
        });

        scheduleNext();
    }

    clearNarrativeTimers() {
        this.narrativeTimers.splice(0).forEach(timer => window.clearTimeout(timer));
    }

    showInteractiveDecision(result) {
        const decision = result.interactiveDecision;
        this.modals.afficherModaleMatchDilemma(decision, (_, index) => {
            const next = this.ui.gateway?.playNextBlock(index);
            if (next?.interactiveDecision) this.showInteractiveDecision(next);
            else this.handleBlockResult(next);
        });
    }

    openPendingInteraction(result, finish) {
        if (result.event) {
            this.modals.afficherModaleEvent(result.event, choiceIndex => {
                const consequence = this.ui.gateway?.resolveEventChoice(choiceIndex);
                if (consequence?.responseText || consequence?.immediateReaction || consequence?.changes?.length || consequence?.temporary?.length) {
                    this.modals.afficherModaleConsequences(consequence, finish);
                } else finish();
            });
            return;
        }

        if (result.coachEvent) {
            this.modals.afficherModaleCoach(result.coachEvent, choiceIndex => {
                const consequence = this.ui.gateway?.resolveCoachChoice(choiceIndex);
                if (consequence?.responseText || consequence?.immediateReaction || consequence?.changes?.length || consequence?.temporary?.length) {
                    this.modals.afficherModaleConsequences(consequence, finish);
                } else finish();
            });
            return;
        }

        if (result.transferOffer) {
            this.modals.afficherModaleTransfer(result.transferOffer);
            return;
        }

        finish();
    }

    handlePostInteraction() {
        const state = this.ui.gateway?.state;
        if (!state) return;

        if (state.pendingPositionProposal) {
            const proposal = state.pendingPositionProposal;
            this.modals.afficherModaleMatchDilemma({
                title: '🧠 Le coach vous voit autrement',
                description: proposal.message || 'Le coach envisage de te faire évoluer sur le terrain.',
                choices: [
                    { text: `✅ Essayer ${proposal.to}`, impacts: {} },
                    { text: '❌ Rester à mon poste', impacts: {} }
                ]
            }, (_, index) => {
                this.ui.gateway?.resolvePositionProposal(index === 0);
                this.ui.renderDashboard();
                this.handlePostInteraction();
            });
            return;
        }

        if (state.pendingTransferOffer) this.modals.afficherModaleTransfer(state.pendingTransferOffer);
    }
}

export default BlockResultController;

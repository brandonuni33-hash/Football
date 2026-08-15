// ui/views/dashboardView.js
// Accueil Carrière : montrer uniquement où j'en suis, ce qui arrive et ce qui mérite une décision.
import { buildCareerHubModel } from '../career/careerHubPresenter.js';

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function notificationIcon(note) {
    const category = String(note?.category || note?.type || '').toLowerCase();
    if (category.includes('match')) return '⚽';
    if (category.includes('coach')) return '◉';
    if (category.includes('transfer') || category.includes('mercato')) return '⇄';
    if (category.includes('family') || category.includes('famille')) return '⌂';
    if (category.includes('medical') || category.includes('bless')) return '+';
    return '•';
}

function focusIcon(kind) {
    if (kind === 'match' || kind === 'fixture') return '⚽';
    if (kind === 'decision') return '◆';
    return '›';
}

export class DashboardView {
    constructor({ ui, gateway, narrativePresenter = null } = {}) {
        this.ui = ui;
        this.gateway = gateway;
        this.narrativePresenter = narrativePresenter;
    }

    render(state) {
        const journalEntries = this.narrativePresenter?.getJournal?.(state) || [];
        const model = buildCareerHubModel(state, journalEntries);
        const journalCount = Math.min(99, model.unreadCount + model.journal.length);
        const fitness = model.player.fitness === null ? null : String(model.player.fitness);

        return `
            <div class="phone-frame immersive-dashboard" data-space="career">
                <div class="phone-status-bar immersive-status-bar">
                    <span>${escapeHtml(model.period)}</span>
                    <span class="immersive-brand">STREET <b>TO PRO</b></span>
                    <button type="button" data-space-link="settings" aria-label="Réglages" style="justify-self:end;border:0;background:transparent;color:#9cafc1;font-size:1rem;">⚙</button>
                </div>

                <main class="phone-home-screen immersive-home" style="gap:13px;">
                    <header style="padding:5px 2px 1px;display:flex;justify-content:space-between;gap:12px;align-items:flex-end;">
                        <div style="min-width:0;">
                            <span style="display:block;color:#7ccfd0;font-size:.56rem;font-weight:900;letter-spacing:.11em;">CARRIÈRE</span>
                            <h1 style="margin:5px 0 0;color:#f8fbff;font-size:1.34rem;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(model.player.name)}</h1>
                            <p style="margin:6px 0 0;color:#93a6ba;font-size:.68rem;">${model.player.age} ans · ${escapeHtml(model.player.position)} · ${escapeHtml(model.player.club)}</p>
                        </div>
                        ${fitness ? `<div style="flex:none;text-align:right;"><small style="display:block;color:#718499;font-size:.48rem;font-weight:900;letter-spacing:.08em;">FORME</small><strong style="display:block;margin-top:3px;color:#dce8f4;font-size:.78rem;">${escapeHtml(fitness)}</strong></div>` : ''}
                    </header>

                    <section class="app-pane" data-career-situation style="margin:0;border-color:rgba(110,221,241,.15);background:linear-gradient(145deg,rgba(14,24,37,.94),rgba(6,11,18,.93));">
                        <span style="display:block;color:#718da2;font-size:.52rem;font-weight:900;letter-spacing:.1em;">${escapeHtml(model.situation.eyebrow)}</span>
                        <strong style="display:block;margin-top:7px;color:#f8fbff;font-size:1rem;line-height:1.25;">${escapeHtml(model.situation.title)}</strong>
                        ${model.situation.detail ? `<p style="margin:7px 0 0;color:#9eafbf;font-size:.74rem;line-height:1.45;">${escapeHtml(model.situation.detail)}</p>` : ''}
                    </section>

                    <section class="app-pane" data-next-challenge style="margin:0;padding:15px;border-color:rgba(226,190,92,.2);background:linear-gradient(145deg,rgba(35,30,20,.78),rgba(8,13,19,.95));">
                        <div style="display:flex;gap:11px;align-items:flex-start;">
                            <span style="width:34px;height:34px;display:grid;place-items:center;flex:none;border-radius:11px;background:rgba(226,190,92,.09);color:#ddc273;font-weight:900;">${focusIcon(model.nextChallenge.kind)}</span>
                            <div style="min-width:0;flex:1;">
                                <span style="display:block;color:#b8a36d;font-size:.5rem;font-weight:900;letter-spacing:.1em;">PROCHAIN ENJEU</span>
                                <strong style="display:block;margin-top:5px;color:#fff9e9;font-size:.9rem;line-height:1.25;">${escapeHtml(model.nextChallenge.title)}</strong>
                                ${model.nextChallenge.detail ? `<p style="margin:5px 0 0;color:#a9a491;font-size:.68rem;line-height:1.4;">${escapeHtml(model.nextChallenge.detail)}</p>` : ''}
                            </div>
                        </div>
                    </section>

                    <button id="play-block-btn" class="btn-play-block immersive-advance" ${model.careerEnded ? 'disabled' : ''} type="button" style="margin-top:1px;">
                        <span class="advance-symbol">»</span>
                        <span><strong>${model.careerEnded ? 'CARRIÈRE TERMINÉE' : 'CONTINUER LA CARRIÈRE'}</strong><small>${escapeHtml(model.nextChallenge.title)}</small></span>
                    </button>

                    <nav aria-label="Espaces de carrière" style="display:grid;grid-template-columns:1fr 1fr;gap:9px;">
                        <button type="button" data-space-link="life" style="padding:13px;border:1px solid rgba(110,221,241,.13);border-radius:15px;background:rgba(7,13,21,.88);color:#dce8f4;text-align:left;"><small style="display:block;color:#6f8397;font-size:.49rem;font-weight:900;letter-spacing:.08em;">QUI COMPTE</small><strong style="display:block;margin-top:4px;font-size:.8rem;">Vie</strong></button>
                        <button type="button" data-space-link="player" style="padding:13px;border:1px solid rgba(110,221,241,.13);border-radius:15px;background:rgba(7,13,21,.88);color:#dce8f4;text-align:left;"><small style="display:block;color:#6f8397;font-size:.49rem;font-weight:900;letter-spacing:.08em;">TON ÉVOLUTION</small><strong style="display:block;margin-top:4px;font-size:.8rem;">Joueur</strong></button>
                    </nav>

                    <section class="dashboard-notification-zone immersive-journal ${journalCount ? 'has-notifications' : 'is-empty'}">
                        <button class="career-journal-bar" type="button" aria-expanded="false" data-journal-toggle>
                            <span class="journal-icon">◫</span>
                            <span class="journal-title">Historique</span>
                            <span class="journal-count">${journalCount}</span>
                            <span class="journal-preview">${escapeHtml(model.journal[0]?.title || model.signals[0]?.title || 'Les moments qui comptent')}</span>
                            <span class="journal-chevron">›</span>
                        </button>
                        <div class="career-journal-drawer" hidden>
                            <div class="career-journal-header"><strong>Historique de carrière</strong><button class="journal-close" type="button" aria-label="Fermer">×</button></div>
                            <div class="career-journal-list">
                                ${model.journal.map(entry => `<article class="career-journal-item priority-info"><span class="journal-item-icon">${notificationIcon(entry)}</span><div class="journal-item-copy"><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.text)}</p></div></article>`).join('')}
                                ${model.signals.map(note => `<button class="career-journal-item priority-info" type="button" data-notification-id="${escapeHtml(note.id)}"><span class="journal-item-icon">${notificationIcon(note)}</span><span class="journal-item-copy"><strong>${escapeHtml(note.title || 'Actualité')}</strong><p>${escapeHtml(note.body || note.message || '')}</p></span></button>`).join('') || (!model.journal.length ? '<p class="journal-empty">Aucun moment important enregistré.</p>' : '')}
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('#play-block-btn')?.addEventListener('click', () => {
            if (!this.gateway.state) return;
            this.ui?.handleBlockResult?.(this.gateway.playNextBlock(null));
        });

        root?.querySelectorAll('[data-space-link]').forEach(button => button.addEventListener('click', () => {
            this.ui.activeApp = button.dataset.spaceLink;
            this.ui.renderActiveApp?.();
        }));

        const zone = root?.querySelector('.dashboard-notification-zone');
        const drawer = zone?.querySelector('.career-journal-drawer');
        const toggle = zone?.querySelector('[data-journal-toggle]');
        const setOpen = open => {
            zone?.classList.toggle('is-open', open);
            if (drawer) drawer.hidden = !open;
            toggle?.setAttribute('aria-expanded', String(open));
        };
        toggle?.addEventListener('click', () => setOpen(!zone.classList.contains('is-open')));
        zone?.querySelector('.journal-close')?.addEventListener('click', event => { event.stopPropagation(); setOpen(false); });
        zone?.querySelectorAll('[data-notification-id]').forEach(card => card.addEventListener('click', () => this.ui?.openNotification?.(card.dataset.notificationId)));
    }
}

export default DashboardView;

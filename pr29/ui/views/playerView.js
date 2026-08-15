// ui/views/playerView.js
// Espace Joueur : identité, état, qualités, statistiques utiles et focus d'entraînement.

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const numberOrDash = value => Number.isFinite(Number(value)) ? Math.round(Number(value)) : '—';

function stat(stats = {}, ...keys) {
    for (const key of keys) {
        if (Number.isFinite(Number(stats[key]))) return Number(stats[key]);
    }
    return 0;
}

function moraleLabel(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'Stable';
    if (number >= 75) return 'Très bon';
    if (number >= 55) return 'Bon';
    if (number >= 35) return 'Fragile';
    return 'Bas';
}

export class PlayerView {
    constructor({ ui, gateway } = {}) { this.ui = ui; this.gateway = gateway; }

    render(state = this.gateway?.state, focusTypes = {}) {
        const player = state?.player || {};
        const stats = player.stats || {};
        const attributes = player.attributes || {};
        const currentFocus = state?.trainingFocus || '';
        const name = `${player.firstname || player.firstName || ''} ${player.lastname || player.lastName || ''}`.trim() || 'Joueur';
        const qualities = [
            ['Vitesse', attributes.vitesse],
            ['Contrôle', attributes.controle ?? attributes.dribble],
            ['Dribble', attributes.dribble],
            ['Passe', attributes.passe],
            ['Finition', attributes.finition ?? attributes.tir],
            ['Défense', attributes.defense],
            ['Puissance', attributes.puissance ?? attributes.physique],
            ['Endurance', attributes.endurance]
        ];

        return `<div style="display:grid;gap:11px;">
            <header><span style="color:#7ccfd0;font-size:.56rem;font-weight:900;letter-spacing:.1em;">JOUEUR</span><h2 style="margin:5px 0 2px;font-size:1.3rem;">${escapeHtml(name)}</h2><p style="margin:0;color:var(--text-sub);font-size:.75rem;">${Number(player.age) || 14} ans · ${escapeHtml(player.position || player.positionId || 'Joueur')} · ${escapeHtml(player.club || 'Sans club')}</p></header>

            <section class="app-pane" style="margin:0;">
                <small style="color:#7ccfd0;font-weight:900;letter-spacing:.08em;">ÉTAT ACTUEL</small>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;text-align:center;">
                    <div class="stat-pill" style="display:block;"><small>Forme</small><strong style="display:block;margin-top:3px;">${escapeHtml(numberOrDash(player.form ?? player.fitness))}</strong></div>
                    <div class="stat-pill" style="display:block;"><small>Condition</small><strong style="display:block;margin-top:3px;">${escapeHtml(numberOrDash(player.fitness ?? player.condition))}</strong></div>
                    <div class="stat-pill" style="display:block;"><small>Moral</small><strong style="display:block;margin-top:3px;font-size:.74rem;">${escapeHtml(moraleLabel(player.morale ?? player.moral))}</strong></div>
                </div>
            </section>

            <section class="app-pane" style="margin:0;">
                <small style="color:#7ccfd0;font-weight:900;letter-spacing:.08em;">TES QUALITÉS</small>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">${qualities.map(([label, value]) => `<div class="stat-pill"><span>${escapeHtml(label)}</span><strong>${escapeHtml(numberOrDash(value))}</strong></div>`).join('')}</div>
            </section>

            <section class="app-pane" style="margin:0;">
                <small style="color:#7ccfd0;font-weight:900;letter-spacing:.08em;">SAISON</small>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;text-align:center;">
                    <div class="stat-pill" style="display:block;"><small>Matchs</small><strong style="display:block;">${stat(stats, 'matchesPlayed', 'matches', 'appearances')}</strong></div>
                    <div class="stat-pill" style="display:block;"><small>Buts</small><strong style="display:block;">${stat(stats, 'goals', 'buts')}</strong></div>
                    <div class="stat-pill" style="display:block;"><small>Passes D.</small><strong style="display:block;">${stat(stats, 'assists', 'passesDecisives')}</strong></div>
                </div>
            </section>

            <section class="app-pane" style="margin:0;">
                <small style="color:#d4a665;font-weight:900;letter-spacing:.08em;">ENTRAÎNEMENT</small>
                <strong style="display:block;margin-top:6px;font-size:.86rem;">Ce que tu travailles en priorité</strong>
                <div style="display:grid;gap:7px;margin-top:10px;">${Object.entries(focusTypes).map(([key, focus]) => `<button type="button" class="btn-event-choice" data-player-training-focus="${escapeHtml(key)}" style="margin:0;text-align:left;${key === currentFocus ? 'border-color:rgba(226,190,92,.42);background:rgba(226,190,92,.08);' : ''}"><strong>${escapeHtml(focus?.name || key)}</strong>${focus?.description ? `<small style="display:block;margin-top:3px;color:var(--text-sub);font-weight:500;">${escapeHtml(focus.description)}</small>` : ''}</button>`).join('')}</div>
            </section>
        </div>`;
    }

    bind(root) {
        root?.querySelectorAll('[data-player-training-focus]').forEach(button => button.addEventListener('click', () => {
            this.gateway.setTrainingFocus(button.dataset.playerTrainingFocus);
            this.ui?.renderActiveApp?.();
        }));
    }
}

export default PlayerView;

// ui/views/dashboardView.js
// Vue canonique du shell dashboard. Aucun accès direct au domaine.

export class DashboardView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player || {};
        const calendar = state?.calendar || {};
        const media = state?.media || {};
        const year = calendar.currentSeasonYear || '';
        const seasonPeriod = calendar.currentPeriod || 'Pré-saison';
        const playerName = `${player.firstname || ''} ${player.lastname || ''}`.trim() || 'Joueur';
        const apps = [
            ['career', '⚽', 'Carrière', 'linear-gradient(135deg,#1e3a8a,#3b82f6)'],
            ['social', '📱', 'Instafoot', 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)'],
            ['messages', '💬', 'Messages', 'linear-gradient(135deg,#059669,#10b981)'],
            ['bank', '🏦', 'Banque', 'linear-gradient(135deg,#d97706,#f59e0b)'],
            ['stats', '📊', 'Stats', 'linear-gradient(135deg,#4f46e5,#6366f1)'],
            ['training', '🏋️‍♂️', 'Entraînement', 'linear-gradient(135deg,#dc2626,#ef4444)'],
            ['transfers', '🔄', 'Mercato', 'linear-gradient(135deg,#0891b2,#06b6d4)'],
            ['settings', '⚙️', 'Réglages', 'linear-gradient(135deg,#475569,#64748b)'],
            ['family', '👨‍👩‍👦', 'Famille', 'linear-gradient(135deg,#be185d,#ec4899)']
        ];

        return `
            <div class="phone-frame">
                <div class="phone-status-bar"><span>9:41</span><span>⚽ Street to Pro</span><span>🔋 100%</span></div>
                <div class="phone-home-screen">
                    <div class="player-widget-enhanced">
                        <div class="widget-header-line"><span>📅 Saison ${year}</span><span>${seasonPeriod}</span></div>
                        <div class="player-card-banner">
                            <div class="player-image-badge"><span class="jersey-number">${player.number ?? '—'}</span></div>
                            <div class="player-main-info">
                                <div class="widget-title"><span>${playerName}</span><span class="player-age">${player.age ?? '—'} ans</span></div>
                                <div class="player-club-sub">📍 ${player.club || 'Sans club'} · ${player.position || player.positionId || '—'}</div>
                            </div>
                        </div>
                        <div class="widget-stats-grid">
                            <div class="stat-pill"><span>⚡ GEN</span><strong>${player.overall ?? '—'}</strong></div>
                            <div class="stat-pill"><span>✨ POT</span><strong>${player.potential ?? '—'}</strong></div>
                            <div class="stat-pill"><span>🔋 Forme</span><strong>${player.fitness ?? '—'}%</strong></div>
                            <div class="stat-pill"><span>❤️ Moral</span><strong>${player.morale ?? '—'}%</strong></div>
                            <div class="stat-pill"><span>🎂 Âge</span><strong>${player.age ?? '—'}</strong></div>
                            <div class="stat-pill"><span>💰 Solde</span><strong>${Number(state?.career?.balance || 0).toLocaleString('fr-FR')} €</strong></div>
                        </div>
                        <div class="widget-secret-tag">🔥 Hype ${media.hypeLevel || 0} · 👥 ${(media.followers || 0).toLocaleString()} abonnés</div>
                        <div class="widget-secret-tag">🚀 Développement : fenêtre d'explosion inconnue</div>
                    </div>
                    <div class="apps-grid">
                        ${apps.map(([id, icon, label, background]) => `
                            <button class="app-icon" data-app="${id}" type="button">
                                <div class="app-logo" style="background:${background};">${icon}</div>
                                <span class="app-label">${label}</span>
                                ${id === 'social' && media.recentDilemma ? '<span class="notification-badge">1</span>' : ''}
                            </button>
                        `).join('')}
                    </div>
                    <button id="settings-floating-btn" class="btn-settings-floating" title="Réglages" type="button">⚙️</button>
                    <button id="play-block-btn" class="btn-play-block" ${player.careerEnded ? 'disabled' : ''} type="button">${player.careerEnded ? '🏁 Carrière terminée' : '▶️ Lancer le prochain bloc'}</button>
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('#play-block-btn')?.addEventListener('click', () => {
            const state = this.gateway.state;
            if (!state) return;
            if (state.player?.isInjured) {
                this.ui?.handleBlockResult?.(this.gateway.playNextBlock(null));
                return;
            }
            const matchType = state.calendar?.currentMonth === 5 ? 'final' : 'standard';
            if (this.gateway.shouldTriggerMatchDilemma(matchType)) {
                const dilemma = this.gateway.getMatchDilemma(matchType, "l'adversaire");
                this.ui?.afficherModaleMatchDilemma?.(dilemma, (choice) => this.ui?.handleBlockResult?.(this.gateway.playNextBlock(choice)));
                return;
            }
            this.ui?.handleBlockResult?.(this.gateway.playNextBlock(null));
        });

        root?.querySelector('#settings-floating-btn')?.addEventListener('click', () => {
            this.ui.activeApp = 'settings';
            this.ui.renderDashboard();
        });
        root?.querySelectorAll('[data-app]')?.forEach(button => button.addEventListener('click', () => {
            this.ui.activeApp = button.dataset.app;
            this.ui.renderDashboard();
        }));
    }
}

export default DashboardView;

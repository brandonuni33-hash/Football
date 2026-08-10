// ui/views/dashboardView.js
// Vue de présentation du tableau de bord. Aucun accès direct au domaine.

export class DashboardView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player || {};
        const stats = player.stats || {};
        const calendar = state?.calendar || {};
        const media = state?.media || {};
        const notificationState = state?.notifications;
        const notificationList = Array.isArray(notificationState)
            ? notificationState
            : (notificationState?.signals || []);
        const notifications = notificationList.filter(n => !n?.read && !n?.archived);
        const next = notifications[0];

        return `
            <section class="dashboard-view" data-view="dashboard">
                <div class="player-widget-enhanced">
                    <div class="widget-header-line">
                        <span>SAISON ${calendar.currentSeasonYear || ''}</span>
                        <span>${player.club || 'Sans club'}</span>
                    </div>
                    <div class="player-card-banner">
                        <div class="player-image-badge"><span class="jersey-number">${player.number || '—'}</span></div>
                        <div class="player-main-info">
                            <div class="widget-title">${player.firstname || ''} ${player.lastname || ''}</div>
                            <div>${player.position || player.positionId || ''} · ${player.age || ''} ans</div>
                        </div>
                    </div>
                    <div class="dashboard-stat-grid">
                        <div>GEN<br><strong>${player.overall ?? '—'}</strong></div>
                        <div>BUTS<br><strong>${stats.goals || 0}</strong></div>
                        <div>PASSES D.<br><strong>${stats.assists || 0}</strong></div>
                        <div>NOTE<br><strong>${stats.averageRating ? Number(stats.averageRating).toFixed(1) : '—'}</strong></div>
                    </div>
                </div>

                ${next ? `
                    <button class="dashboard-notification-card" data-notification-id="${next.id || ''}" type="button">
                        <span class="dashboard-notification-icon">🔔</span>
                        <span class="dashboard-notification-copy">
                            <strong>${next.title || next.type || 'Nouvelle notification'}</strong>
                            <small>${next.body || next.message || next.description || 'Une nouvelle information nécessite votre attention.'}</small>
                        </span>
                        <span>›</span>
                    </button>
                ` : ''}

                <div class="dashboard-actions">
                    <button class="btn-primary" data-dashboard-action="next-block" type="button" ${player.careerEnded ? 'disabled' : ''}>
                        ${player.careerEnded ? 'Carrière terminée' : 'Lancer le prochain bloc'}
                    </button>
                </div>

                <div class="dashboard-summary">
                    <div><span>🔥 Hype</span><strong>${media.hypeLevel || 0}</strong></div>
                    <div><span>👥 Abonnés</span><strong>${(media.followers || 0).toLocaleString()}</strong></div>
                    <div><span>💪 Forme</span><strong>${player.fitness ?? 0}</strong></div>
                    <div><span>🧠 Moral</span><strong>${player.morale ?? 0}</strong></div>
                </div>
            </section>
        `;
    }

    bind(root) {
        root?.querySelector('[data-dashboard-action="next-block"]')?.addEventListener('click', () => {
            const result = this.gateway.playNextBlock();
            this.ui?.handleBlockResult?.(result);
        });

        root?.querySelector('[data-notification-id]')?.addEventListener('click', (event) => {
            const id = event.currentTarget.dataset.notificationId;
            this.ui?.openNotification?.(id);
        });
    }
}

export default DashboardView;

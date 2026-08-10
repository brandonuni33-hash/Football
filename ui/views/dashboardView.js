// ui/views/dashboardView.js
// Vue de présentation du tableau de bord. Aucun accès direct au domaine.

const OFFENSIVE_POSITIONS = new Set(['BU', 'AD', 'AG', 'MOC', 'ST', 'RW', 'LW', 'CAM']);
const DEFENSIVE_POSITIONS = new Set(['DD', 'DG', 'DC', 'RB', 'LB', 'CB']);
const GOALKEEPER_POSITIONS = new Set(['GK']);

function firstNumber(...values) {
    for (const value of values) {
        const number = Number(value);
        if (Number.isFinite(number)) return number;
    }
    return 0;
}

function formatAverageRating(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number.toFixed(1) : '—';
}

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

        const position = String(player.position || player.positionId || '').toUpperCase();
        const matches = firstNumber(stats.matches, stats.matchesPlayed, stats.appearances, stats.games);
        const goals = firstNumber(stats.goals, stats.buts);
        const assists = firstNumber(stats.assists, stats.passesDecisives);
        const tackles = firstNumber(stats.tackles, stats.tacles);
        const cleanSheets = firstNumber(stats.cleanSheets, stats.clean_sheets, stats.cleanSheet, stats.cleanSheetsCount);
        const averageRating = firstNumber(stats.averageRating, stats.average_rating, stats.ratingAverage, stats.avgRating, stats.rating);

        let roleStats;
        if (GOALKEEPER_POSITIONS.has(position)) {
            roleStats = [
                ['MATCHS', matches],
                ['CLEAN SHEETS', cleanSheets],
                ['NOTE MOY.', formatAverageRating(averageRating)]
            ];
        } else if (DEFENSIVE_POSITIONS.has(position)) {
            roleStats = [
                ['MATCHS', matches],
                ['TACLES', tackles],
                ['PASSES D.', assists],
                ['NOTE MOY.', formatAverageRating(averageRating)]
            ];
        } else {
            roleStats = [
                ['MATCHS', matches],
                ['BUTS', goals],
                ['PASSES D.', assists],
                ['NOTE MOY.', formatAverageRating(averageRating)]
            ];
        }

        const countryFlag = player.countryFlag || player.nationalityFlag || player.flag || '';
        const playerName = `${player.firstname || ''} ${player.lastname || ''}`.trim() || 'Joueur';

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
                            <div class="widget-title">
                                ${countryFlag ? `<span class="player-country-flag">${countryFlag}</span>` : ''}
                                <span>${playerName}</span>
                                <span class="player-age">${player.age ?? '—'} ans</span>
                            </div>
                            <div>${player.position || player.positionId || ''}</div>
                        </div>
                    </div>

                    <div class="dashboard-stat-grid dashboard-core-stats">
                        <div>GEN<br><strong>${player.overall ?? '—'}</strong></div>
                        <div>POT<br><strong>${player.potential ?? '—'}</strong></div>
                        <div>FORME<br><strong>${player.fitness ?? '—'}</strong></div>
                        <div>MORAL<br><strong>${player.morale ?? '—'}</strong></div>
                    </div>

                    <div class="dashboard-career-stats" aria-label="Statistiques de carrière">
                        ${roleStats.map(([label, value]) => `
                            <div class="dashboard-career-stat">
                                <span>${label}</span>
                                <strong>${value}</strong>
                            </div>
                        `).join('')}
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
                        ${player.careerEnded ? 'Carrière terminée' : 'Avancer'}
                    </button>
                </div>

                <div class="dashboard-summary">
                    <div><span>🔥 Hype</span><strong>${media.hypeLevel || 0}</strong></div>
                    <div><span>👥 Abonnés</span><strong>${(media.followers || 0).toLocaleString()}</strong></div>
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

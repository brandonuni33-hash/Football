// ui/views/dashboardView.js
// Vue canonique du dashboard. Aucun accès direct au domaine.

const COUNTRY_FLAGS = {
    France: '🇫🇷', Espagne: '🇪🇸', Spain: '🇪🇸', Allemagne: '🇩🇪', Germany: '🇩🇪',
    Angleterre: '🇬🇧', England: '🇬🇧', Italie: '🇮🇹', Italy: '🇮🇹', Portugal: '🇵🇹',
    Brésil: '🇧🇷', Brazil: '🇧🇷', Argentine: '🇦🇷', Argentina: '🇦🇷', Belgique: '🇧🇪',
    PaysBas: '🇳🇱', 'Pays-Bas': '🇳🇱', Netherlands: '🇳🇱', Maroc: '🇲🇦', Morocco: '🇲🇦',
    Sénégal: '🇸🇳', Senegal: '🇸🇳', 'Côte d’Ivoire': '🇨🇮', Cameroun: '🇨🇲', Cameroon: '🇨🇲',
    Nigeria: '🇳🇬', 'États-Unis': '🇺🇸', USA: '🇺🇸', Canada: '🇨🇦', Japon: '🇯🇵', Japan: '🇯🇵',
    'Corée du Sud': '🇰🇷', Korea: '🇰🇷'
};

const DEFENSIVE_POSITIONS = new Set(['DD', 'DG', 'DC', 'RB', 'LB', 'CB']);
const GOALKEEPER_POSITIONS = new Set(['GK', 'GB', 'G']);

const firstValue = (...values) => values.find(value => value !== undefined && value !== null && String(value).trim() !== '');

function stat(source, keys) {
    for (const key of keys) {
        const number = Number(source?.[key]);
        if (Number.isFinite(number)) return number;
    }
    return 0;
}

function flag(player) {
    const direct = player?.countryFlag || player?.nationalityFlag || player?.flag;
    if (direct && String(direct).length <= 4) return direct;

    const code = player?.countryCode || player?.nationalityCode || player?.nationCode;
    if (typeof code === 'string' && /^[A-Za-z]{2}$/.test(code)) {
        return [...code.toUpperCase()].map(char => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
    }

    const name = player?.country?.name || player?.country || player?.nationality || player?.nation;
    return typeof name === 'string' ? (COUNTRY_FLAGS[name] || '') : '';
}

function potentialStars(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '☆☆☆☆☆';
    const count = Math.max(1, Math.min(5, Math.ceil(number / 20)));
    return '★'.repeat(count) + '☆'.repeat(5 - count);
}

function academyStars(player) {
    return firstValue(
        player?.academyStars,
        player?.trainingCenterStars,
        player?.trainingCentreStars,
        player?.formationCenterStars,
        player?.academyRating,
        player?.trainingCenterRating,
        player?.trainingCentreRating
    ) ?? 3;
}

function academyText(value) {
    const number = Number(value);
    const count = Number.isFinite(number) ? Math.max(0, Math.min(5, Math.round(number))) : 3;
    return '★'.repeat(count) + '☆'.repeat(5 - count);
}

function league(player, state) {
    const leagueObject = player?.league;
    const value = firstValue(
        player?.championshipName,
        player?.championship,
        player?.leagueName,
        typeof leagueObject === 'object' ? leagueObject?.name : leagueObject,
        player?.competitionName,
        state?.club?.league?.name,
        state?.club?.championship?.name,
        state?.team?.league?.name,
        state?.team?.championship?.name,
        state?.currentLeague?.name,
        state?.competition?.name
    );
    if (value) return value;

    const club = String(player?.club || '').toLowerCase();
    if (club.includes('bordeaux')) return 'Ligue 2 BKT';
    if (club.includes('nuremberg') || club.includes('nürnberg')) return '2. Bundesliga';
    return '';
}

function contract(player) {
    return `${firstValue(player?.youthLevel, player?.teamLevel, player?.academyLevel, player?.category) || 'U15'} · ${firstValue(player?.contractType, player?.contractName, player?.contract?.type) || 'Contrat jeune'}`;
}

function rating(stats) {
    const number = stat(stats, ['averageRating', 'average_rating', 'ratingAverage', 'avgRating', 'rating']);
    return number > 0 ? number.toFixed(1) : '—';
}

function careerStats(player) {
    const stats = player?.stats || {};
    const position = String(player?.position || player?.positionId || '').toUpperCase();
    const matches = stat(stats, ['matches', 'matchesPlayed', 'appearances', 'games']);
    const assists = stat(stats, ['assists', 'passesDecisives']);
    const goals = stat(stats, ['goals', 'buts']);
    const tackles = stat(stats, ['tackles', 'tacles']);
    const cleanSheets = stat(stats, ['cleanSheets', 'clean_sheets', 'cleanSheet', 'cleanSheetsCount']);

    if (GOALKEEPER_POSITIONS.has(position)) return [['MATCHS', matches], ['CLEAN SHEETS', cleanSheets], ['NOTE MOY.', rating(stats)]];
    if (DEFENSIVE_POSITIONS.has(position)) return [['MATCHS', matches], ['TACLES', tackles], ['PASSES D.', assists], ['NOTE MOY.', rating(stats)]];
    return [['MATCHS', matches], ['BUTS', goals], ['PASSES D.', assists], ['NOTE MOY.', rating(stats)]];
}

function notificationIcon(note) {
    const category = String(note?.category || '').toLowerCase();
    if (category.includes('famille') || category.includes('family')) return '👨‍👩‍👦';
    if (category.includes('mercato') || category.includes('transfer')) return '⚽';
    if (category.includes('media') || category.includes('média')) return '📰';
    if (category.includes('match')) return '🏟️';
    if (category.includes('coach')) return '🧠';
    return '•';
}

function notificationPriority(note) {
    const category = String(note?.category || '').toLowerCase();
    return ['famille', 'family', 'mercato', 'transfer', 'coach', 'match', 'medical', 'event']
        .some(value => category.includes(value)) ? 'important' : 'info';
}

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export class DashboardView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player || {};
        const calendar = state?.calendar || {};
        const media = state?.media || {};
        const notifications = (state?.notifications?.signals || [])
            .filter(note => !note?.archived && !note?.read)
            .slice(-8)
            .reverse();
        const playerName = `${player.firstname || player.firstName || ''} ${player.lastname || player.lastName || ''}`.trim() || 'Joueur';
        const playerFlag = flag(player);
        const playerLeague = league(player, state);
        const shirtNumber = firstValue(player.number, player.shirtNumber, player.jerseyNumber);
        const stats = careerStats(player);

        return `
            <div class="phone-frame">
                <div class="phone-status-bar"><span>9:41</span><span>⚽ Street to Pro</span><span>🔋 100%</span></div>
                <div class="phone-home-screen">
                    <section class="player-widget-enhanced">
                        <div class="widget-header-line"><span>📅 Saison ${calendar.currentSeasonYear || ''}</span><span>${calendar.currentPeriod || 'Pré-saison'}</span></div>
                        <div class="live-identity-block">
                            <div class="live-player-name-line"><span class="live-player-flag">${playerFlag}</span><span class="live-player-name">${escapeHtml(playerName)}</span></div>
                            <div class="live-player-position-row"><span class="live-player-position">${escapeHtml(player.position || player.positionId || '—')}</span><span class="live-player-age">${player.age ?? '—'} ans</span></div>
                            <div class="live-club-line">${escapeHtml(player.club || 'Sans club')}</div>
                            ${playerLeague ? `<div class="live-league-line">${escapeHtml(playerLeague)}</div>` : ''}
                            <div class="live-academy-line"><span>Centre de formation</span><span class="live-academy-stars">${academyText(academyStars(player))}</span></div>
                            <div class="live-contract-line">${escapeHtml(contract(player))}</div>
                            <div class="live-shirt-line">Numéro maillot : ${escapeHtml(shirtNumber ?? '—')}</div>
                        </div>
                        <div class="widget-stats-grid live-core-stats">
                            <div class="stat-pill"><span>GEN</span><strong>${player.overall ?? '—'}</strong></div>
                            <div class="stat-pill"><span>POTENTIEL</span><strong class="live-potential-stars">${potentialStars(player.potential)}</strong></div>
                            <div class="stat-pill"><span>FORME</span><strong>${player.fitness ?? '—'}</strong></div>
                            <div class="stat-pill"><span>MORAL</span><strong>${player.morale ?? '—'}</strong></div>
                        </div>
                        <div class="live-career-stats" aria-label="Statistiques de carrière">
                            ${stats.map(([label, value]) => `<div class="live-career-stat"><span>${label}</span><strong>${value}</strong></div>`).join('')}
                        </div>
                    </section>

                    <section class="dashboard-notification-zone ${notifications.length ? 'has-notifications' : 'is-empty'}">
                        <button class="career-journal-bar" type="button" aria-expanded="false" data-journal-toggle>
                            <span class="journal-icon">🔔</span><span class="journal-title">Journal de carrière</span>
                            <span class="journal-count">${notifications.length}</span>
                            ${notifications.length ? `<span class="journal-preview">${escapeHtml(notifications[0]?.title || 'Nouvelle actualité')}</span>` : ''}
                            <span class="journal-chevron">›</span>
                        </button>
                        <div class="career-journal-drawer" hidden>
                            <div class="career-journal-header"><strong>Journal de carrière</strong><button class="journal-close" type="button" aria-label="Fermer">×</button></div>
                            <div class="career-journal-list">
                                ${notifications.map(note => `
                                    <article class="career-journal-item priority-${notificationPriority(note)}" data-notification-id="${escapeHtml(note.id)}">
                                        <span class="journal-item-icon">${notificationIcon(note)}</span>
                                        <div class="journal-item-copy"><strong>${escapeHtml(note.title || 'Notification')}</strong><p>${escapeHtml(note.body || note.message || '')}</p></div>
                                    </article>
                                `).join('') || '<p class="journal-empty">Aucune actualité récente.</p>'}
                            </div>
                        </div>
                    </section>

                    <div class="live-section-title"><span>Applications</span></div>
                    <div class="apps-grid">${this.renderApps(state)}</div>
                    <button id="settings-floating-btn" class="btn-settings-floating" title="Réglages" type="button">⚙️</button>
                    <button id="play-block-btn" class="btn-play-block app-advance-icon" ${player.careerEnded ? 'disabled' : ''} type="button">${player.careerEnded ? 'Carrière terminée' : 'Avancer'}</button>
                </div>
            </div>
        `;
    }

    renderApps(state) {
        const media = state?.media || {};
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
        return apps.map(([id, icon, label, background]) => `
            <button class="app-icon" data-app="${id}" type="button"><div class="app-logo" style="background:${background};">${icon}</div><span class="app-label">${label}</span>${id === 'social' && media.recentDilemma ? '<span class="notification-badge">1</span>' : ''}</button>
        `).join('');
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
                this.ui?.afficherModaleMatchDilemma?.(dilemma, choice => this.ui?.handleBlockResult?.(this.gateway.playNextBlock(choice)));
                return;
            }
            this.ui?.handleBlockResult?.(this.gateway.playNextBlock(null));
        });

        root?.querySelector('#settings-floating-btn')?.addEventListener('click', () => {
            this.ui.activeApp = 'settings';
            this.ui.renderActiveApp?.();
        });
        root?.querySelectorAll('[data-app]')?.forEach(button => button.addEventListener('click', () => {
            this.ui.activeApp = button.dataset.app;
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
        zone?.querySelector('.journal-close')?.addEventListener('click', event => {
            event.stopPropagation();
            setOpen(false);
        });
        zone?.querySelectorAll('[data-notification-id]').forEach(card => card.addEventListener('click', () => this.ui?.openNotification?.(card.dataset.notificationId)));
    }
}

export default DashboardView;

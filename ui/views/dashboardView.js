// ui/views/dashboardView.js
// Vue canonique du dashboard. Présentation uniquement : aucun effet métier ici.

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

    if (GOALKEEPER_POSITIONS.has(position)) return [['MATCHS', matches], ['CLEAN SHEETS', cleanSheets], ['NOTE', rating(stats)]];
    if (DEFENSIVE_POSITIONS.has(position)) return [['MATCHS', matches], ['TACLES', tackles], ['PASSES D.', assists], ['NOTE', rating(stats)]];
    return [['MATCHS', matches], ['BUTS', goals], ['PASSES D.', assists], ['NOTE', rating(stats)]];
}

function notificationIcon(note) {
    const category = String(note?.category || '').toLowerCase();
    if (category.includes('famille') || category.includes('family')) return '⌂';
    if (category.includes('mercato') || category.includes('transfer') || category.includes('scout')) return '⇄';
    if (category.includes('media') || category.includes('média')) return '◫';
    if (category.includes('match')) return '⚽';
    if (category.includes('coach')) return '◉';
    return '•';
}

function notificationPriority(note) {
    const category = String(note?.category || '').toLowerCase();
    return ['famille', 'family', 'mercato', 'transfer', 'coach', 'match', 'medical', 'event']
        .some(value => category.includes(value)) ? 'important' : 'info';
}

function isSocialNotification(note) {
    const category = String(note?.category || note?.type || '').toLowerCase();
    return category.includes('media') || category.includes('média') || category.includes('social') || category.includes('réseau');
}

function moraleLabel(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 'STABLE';
    if (number >= 75) return 'ÉLEVÉ';
    if (number >= 55) return 'BON';
    if (number >= 35) return 'FRAGILE';
    return 'BAS';
}

function formatMoney(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)} M€`;
    if (Math.abs(number) >= 1_000) return `${Math.round(number / 1_000)} k€`;
    return `${Math.round(number)} €`;
}

function overallValue(player) {
    const number = Number(firstValue(player?.overall, player?.general, player?.rating));
    return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
}

function appIconSvg(id) {
    const icons = {
        career: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5 15 7l-1.2 4.1H10.2L9 7l3-3.5ZM3.8 10.2l4.1-.2 2.3 3-1.4 3.8-4 1.4M20.2 10.2l-4.1-.2-2.3 3 1.4 3.8 4 1.4M8.8 16.8 12 14.5l3.2 2.3-1.2 3.7h-4Z"/></svg>',
        transfers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/></svg>',
        social: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
        family: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.8 20c.5-4 2.5-6 5.2-6s4.7 2 5.2 6"/><path d="M14.2 15c.8-.8 1.7-1.2 2.8-1.2 2.3 0 3.8 1.7 4.2 5"/></svg>',
        stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
        training: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4-7 16h14L12 4Z"/><path d="M8 14h8"/><path d="M10 10h4"/></svg>',
        bank: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16"/><path d="M5.5 9v8M9.8 9v8M14.2 9v8M18.5 9v8"/><path d="M3 19h18M12 3 3 7h18l-9-4Z"/></svg>',
        settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 14.8 6L14.5 3h-5l-.3 3a8 8 0 0 0-1.7 1.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A8 8 0 0 0 9.2 18l.3 3h5l.3-3a8 8 0 0 0 1.7-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></svg>'
    };
    return icons[id] || '';
}

const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export class DashboardView {
    constructor({ ui, gateway, narrativePresenter = null } = {}) {
        this.ui = ui;
        this.gateway = gateway;
        this.narrativePresenter = narrativePresenter;
    }

    render(state) {
        const player = state?.player || {};
        const calendar = state?.calendar || {};
        const media = state?.media || {};
        const allSignals = (state?.notifications?.signals || []).filter(note => !note?.archived);
        const careerSignals = allSignals.filter(note => !isSocialNotification(note));
        const notifications = careerSignals.filter(note => !note?.read).slice(-8).reverse();
        const narrativeEntries = (this.narrativePresenter?.getJournal?.(state) || []).slice(0, 8);
        const journalCount = Math.min(99, notifications.length + narrativeEntries.length);
        const latestSignal = notifications[0] || careerSignals.at(-1) || null;
        const coachSignal = [...allSignals].reverse().find(note => String(note?.category || '').toLowerCase().includes('coach')) || null;
        const playerName = `${player.firstname || player.firstName || ''} ${player.lastname || player.lastName || ''}`.trim() || 'Joueur';
        const playerFlag = flag(player);
        const rawStats = player?.stats || {};
        const goals = stat(rawStats, ['goals', 'buts']);
        const assists = stat(rawStats, ['assists', 'passesDecisives']);
        const overall = overallValue(player);
        const fitness = firstValue(player.fitness, player.form, player.condition, '—');
        const morale = firstValue(player.morale, player.moral, '—');
        const balance = firstValue(state?.economy?.balance, state?.finances?.balance, player?.money, state?.money);
        const currentPeriod = firstValue(calendar.currentPeriod, calendar.periodLabel, calendar.currentMonth ? `Mois ${calendar.currentMonth}` : null, 'Pré-saison');
        const avatarInitials = playerName.split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
        const seasonYear = calendar.currentSeasonYear || '—';
        const position = player.position || player.positionId || 'JOUEUR';

        return `
            <div class="phone-frame immersive-dashboard">
                <div class="phone-status-bar immersive-status-bar">
                    <span>${escapeHtml(currentPeriod)}</span>
                    <span class="immersive-brand">STREET <b>TO PRO</b></span>
                    <span>● ${escapeHtml(formatMoney(balance))}</span>
                </div>

                <main class="phone-home-screen immersive-home">
                    <section class="immersive-player-card" aria-label="Profil joueur">
                        <div class="immersive-player-glow"></div>
                        <div class="immersive-overall-ring" style="--overall:${overall}" aria-label="Général ${overall} sur 100">
                            <div class="immersive-overall-core">
                                <strong>${overall}</strong>
                                <small>/100</small>
                                <span>GÉN</span>
                            </div>
                        </div>
                        <div class="immersive-player-avatar" aria-hidden="true">${escapeHtml(avatarInitials || 'ST')}</div>
                        <div class="immersive-player-copy">
                            <div class="immersive-player-name">${playerFlag ? `<span class="immersive-name-flag">${playerFlag}</span>` : ''}<span>${escapeHtml(playerName)}</span></div>
                            <div class="immersive-player-role"><span class="immersive-age-inline">${player.age ?? '—'} ANS</span><span class="immersive-role-separator">·</span><span>${escapeHtml(position)}</span></div>
                            <div class="immersive-club-row"><span>◈</span><strong>${escapeHtml(player.club || 'Sans club')}</strong></div>
                            <div class="immersive-season-row">SAISON ${escapeHtml(seasonYear)} · <b>${player.careerEnded ? 'CARRIÈRE TERMINÉE' : 'EN ACTIVITÉ'}</b></div>
                            <div class="immersive-potential-row"><span>POTENTIEL</span><strong>${potentialStars(player.potential)}</strong></div>
                        </div>
                        <div class="immersive-energy"><span>⚡</span><strong>${escapeHtml(fitness)}</strong></div>

                        <div class="immersive-stat-strip">
                            <div><strong>${goals}</strong><span>BUTS</span></div>
                            <div><strong>${assists}</strong><span>PASSES D.</span></div>
                            <div><strong>${escapeHtml(rating(rawStats))}</strong><span>NOTE MOY.</span></div>
                            <div class="immersive-morale"><strong>●</strong><span>MORAL ${escapeHtml(moraleLabel(morale))}</span></div>
                        </div>
                    </section>

                    <section class="immersive-alert-card ${latestSignal ? '' : 'is-quiet'}">
                        <div class="immersive-alert-icon">${latestSignal ? notificationIcon(latestSignal) : '◌'}</div>
                        <div class="immersive-alert-copy">
                            <strong>${escapeHtml(latestSignal?.title || 'La carrière suit son cours')}</strong>
                            <span>${escapeHtml(latestSignal?.body || latestSignal?.message || 'Aucune alerte prioritaire pour le moment.')}</span>
                        </div>
                        ${notifications.length ? `<span class="immersive-unread-dot">${notifications.length}</span>` : '<span class="immersive-status-dot"></span>'}
                    </section>

                    <button class="immersive-message-card" type="button" data-app="messages">
                        <span class="immersive-message-avatar">CM</span>
                        <span class="immersive-message-copy">
                            <span class="immersive-message-head"><strong>Coach</strong><small>${coachSignal ? 'Nouveau' : 'Staff'}</small></span>
                            <span>${escapeHtml(coachSignal?.body || coachSignal?.message || coachSignal?.title || 'Reste concentré. La prochaine échéance approche.')}</span>
                        </span>
                        <span class="immersive-message-chevron">›</span>
                    </button>

                    <section class="dashboard-notification-zone immersive-journal ${journalCount ? 'has-notifications' : 'is-empty'}">
                        <button class="career-journal-bar" type="button" aria-expanded="false" data-journal-toggle>
                            <span class="journal-icon">◫</span>
                            <span class="journal-title">Journal de carrière</span>
                            <span class="journal-count">${journalCount}</span>
                            <span class="journal-preview">${escapeHtml(narrativeEntries[0]?.title || notifications[0]?.title || 'Voir les dernières nouvelles')}</span>
                            <span class="journal-chevron">›</span>
                        </button>
                        <div class="career-journal-drawer" hidden>
                            <div class="career-journal-header"><strong>Journal de carrière</strong><button class="journal-close" type="button" aria-label="Fermer">×</button></div>
                            <div class="career-journal-list">
                                ${narrativeEntries.map(entry => `
                                    <article class="career-journal-item priority-${['important', 'major', 'exceptional'].includes(entry.importance) ? 'important' : 'info'}" data-narrative-entry-id="${escapeHtml(entry.id)}">
                                        <span class="journal-item-icon">${notificationIcon(entry)}</span>
                                        <div class="journal-item-copy"><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.text)}</p></div>
                                    </article>
                                `).join('')}
                                ${notifications.map(note => `
                                    <article class="career-journal-item priority-${notificationPriority(note)}" data-notification-id="${escapeHtml(note.id)}">
                                        <span class="journal-item-icon">${notificationIcon(note)}</span>
                                        <div class="journal-item-copy"><strong>${escapeHtml(note.title || 'Notification')}</strong><p>${escapeHtml(note.body || note.message || '')}</p></div>
                                    </article>
                                `).join('') || (!narrativeEntries.length ? '<p class="journal-empty">Aucune actualité récente.</p>' : '')}
                            </div>
                        </div>
                    </section>

                    <div class="immersive-apps-heading"><span>TA VIE</span></div>
                    <div class="apps-grid immersive-app-grid">${this.renderApps(state)}</div>

                    <button id="play-block-btn" class="btn-play-block immersive-advance" ${player.careerEnded ? 'disabled' : ''} type="button">
                        <span class="advance-symbol">»</span>
                        <span><strong>${player.careerEnded ? 'CARRIÈRE TERMINÉE' : 'AVANCER'}</strong><small>${escapeHtml(currentPeriod)}</small></span>
                    </button>

                    <section class="immersive-pulse" aria-label="Tendances de carrière">
                        <div><span>FORME</span><strong>${escapeHtml(fitness)}</strong></div>
                        <div><span>MORAL</span><strong>${escapeHtml(moraleLabel(morale))}</strong></div>
                        <div><span>PRESSE</span><strong>${media?.reputation > 60 ? 'POSITIVE' : media?.reputation < 35 ? 'SOUS PRESSION' : 'NEUTRE'}</strong></div>
                    </section>
                </main>
            </div>
        `;
    }

    renderApps(state) {
        const media = state?.media || {};
        const allSignals = (state?.notifications?.signals || []).filter(note => !note?.archived && !note?.read);
        const unreadCareer = allSignals.filter(note => !isSocialNotification(note)).length;
        const unreadSocial = allSignals.filter(note => isSocialNotification(note)).length;
        const apps = [
            ['career', 'Carrière', 'cyan'],
            ['transfers', 'Mercato', 'cyan'],
            ['social', 'Réseaux', 'pink'],
            ['family', 'Famille', 'violet'],
            ['stats', 'Stats', 'blue'],
            ['training', 'Entraînement', 'orange'],
            ['bank', 'Banque', 'gold'],
            ['settings', 'Réglages', 'slate']
        ];
        return apps.map(([id, label, tone]) => {
            const socialBadge = Math.max(unreadSocial, media.recentDilemma ? 1 : 0);
            const badge = id === 'social' ? Math.min(9, socialBadge)
                : id === 'transfers' && state?.pendingTransferOffer ? 1
                : id === 'career' && unreadCareer ? Math.min(9, unreadCareer)
                : 0;
            return `
                <button class="app-icon immersive-app" data-app="${id}" type="button">
                    <div class="app-logo immersive-app-logo tone-${tone}"><span class="immersive-app-glyph">${appIconSvg(id)}</span></div>
                    <span class="app-label">${label}</span>
                    ${badge ? `<span class="notification-badge">${badge}</span>` : ''}
                </button>
            `;
        }).join('');
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

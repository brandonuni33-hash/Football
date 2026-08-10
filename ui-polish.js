// ui-polish.js
// Ajustements visuels ciblés du Dashboard et des offres de contrat.
// Ne touche pas à la logique de jeu : il ne fait que transformer l'affichage.

const COUNTRY_FLAGS = {
    France: '🇫🇷',
    Angleterre: '🇬🇧',
    Espagne: '🇪🇸',
    Italie: '🇮🇹',
    Allemagne: '🇩🇪',
    Portugal: '🇵🇹',
    Belgique: '🇧🇪',
    PaysBas: '🇳🇱',
    'Pays-Bas': '🇳🇱',
    Suisse: '🇨🇭',
    Autriche: '🇦🇹',
    Croatie: '🇭🇷',
    Serbie: '🇷🇸',
    Brésil: '🇧🇷',
    Argentine: '🇦🇷',
    Uruguay: '🇺🇾',
    Colombie: '🇨🇴',
    Mexique: '🇲🇽',
    ÉtatsUnis: '🇺🇸',
    'États-Unis': '🇺🇸',
    Canada: '🇨🇦',
    Japon: '🇯🇵',
    Corée: '🇰🇷',
    'Corée du Sud': '🇰🇷',
    Sénégal: '🇸🇳',
    Maroc: '🇲🇦',
    Algérie: '🇩🇿',
    Tunisie: '🇹🇳',
    Cameroun: '🇨🇲',
    Ghana: '🇬🇭',
    Nigeria: '🇳🇬',
    CôteIvoire: '🇨🇮',
    "Côte d'Ivoire": '🇨🇮'
};

function normalizeCountry(value = '') {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’']/g, '')
        .replace(/\s+/g, '')
        .replace(/-/g, '')
        .toLowerCase();
}

const FLAG_BY_NORMALIZED_COUNTRY = Object.fromEntries(
    Object.entries(COUNTRY_FLAGS).map(([country, flag]) => [normalizeCountry(country), flag])
);

function flagFor(country) {
    if (!country) return '🌍';
    return FLAG_BY_NORMALIZED_COUNTRY[normalizeCountry(country)] || '🌍';
}

function injectPolishStyles() {
    if (document.getElementById('ui-polish-styles')) return;

    const style = document.createElement('style');
    style.id = 'ui-polish-styles';
    style.textContent = `
        .player-identity-line {
            display: flex;
            align-items: baseline;
            flex-wrap: wrap;
            gap: 8px;
            line-height: 1.15;
        }

        .player-country-flag {
            font-size: 1.25rem;
            line-height: 1;
        }

        .player-age-label {
            font-size: .86rem;
            font-weight: 700;
            color: #cbd5e1;
            white-space: nowrap;
        }

        .dashboard-season-stats {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 7px;
            margin-top: 2px;
        }

        .dashboard-season-stat {
            min-width: 0;
            padding: 9px 6px;
            border-radius: 12px;
            text-align: center;
            background: rgba(255,255,255,.055);
            border: 1px solid rgba(255,255,255,.10);
        }

        .dashboard-season-stat-label {
            display: block;
            color: #94a3b8;
            font-size: .66rem;
            font-weight: 700;
            white-space: nowrap;
        }

        .dashboard-season-stat-value {
            display: block;
            margin-top: 3px;
            color: #fff;
            font-size: .98rem;
            font-weight: 900;
        }

        .offer-club-flag {
            margin-right: 7px;
            font-size: 1.1em;
        }

        .offer-league-clean {
            font-weight: 700;
        }

        @media (max-width: 380px) {
            .dashboard-season-stats { gap: 5px; }
            .dashboard-season-stat { padding-left: 3px; padding-right: 3px; }
            .dashboard-season-stat-label { font-size: .59rem; }
            .dashboard-season-stat-value { font-size: .9rem; }
        }
    `;
    document.head.appendChild(style);
}

function patchDashboard() {
    const widget = document.querySelector('.player-widget-enhanced');
    const player = window.game?.state?.player;
    if (!widget || !player) return;

    const country = player.country || player.nationality || '';
    const stats = player.stats || {};
    const matches = Number(stats.matchesPlayed) || 0;
    const rating = Number(stats.averageRating) || 0;
    const goals = Number(stats.goals) || 0;
    const assists = Number(stats.assists) || 0;

    const title = widget.querySelector('.widget-title');
    if (title && title.dataset.polished !== 'true') {
        const firstName = player.firstname || player.firstName || '';
        const lastName = player.lastname || player.lastName || '';

        title.innerHTML = `
            <span class="player-identity-line">
                <span class="player-country-flag" aria-label="${country}">${flagFor(country)}</span>
                <span>${firstName} ${lastName}</span>
                <span class="player-age-label">${Number(player.age) || 0} ans</span>
            </span>
        `;
        title.dataset.polished = 'true';
    }

    const statGrid = widget.querySelector('.widget-stats-grid');
    if (!statGrid) return;

    // Le solde et l'âge ne sont plus affichés dans les tuiles principales :
    // l'âge est placé directement après le nom et les quatre statistiques
    // sportives prennent leur place.
    Array.from(statGrid.querySelectorAll('.stat-pill')).forEach((pill) => {
        const text = pill.textContent || '';
        if (/Solde|Âge/i.test(text)) pill.remove();
    });

    let seasonStats = statGrid.querySelector('.dashboard-season-stats');
    if (!seasonStats) {
        seasonStats = document.createElement('div');
        seasonStats.className = 'dashboard-season-stats';
        statGrid.appendChild(seasonStats);
    }

    seasonStats.innerHTML = `
        <div class="dashboard-season-stat">
            <span class="dashboard-season-stat-label">Matchs joués</span>
            <strong class="dashboard-season-stat-value">${matches}</strong>
        </div>
        <div class="dashboard-season-stat">
            <span class="dashboard-season-stat-label">Note moyenne</span>
            <strong class="dashboard-season-stat-value">${rating > 0 ? rating.toFixed(1) : '—'}</strong>
        </div>
        <div class="dashboard-season-stat">
            <span class="dashboard-season-stat-label">Buts</span>
            <strong class="dashboard-season-stat-value">${goals}</strong>
        </div>
        <div class="dashboard-season-stat">
            <span class="dashboard-season-stat-label">Passes D</span>
            <strong class="dashboard-season-stat-value">${assists}</strong>
        </div>
    `;
}

function patchYouthOffers() {
    const offers = document.querySelectorAll('.grid-youth-clubs .club-card');
    if (!offers.length) return;

    const clubs = window.UI?.randomYouthClubs || [];

    offers.forEach((card) => {
        const clubName = card.getAttribute('data-club-name') || '';
        const club = clubs.find((item) => item?.name === clubName);
        const country = club?.country || '';
        const flag = flagFor(country);

        const title = card.querySelector('.club-header-info h3');
        if (title && title.dataset.polished !== 'true') {
            title.innerHTML = `<span class="offer-club-flag">${flag}</span>${clubName}`;
            title.dataset.polished = 'true';
        }

        const league = card.querySelector('.league-tag');
        if (league && league.dataset.polished !== 'true') {
            league.textContent = `${club?.league || ''} (${country})`;
            league.classList.add('offer-league-clean');
            league.dataset.polished = 'true';
        }
    });
}

function patchUI() {
    injectPolishStyles();
    patchDashboard();
    patchYouthOffers();
}

function start() {
    patchUI();

    const observer = new MutationObserver(() => patchUI());
    observer.observe(document.body, { childList: true, subtree: true });

    let attempts = 0;
    const timer = setInterval(() => {
        patchUI();
        attempts += 1;
        if (attempts > 40) clearInterval(timer);
    }, 250);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}

// ui-live-polish.js
// Couche visuelle non invasive pour l'interface historique.
// Ne modifie ni le moteur ni l'état de carrière : elle réorganise uniquement le Dashboard rendu.

const COUNTRY_FLAGS = {
    France: '🇫🇷', Espagne: '🇪🇸', Spain: '🇪🇸', Allemagne: '🇩🇪', Germany: '🇩🇪',
    Angleterre: '🏴', England: '🏴', Italie: '🇮🇹', Italy: '🇮🇹', Portugal: '🇵🇹',
    Brésil: '🇧🇷', Brazil: '🇧🇷', Argentine: '🇦🇷', Argentina: '🇦🇷', Belgique: '🇧🇪',
    PaysBas: '🇳🇱', 'Pays-Bas': '🇳🇱', Netherlands: '🇳🇱', Maroc: '🇲🇦', Morocco: '🇲🇦',
    Sénégal: '🇸🇳', Senegal: '🇸🇳', CôteDIvoire: '🇨🇮', 'Côte d’Ivoire': '🇨🇮',
    Cameroun: '🇨🇲', Cameroon: '🇨🇲', Nigeria: '🇳🇬', ÉtatsUnis: '🇺🇸', 'États-Unis': '🇺🇸',
    USA: '🇺🇸', Canada: '🇨🇦', Japon: '🇯🇵', Japan: '🇯🇵', Corée: '🇰🇷', Korea: '🇰🇷'
};

function valueFromStats(stats, keys) {
    for (const key of keys) {
        const n = Number(stats?.[key]);
        if (Number.isFinite(n)) return n;
    }
    return 0;
}

function ratingFromStats(stats) {
    const n = valueFromStats(stats, ['averageRating', 'average_rating', 'ratingAverage', 'avgRating', 'rating']);
    return n > 0 ? n.toFixed(1) : '—';
}

function countryFlag(player) {
    const direct = player?.countryFlag || player?.nationalityFlag || player?.flag;
    if (direct) return direct;
    const code = player?.countryCode || player?.nationalityCode || player?.nationCode;
    if (typeof code === 'string' && /^[A-Za-z]{2}$/.test(code)) {
        return [...code.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt())).join('');
    }
    const name = player?.country?.name || player?.country || player?.nationality || player?.nation;
    if (typeof name === 'string') return COUNTRY_FLAGS[name] || '';
    return '';
}

function roleStats(player) {
    const stats = player?.stats || {};
    const position = String(player?.position || player?.positionId || '').toUpperCase();
    const matches = valueFromStats(stats, ['matches', 'matchesPlayed', 'appearances', 'games']);
    const goals = valueFromStats(stats, ['goals', 'buts']);
    const assists = valueFromStats(stats, ['assists', 'passesDecisives']);
    const tackles = valueFromStats(stats, ['tackles', 'tacles']);
    const cleanSheets = valueFromStats(stats, ['cleanSheets', 'clean_sheets', 'cleanSheet', 'cleanSheetsCount']);
    const isGK = ['GK', 'GB', 'G'].includes(position);
    const isDEF = ['DC', 'CB', 'DD', 'RB', 'DG', 'LB'].includes(position);

    if (isGK) return [['MATCHS', matches], ['CLEAN SHEETS', cleanSheets], ['NOTE MOY.', ratingFromStats(stats)]];
    if (isDEF) return [['MATCHS', matches], ['TACLES', tackles], ['PASSES D.', assists], ['NOTE MOY.', ratingFromStats(stats)]];
    return [['MATCHS', matches], ['BUTS', goals], ['PASSES D.', assists], ['NOTE MOY.', ratingFromStats(stats)]];
}

function enhanceDashboard() {
    const app = document.getElementById('app');
    const state = window.UI?.engine?.state;
    const screen = app?.querySelector('.phone-home-screen');
    const widget = screen?.querySelector('.player-widget-enhanced');
    if (!screen || !widget || !state?.player) return;
    if (widget.dataset.livePolished === '1') return;

    widget.dataset.livePolished = '1';
    const player = state.player;
    const stats = player.stats || {};
    const flag = countryFlag(player);
    const first = player.firstname || '';
    const last = player.lastname || '';
    const name = `${first} ${last}`.trim() || 'Joueur';

    // Identité : drapeau + nom + âge. Suppression visuelle des work rates et infos parasites.
    const title = widget.querySelector('.widget-title');
    if (title) {
        title.innerHTML = `${flag ? `<span class="live-player-flag" aria-label="Pays">${flag}</span>` : ''}<span>${name}</span><span class="live-player-age">${player.age ?? '—'} ans</span>`;
    }
    widget.querySelectorAll('.widget-secret-tag').forEach(el => el.remove());

    const clubSub = widget.querySelector('.player-club-sub');
    if (clubSub) {
        clubSub.textContent = `${player.club || 'Sans club'} · ${player.position || player.positionId || '—'}`;
    }

    const oldGrid = widget.querySelector('.widget-stats-grid');
    if (oldGrid) {
        oldGrid.className = 'widget-stats-grid live-core-stats';
        oldGrid.innerHTML = `
            <div class="stat-pill"><span>GEN</span><strong>${player.overall ?? '—'}</strong></div>
            <div class="stat-pill"><span>POT</span><strong>${player.potential ?? '—'}</strong></div>
            <div class="stat-pill"><span>FORME</span><strong>${player.fitness ?? '—'}</strong></div>
            <div class="stat-pill"><span>MORAL</span><strong>${player.morale ?? '—'}</strong></div>
        `;
        const career = document.createElement('div');
        career.className = 'live-career-stats';
        career.setAttribute('aria-label', 'Statistiques');
        career.innerHTML = roleStats(player).map(([label, value]) => `
            <div class="live-career-stat"><span>${label}</span><strong>${value}</strong></div>
        `).join('');
        oldGrid.insertAdjacentElement('afterend', career);
    }

    // Les applications deviennent une vraie section lisible.
    const apps = screen.querySelector('.apps-grid');
    if (apps && !screen.querySelector('.live-section-title')) {
        const heading = document.createElement('div');
        heading.className = 'live-section-title';
        heading.innerHTML = '<span>Applications</span><small>Ta carrière, ton quotidien</small>';
        apps.parentNode.insertBefore(heading, apps);
    }

    // Réglages flottants : une seule entrée dans la grille suffit.
    screen.querySelector('#settings-floating-btn')?.remove();

    // Libellé du bouton de progression.
    const advance = screen.querySelector('#play-block-btn');
    if (advance && !player.careerEnded) advance.textContent = 'Avancer';
}

const observer = new MutationObserver(() => {
    // ui.js reconstruit le Dashboard après chaque action : on attend le rendu puis on applique la couche visuelle.
    requestAnimationFrame(enhanceDashboard);
});

function start() {
    const app = document.getElementById('app') || document.body;
    observer.observe(app, { childList: true, subtree: true });
    enhanceDashboard();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}

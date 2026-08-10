// ui-live-polish.js
// Couche UX non invasive du Dashboard.
// Une seule hiérarchie visuelle : identité > état > statistiques > notifications > applications.

const COUNTRY_FLAGS = {
    France:'🇫🇷', Espagne:'🇪🇸', Spain:'🇪🇸', Allemagne:'🇩🇪', Germany:'🇩🇪', Angleterre:'🏴', England:'🏴',
    Italie:'🇮🇹', Italy:'🇮🇹', Portugal:'🇵🇹', Brésil:'🇧🇷', Brazil:'🇧🇷', Argentine:'🇦🇷', Argentina:'🇦🇷',
    Belgique:'🇧🇪', PaysBas:'🇳🇱', 'Pays-Bas':'🇳🇱', Netherlands:'🇳🇱', Maroc:'🇲🇦', Morocco:'🇲🇦',
    Sénégal:'🇸🇳', Senegal:'🇸🇳', CôteDIvoire:'🇨🇮', 'Côte d’Ivoire':'🇨🇮', Cameroun:'🇨🇲', Cameroon:'🇨🇲',
    Nigeria:'🇳🇬', ÉtatsUnis:'🇺🇸', 'États-Unis':'🇺🇸', USA:'🇺🇸', Canada:'🇨🇦', Japon:'🇯🇵', Japan:'🇯🇵', Corée:'🇰🇷', Korea:'🇰🇷'
};

function valueFromStats(stats, keys) {
    for (const key of keys) { const n = Number(stats?.[key]); if (Number.isFinite(n)) return n; }
    return 0;
}
function ratingFromStats(stats) {
    const n = valueFromStats(stats, ['averageRating','average_rating','ratingAverage','avgRating','rating']);
    return n > 0 ? n.toFixed(1) : '—';
}
function countryFlag(player) {
    const direct = player?.countryFlag || player?.nationalityFlag || player?.flag;
    if (direct) return direct;
    const code = player?.countryCode || player?.nationalityCode || player?.nationCode;
    if (typeof code === 'string' && /^[A-Za-z]{2}$/.test(code)) return [...code.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt())).join('');
    const name = player?.country?.name || player?.country || player?.nationality || player?.nation;
    return typeof name === 'string' ? (COUNTRY_FLAGS[name] || '') : '';
}
function potentialStars(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '☆☆☆☆☆';
    const stars = Math.max(1, Math.min(5, Math.ceil(n / 20)));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}
function stars(value, fallback = 3) {
    const n = Number(value);
    const count = Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : fallback;
    return '★'.repeat(count) + '☆'.repeat(5 - count);
}
function roleStats(player) {
    const stats = player?.stats || {}, position = String(player?.position || player?.positionId || '').toUpperCase();
    const matches = valueFromStats(stats, ['matches','matchesPlayed','appearances','games']);
    const goals = valueFromStats(stats, ['goals','buts']), assists = valueFromStats(stats, ['assists','passesDecisives']);
    const tackles = valueFromStats(stats, ['tackles','tacles']);
    const cleanSheets = valueFromStats(stats, ['cleanSheets','clean_sheets','cleanSheet','cleanSheetsCount']);
    if (['GK','GB','G'].includes(position)) return [['MATCHS',matches],['CLEAN SHEETS',cleanSheets],['NOTE MOY.',ratingFromStats(stats)]];
    if (['DC','CB','DD','RB','DG','LB'].includes(position)) return [['MATCHS',matches],['TACLES',tackles],['PASSES D.',assists],['NOTE MOY.',ratingFromStats(stats)]];
    return [['MATCHS',matches],['BUTS',goals],['PASSES D.',assists],['NOTE MOY.',ratingFromStats(stats)]];
}
function firstValue(...values) {
    return values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
}
function academyStars(player) {
    return firstValue(player?.academyStars, player?.trainingCenterStars, player?.trainingCentreStars, player?.formationCenterStars, player?.academyRating, player?.trainingCenterRating, player?.trainingCentreRating) ?? 3;
}
function leagueName(player, state) {
    const league = player?.league;
    return firstValue(
        player?.championshipName, player?.championship, player?.leagueName,
        typeof league === 'object' ? league?.name : league,
        player?.competitionName,
        state?.club?.league?.name,
        state?.club?.championship?.name,
        state?.competition?.name
    ) || '';
}
function contractLine(player) {
    const level = firstValue(player?.youthLevel, player?.teamLevel, player?.academyLevel, player?.category) || 'U15';
    const contract = firstValue(player?.contractType, player?.contractName, player?.contract?.type) || 'Contrat jeune';
    const status = firstValue(player?.developmentPath, player?.academyStatus, player?.trainingStatus) || 'Centre';
    return `${level} · ${contract} · ${status}`;
}
function loadLiveStyles() {
    if (document.getElementById('street-live-polish-css')) return;
    const link = document.createElement('link'); link.id = 'street-live-polish-css'; link.rel = 'stylesheet'; link.href = './ui-live-polish.css?v=3'; document.head.appendChild(link);
}
function enhanceDashboard() {
    const app = document.getElementById('app'), state = window.UI?.engine?.state;
    const screen = app?.querySelector('.phone-home-screen'), widget = screen?.querySelector('.player-widget-enhanced');
    if (!screen || !widget || !state?.player) return;
    const player = state.player;
    const flag = countryFlag(player), name = `${player.firstname || ''} ${player.lastname || ''}`.trim() || 'Joueur';

    // Identité : nom + drapeau, puis poste + âge, puis club / championnat / formation.
    const info = widget.querySelector('.player-main-info');
    if (info) {
        info.innerHTML = `
            <div class="widget-title live-player-name-line">
                ${flag ? `<span class="live-player-flag" aria-label="Nationalité">${flag}</span>` : ''}
                <span>${name}</span>
            </div>
            <div class="live-player-position-row">
                <span class="live-player-position">${player.position || player.positionId || '—'}</span>
                <span class="live-player-age">${player.age ?? '—'} ans</span>
            </div>
            <div class="player-club-sub live-club-line">${player.club || 'Sans club'}</div>
            ${leagueName(player, state) ? `<div class="live-league-line">${leagueName(player, state)}</div>` : ''}
            <div class="live-academy-line"><span>Centre de formation</span><span class="live-academy-stars">${stars(academyStars(player))}</span></div>
            <div class="live-contract-line">${contractLine(player)}</div>
        `;
    }

    // Nettoyage agressif des anciennes lignes qui provoquaient les doublons / emojis jaunes.
    widget.querySelectorAll('.widget-secret-tag,.player-secret,.player-balance,.balance-widget,.dashboard-career-stats,.career-stats,.player-career-stats,.career-stat-row').forEach(el => el.remove());

    const oldGrid = widget.querySelector('.widget-stats-grid');
    if (oldGrid) {
        oldGrid.className = 'widget-stats-grid live-core-stats';
        oldGrid.innerHTML = `<div class="stat-pill"><span>GEN</span><strong>${player.overall ?? '—'}</strong></div><div class="stat-pill"><span>POTENTIEL</span><strong class="live-potential-stars">${potentialStars(player.potential)}</strong></div><div class="stat-pill"><span>FORME</span><strong>${player.fitness ?? '—'}</strong></div><div class="stat-pill"><span>MORAL</span><strong>${player.morale ?? '—'}</strong></div>`;
        widget.querySelectorAll('.live-career-stats').forEach(el => el.remove());
        const career = document.createElement('div'); career.className = 'live-career-stats'; career.setAttribute('aria-label','Statistiques de carrière');
        career.innerHTML = roleStats(player).map(([label,value]) => `<div class="live-career-stat"><span>${label}</span><strong>${value}</strong></div>`).join('');
        oldGrid.insertAdjacentElement('afterend', career);
    }

    const apps = screen.querySelector('.apps-grid'); if (!apps) return;
    screen.querySelectorAll('.live-section-title').forEach((el,i) => { if (i > 0) el.remove(); });
    let heading = screen.querySelector('.live-section-title');
    if (!heading) { heading = document.createElement('div'); heading.className = 'live-section-title'; heading.innerHTML = '<span>Applications</span>'; apps.parentNode.insertBefore(heading, apps); }

    let notificationZone = screen.querySelector('.dashboard-notification-zone');
    if (!notificationZone) {
        notificationZone = document.createElement('div'); notificationZone.className = 'dashboard-notification-zone'; notificationZone.setAttribute('aria-label','Notifications');
        const existing = [...screen.querySelectorAll('.dashboard-notification-card,.notification-card,.notification-panel')];
        existing.forEach(el => notificationZone.appendChild(el));
        apps.parentNode.insertBefore(notificationZone, apps);
    }

    const advance = screen.querySelector('#play-block-btn');
    if (advance) {
        advance.textContent = player.careerEnded ? 'Carrière terminée' : 'Avancer';
        advance.classList.add('app-advance-icon');
        if (advance.parentNode !== apps) apps.appendChild(advance);
    }
}
const observer = new MutationObserver(() => requestAnimationFrame(enhanceDashboard));
function start() { loadLiveStyles(); const app = document.getElementById('app') || document.body; observer.observe(app,{childList:true,subtree:true}); requestAnimationFrame(enhanceDashboard); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();

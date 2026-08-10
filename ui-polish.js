// ui-polish.js
// Couche visuelle cohérente de Street to Pro.
// Elle ne modifie aucune règle métier : uniquement la présentation du shell,
// de la fiche joueur et de la navigation mobile.

import { CONTINENTS } from './constants.js';

(() => {
    if (window.__STP_UI_POLISH_V4__) return;
    window.__STP_UI_POLISH_V4__ = true;

    const style = document.createElement('style');
    style.id = 'stp-polish-v4';
    style.textContent = `
        :root {
            --stp-bg: #070b14;
            --stp-panel: rgba(14, 20, 34, .94);
            --stp-panel-soft: rgba(255,255,255,.055);
            --stp-line: rgba(255,255,255,.10);
            --stp-text: #f8fafc;
            --stp-muted: #94a3b8;
            --stp-accent: #22c55e;
            --stp-accent-soft: rgba(34,197,94,.13);
        }

        .phone-frame {
            background:
                radial-gradient(circle at 80% 0%, rgba(34,197,94,.10), transparent 32%),
                linear-gradient(180deg, #0b1220 0%, #070b14 100%) !important;
            border: 1px solid rgba(255,255,255,.09) !important;
            border-radius: 28px !important;
            box-shadow: 0 28px 80px rgba(0,0,0,.55) !important;
        }

        .phone-status-bar {
            background: rgba(7,11,20,.88) !important;
            border-bottom: 1px solid rgba(255,255,255,.06);
            color: #cbd5e1 !important;
            min-height: 32px;
        }

        .phone-home-screen,
        .app-content-body {
            padding: 14px !important;
            gap: 12px !important;
        }

        /* --- Fiche joueur : plus sobre, plus lisible --- */
        .player-widget-enhanced {
            background: linear-gradient(145deg, rgba(20,29,47,.98), rgba(11,17,30,.98)) !important;
            border: 1px solid var(--stp-line) !important;
            border-radius: 22px !important;
            padding: 16px !important;
            box-shadow: 0 14px 36px rgba(0,0,0,.28) !important;
        }

        .widget-header-line {
            color: #a7f3d0 !important;
            font-size: .70rem !important;
            letter-spacing: .08em;
            text-transform: uppercase;
            margin-bottom: 14px !important;
        }

        .player-card-banner {
            gap: 12px !important;
            margin-bottom: 15px !important;
        }

        .player-image-badge {
            width: 52px !important;
            height: 52px !important;
            border-radius: 16px !important;
            background: linear-gradient(145deg,#172554,#0f766e) !important;
            box-shadow: none !important;
            border: 1px solid rgba(255,255,255,.12);
            flex: 0 0 52px;
        }

        .player-main-info .widget-title {
            font-size: 1.15rem !important;
            line-height: 1.2;
            letter-spacing: -.02em;
        }

        .stp-player-flag {
            font-size: 1.02rem;
            margin-right: 5px;
            vertical-align: 1px;
        }

        .stp-player-age {
            color: #94a3b8;
            font-size: .82rem;
            font-weight: 700;
            margin-left: 5px;
            white-space: nowrap;
        }

        .player-club-sub {
            color: #cbd5e1 !important;
            font-size: .78rem !important;
            margin-top: 5px !important;
        }

        .widget-secret-tag {
            border-top: 1px solid rgba(255,255,255,.07) !important;
            color: #94a3b8 !important;
            margin-top: 10px !important;
            padding-top: 9px !important;
            font-size: .72rem !important;
        }

        /* L'ancien badge "⭐ H H" ne doit plus apparaître. */
        .player-main-info .widget-title > span:nth-child(2) { display: none !important; }

        /* Le solde appartient à Banque, pas à la carte joueur. */
        .widget-stats-grid .stat-pill.stp-balance-hidden { display: none !important; }

        .widget-stats-grid {
            grid-template-columns: repeat(4, minmax(0,1fr)) !important;
            gap: 7px !important;
        }

        .stat-pill {
            min-width: 0;
            padding: 9px 7px !important;
            flex-direction: column;
            align-items: flex-start !important;
            gap: 2px;
            background: var(--stp-panel-soft) !important;
            border: 1px solid rgba(255,255,255,.07) !important;
            border-radius: 12px !important;
            font-size: .67rem !important;
            color: #94a3b8;
        }

        .stat-pill strong { font-size: .88rem !important; color: #f8fafc !important; }

        /* --- Applications : grille plus compacte et cohérente --- */
        .apps-grid {
            grid-template-columns: repeat(4, minmax(0,1fr)) !important;
            gap: 13px 8px !important;
            padding: 3px 2px 2px;
        }

        .app-logo {
            width: 54px !important;
            height: 54px !important;
            border-radius: 16px !important;
            border: 1px solid rgba(255,255,255,.09) !important;
            box-shadow: 0 8px 18px rgba(0,0,0,.28) !important;
            font-size: 1.45rem !important;
        }

        .app-label {
            color: #cbd5e1 !important;
            font-size: .68rem !important;
            font-weight: 700 !important;
            text-shadow: none !important;
        }

        .notification-badge {
            top: -3px !important;
            right: 5px !important;
            width: 18px !important;
            height: 18px !important;
            border-width: 1px !important;
        }

        /* --- Navigation et action principale --- */
        .btn-play-block {
            background: linear-gradient(135deg,#22c55e,#16a34a) !important;
            border-radius: 16px !important;
            padding: 14px 16px !important;
            box-shadow: 0 10px 25px rgba(34,197,94,.20) !important;
            letter-spacing: .01em;
        }

        .btn-settings-floating { display: none !important; }

        .app-header-bar {
            background: rgba(7,11,20,.92) !important;
            border-bottom: 1px solid rgba(255,255,255,.07) !important;
        }

        .btn-back-home {
            background: rgba(255,255,255,.06) !important;
            border-color: rgba(255,255,255,.08) !important;
        }

        .app-pane {
            background: var(--stp-panel) !important;
            border-color: var(--stp-line) !important;
            border-radius: 18px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,.16);
        }

        .pane-title { letter-spacing: -.01em; }

        @media (max-width: 380px) {
            .widget-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
            .app-logo { width: 50px !important; height: 50px !important; }
        }
    `;
    document.head.appendChild(style);

    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    function getCountryFlag(country) {
        if (!country) return '🌍';
        const normalized = String(country).trim().toLowerCase();
        for (const countries of Object.values(CONTINENTS || {})) {
            const list = Array.isArray(countries) ? countries : Object.values(countries || {});
            const found = list.find(item =>
                String(item?.name || '').trim().toLowerCase() === normalized ||
                String(item?.id || '').trim().toLowerCase() === normalized
            );
            if (found?.flag && found.flag.length <= 4 && /\p{Extended_Pictographic}/u.test(found.flag)) return found.flag;
        }
        return '🌍';
    }

    function polishDashboard() {
        const player = window.UI?.engine?.state?.player;
        if (!player) return;

        const title = document.querySelector('.player-main-info .widget-title');
        if (title && !title.dataset.stpPolished) {
            const name = `${player.firstname || player.firstName || ''} ${player.lastname || player.lastName || ''}`.trim();
            title.innerHTML = `<span class="stp-player-name"><span class="stp-player-flag">${escapeHtml(getCountryFlag(player.country || player.nationality))}</span>${escapeHtml(name)}<span class="stp-player-age">· ${escapeHtml(player.age || '—')} ans</span></span>`;
            title.dataset.stpPolished = 'true';
        }

        document.querySelectorAll('.widget-stats-grid .stat-pill').forEach(pill => {
            const text = (pill.textContent || '').toLowerCase();
            if (text.includes('solde')) pill.classList.add('stp-balance-hidden');
        });
    }

    function installRenderHook() {
        const ui = window.UI;
        if (!ui || typeof ui.renderDashboard !== 'function' || ui.renderDashboard.__stpPolished) return !!ui;
        const original = ui.renderDashboard.bind(ui);
        const wrapped = function (...args) {
            const result = original(...args);
            requestAnimationFrame(() => requestAnimationFrame(polishDashboard));
            return result;
        };
        wrapped.__stpPolished = true;
        ui.renderDashboard = wrapped;
        requestAnimationFrame(polishDashboard);
        return true;
    }

    let attempts = 0;
    const timer = setInterval(() => {
        if (installRenderHook() || ++attempts > 100) clearInterval(timer);
    }, 50);
})();

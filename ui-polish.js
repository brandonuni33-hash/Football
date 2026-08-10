// ui-polish.js
// Companion optionnel de ui.js v3.
// Aucun MutationObserver : l'UI principale est responsable de son rendu.
// Ce fichier reste volontairement léger pendant la migration architecturale.

(() => {
    if (window.__STP_UI_POLISH_V3__) return;
    window.__STP_UI_POLISH_V3__ = true;

    const style = document.createElement('style');
    style.id = 'stp-polish-v3';
    style.textContent = `
        #app { min-height: 100dvh; }
        .stp-shell button:focus-visible,
        .stp-shell input:focus-visible,
        .stp-shell select:focus-visible {
            outline: 2px solid rgba(16,185,129,.75);
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
})();

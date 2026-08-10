// ui-hotfix.js
// Correctif UI temporaire et robuste pour le bouton "Lancer le prochain bloc".
// Le verrou de lancement ne doit jamais être conservé pendant un render.

import { UserInterface } from './ui.js';

const originalRenderDashboard = UserInterface.prototype.renderDashboard;

function syncPlayButton(ui) {
    const button = document.getElementById('stp-play');
    const player = ui?.engine?.state?.player;
    if (!button || !player) return;
    if (player.careerEnded || player.retired || Number(player.age) >= 42) {
        button.disabled = true;
        button.textContent = 'Carrière terminée';
        return;
    }
    button.disabled = false;
    button.removeAttribute('aria-disabled');
    button.textContent = '▶ Lancer le prochain bloc';
}

UserInterface.prototype.renderDashboard = function (...args) {
    const result = originalRenderDashboard.apply(this, args);
    syncPlayButton(this);
    return result;
};

UserInterface.prototype.playBlockSafely = function () {
    if (this.launching || !this.engine?.state?.player) return;
    this.launching = true;
    try {
        const result = this.engine.playBlock();
        this.notice = null;
        if (result?.event) this.notice = 'Un événement demande ton attention.';
        else if (result?.coachEvent) this.notice = 'Ton entraîneur souhaite te parler.';
        else if (result?.transferOffer) this.notice = 'Une nouvelle offre est disponible.';
        this.launching = false;
        this.renderDashboard();
    } catch (error) {
        console.error('[UI] playBlock error:', error);
        this.launching = false;
        this.notice = `Le bloc n’a pas pu être simulé : ${error?.message || 'erreur inconnue'}`;
        this.renderDashboard();
    }
};

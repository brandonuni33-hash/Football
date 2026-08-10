// ui-hotfix.js
// Correctif temporaire : playBlockSafely rendait le bouton "Lancer le prochain bloc"
// disabled pendant le renderDashboard(), puis libérait `launching` seulement après.
// Résultat : le bouton restait visuellement désactivé jusqu'au rafraîchissement.
//
// On conserve la logique actuelle et on libère le verrou AVANT le rendu final.

import { UserInterface } from './ui.js';

UserInterface.prototype.playBlockSafely = function () {
    if (this.launching || !this.engine?.state?.player) return;

    this.launching = true;

    try {
        const result = this.engine.playBlock();
        this.notice = null;

        if (result?.event) this.notice = 'Un événement demande ton attention.';
        else if (result?.coachEvent) this.notice = 'Ton entraîneur souhaite te parler.';
        else if (result?.transferOffer) this.notice = 'Une nouvelle offre est disponible.';

        // IMPORTANT : le renderDashboard() utilise `launching` pour décider
        // si le bouton doit être disabled. Il faut donc libérer le verrou
        // avant de reconstruire le DOM.
        this.launching = false;
        this.renderDashboard();
    } catch (error) {
        console.error('[UI] playBlock error:', error);
        this.launching = false;
        this.notice = `Le bloc n’a pas pu être simulé : ${error?.message || 'erreur inconnue'}`;
        this.renderDashboard();
    }
};

// ui/views/careerView.js
// Présentation de la progression de carrière et des actions de fin de carrière.

export class CareerView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player;
        if (!player) return '';
        const age = Number(player.age || 0);
        const canRetire = Boolean(player.canRetire) || age >= 34;
        return `
            <div class="app-pane" data-view="career">
                <h3 class="pane-title">🏆 Carrière</h3>
                <div class="career-summary">
                    <div><small>Âge</small><strong>${age} ans</strong></div>
                    <div><small>Club</small><strong>${player.club || 'Sans club'}</strong></div>
                    <div><small>Note</small><strong>${Number(player.overall || 0).toFixed(0)}</strong></div>
                </div>
                ${canRetire ? `
                    <button class="btn-event-choice" data-career-action="retire">Prendre sa retraite</button>
                ` : ''}
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('[data-career-action="retire"]')?.addEventListener('click', () => {
            const result = this.gateway.retireCareer();
            this.ui?.handleBlockResult?.(result);
        });
    }
}

export default CareerView;

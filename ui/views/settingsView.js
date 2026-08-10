// ui/views/settingsView.js
// Vue présentation des réglages de carrière.

export class SettingsView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player || {};
        const retire = player.canRetire && !player.careerEnded;
        return `
            <div class="app-pane" data-view="settings">
                <h3 class="pane-title">⚙️ Réglages Carrière</h3>
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
                    ${retire ? `<button class="btn-event-choice" data-settings-action="retire">🏁 Prendre sa retraite (${player.age} ans)</button>` : ''}
                    <button class="btn-event-choice" data-settings-action="reset">🗑️ Recommencer la carrière</button>
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('[data-settings-action="retire"]')?.addEventListener('click', () => {
            if (window.confirm(`Prendre sa retraite à ${this.gateway.state?.player?.age || 34} ans ?`)) {
                const result = this.gateway.retireCareer();
                this.ui?.handleBlockResult?.(result);
            }
        });
        root?.querySelector('[data-settings-action="reset"]')?.addEventListener('click', () => {
            if (window.confirm('Réinitialiser la carrière et recommencer à zéro ?')) {
                this.gateway.resetCareer();
            }
        });
    }
}

export default SettingsView;

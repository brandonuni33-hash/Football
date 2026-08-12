// ui/views/settingsView.js
// Vue présentation des réglages de carrière.

export class SettingsView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state) {
        const player = state?.player || {};
        const age = Number(player.age) || 0;
        const canEndCareer = age >= 34 && !player.careerEnded;

        return `
            <div class="app-pane" data-view="settings">
                <h3 class="pane-title">⚙️ Réglages Carrière</h3>
                <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px;">
                    <div class="btn-event-choice" style="cursor:default;opacity:.85;pointer-events:none;">
                        💾 Sauvegarde automatique active
                    </div>
                    ${canEndCareer ? `<button class="btn-event-choice" data-settings-action="retire">🏁 Fin de carrière</button>` : ''}
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('[data-settings-action="retire"]')?.addEventListener('click', () => {
            const age = Number(this.gateway.state?.player?.age) || 0;
            if (age < 34) return;

            if (window.confirm(`Mettre fin à votre carrière à ${age} ans ? Cette décision est définitive.`)) {
                const result = this.gateway.retireCareer();
                this.ui?.handleBlockResult?.(result);
            }
        });
    }
}

export default SettingsView;

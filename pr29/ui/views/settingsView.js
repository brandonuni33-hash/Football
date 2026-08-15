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
                    <button class="btn-event-choice" data-settings-action="save">💾 Sauvegarder la partie</button>
                    <div style="font-size:12px;opacity:.7;padding:0 4px;">La carrière est aussi sauvegardée automatiquement pendant votre progression.</div>
                    ${canEndCareer ? `<button class="btn-event-choice" data-settings-action="retire">🏁 Fin de carrière</button>` : ''}
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('[data-settings-action="save"]')?.addEventListener('click', event => {
            const saved = this.gateway.saveCareer();
            if (!saved) {
                window.alert('La sauvegarde a échoué. Réessayez dans un instant.');
                return;
            }

            const button = event.currentTarget;
            const previous = button.textContent;
            button.textContent = '✅ Partie sauvegardée';
            window.setTimeout(() => {
                if (button?.isConnected) button.textContent = previous;
            }, 1600);
        });

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

// ui/views/trainingView.js
// Présentation et sélection du focus d'entraînement.

export class TrainingView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(state, focusTypes = {}) {
        const current = state?.trainingFocus || '';
        const entries = Object.entries(focusTypes);
        return `
            <div class="app-pane" data-view="training">
                <h3 class="pane-title">🏋️ Entraînement</h3>
                <div class="training-focus-list">
                    ${entries.map(([key, focus]) => `
                        <button class="training-focus ${key === current ? 'active' : ''}" data-training-focus="${key}">
                            <strong>${focus?.name || key}</strong>
                            <small>${focus?.description || ''}</small>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelectorAll('[data-training-focus]').forEach((button) => {
            button.addEventListener('click', () => {
                this.gateway.setTrainingFocus(button.dataset.trainingFocus);
                this.ui?.renderDashboard?.();
            });
        });
    }
}

export default TrainingView;

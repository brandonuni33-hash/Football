// ui/views/coachView.js
// Présentation pure des interactions avec l'entraîneur.

export class CoachView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(event) {
        if (!event) return '';
        return `
            <div class="event-modal-overlay" data-view="coach">
                <div class="event-modal-card">
                    <div class="event-modal-category">Entraîneur</div>
                    <h3 class="event-modal-title">${event.title || 'Discussion avec le coach'}</h3>
                    <p class="event-modal-desc">${event.description || ''}</p>
                    ${(event.choices || []).map((choice, index) => `
                        <button class="btn-event-choice" data-coach-choice="${index}">
                            ${choice.text || choice.texte || ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bind(root, event) {
        root?.querySelectorAll('[data-coach-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.coachChoice);
                const result = this.gateway.resolveCoachChoice(index);
                this.ui?.handleBlockResult?.(result);
            });
        });
    }
}

export default CoachView;

// ui/views/eventView.js
// Présentation pure des événements de carrière.

import { eventDescription } from '../../domain/career/careerEventNarrativeLibrary.js';

export class EventView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(event) {
        if (!event) return '';
        const choices = event.choices || event.choix || [];
        return `
            <div class="event-modal-overlay" data-view="event">
                <div class="event-modal-card">
                    <div class="event-modal-category">${event.categorie || 'Événement carrière'}</div>
                    <h3 class="event-modal-title">${event.title || event.titre || 'Événement'}</h3>
                    <p class="event-modal-desc">${eventDescription(event)}</p>
                    ${choices.map((choice, index) => `
                        <button class="btn-event-choice" data-event-choice="${index}">
                            ${choice.text || choice.texte || choice.label || ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    bind(root, event) {
        root?.querySelectorAll('[data-event-choice]').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.eventChoice);
                const result = this.gateway.resolveEventChoice(index);

                if (result?.responseText || result?.immediateReaction || result?.changes?.length || result?.temporary?.length || result?.xp) {
                    this.ui?.afficherModaleConsequences?.(result, () => {
                        this.ui?.renderDashboard?.();
                        this.ui?.handlePostInteraction?.();
                    });
                } else {
                    this.ui?.renderDashboard?.();
                    this.ui?.handlePostInteraction?.();
                }
            });
        });
    }
}

export default EventView;

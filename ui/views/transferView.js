// ui/views/transferView.js
// Présentation pure d'une offre de transfert.

export class TransferView {
    constructor({ ui, gateway } = {}) {
        this.ui = ui;
        this.gateway = gateway;
    }

    render(offer) {
        if (!offer) return '';
        const salary = Number(offer.salaireHebdo || offer.salary || 0);
        return `
            <div class="event-modal-overlay" data-view="transfer">
                <div class="event-modal-card">
                    <div class="event-modal-category">📨 Offre de transfert</div>
                    <h3 class="event-modal-title">${offer.club || 'Nouveau club'}</h3>
                    <p class="event-modal-desc">Une proposition vient d'arriver pour poursuivre ta carrière.</p>
                    ${salary ? `<p><strong>Salaire :</strong> ${salary.toLocaleString('fr-FR')} € / semaine</p>` : ''}
                    ${offer.reputationClub ? `<p><strong>Réputation du club :</strong> ${offer.reputationClub}</p>` : ''}
                    <div class="transfer-actions">
                        <button class="btn-event-choice" data-transfer-action="accept">Accepter</button>
                        <button class="btn-event-choice" data-transfer-action="reject">Refuser</button>
                    </div>
                </div>
            </div>
        `;
    }

    bind(root) {
        root?.querySelector('[data-transfer-action="accept"]')?.addEventListener('click', () => {
            const result = this.gateway.acceptTransferOffer();
            this.ui?.handleBlockResult?.(result);
        });
        root?.querySelector('[data-transfer-action="reject"]')?.addEventListener('click', () => {
            this.gateway.rejectTransferOffer();
            this.ui?.renderDashboard?.();
        });
    }
}

export default TransferView;

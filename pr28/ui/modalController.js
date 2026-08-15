// ui/modalController.js
// Présentation des modales de carrière. Les valeurs mécaniques des conséquences restent cachées.

export class ModalController {
    constructor(ui) { this.ui = ui; }

    ensureModal() {
        let modal = document.getElementById('event-modal-container');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'event-modal-container';
            modal.className = 'event-modal-overlay';
            document.body.appendChild(modal);
        }
        return modal;
    }

    close() { document.getElementById('event-modal-container')?.remove(); }

    afficherMessageModal(title, description) {
        this.afficherModaleMatchDilemma({ title, description, choices: [{ text: 'Continuer' }] }, () => this.ui.renderDashboard());
    }

    afficherModaleEvent(event, onChoiceMade) {
        this.afficherModaleMatchDilemma({
            title: event?.titre || event?.title || 'Événement Carrière',
            description: event?.description || '',
            choices: (event?.choix || event?.choices || []).map(choice => ({ ...choice, text: choice?.texte || choice?.text || 'Valider' }))
        }, (_, index) => onChoiceMade?.(index));
    }

    afficherModaleCoach(event, onChoiceMade) {
        this.afficherModaleMatchDilemma({
            title: event?.title || 'Entretien avec le Coach',
            description: event?.description || '',
            choices: event?.choices || event?.choix || []
        }, (_, index) => onChoiceMade?.(index));
    }

    afficherModaleTransfer(offer) {
        const modal = this.ensureModal();
        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">🔄 OFFRE DE TRANSFERT</span>
                <h3 class="event-modal-title">${offer?.club || 'Club intéressé'}</h3>
                <p class="event-modal-desc">${offer?.message || 'Une offre ferme a été déposée sur la table des négociations.'}</p>
                <div style="background:rgba(255,255,255,.05);padding:12px;border-radius:12px;margin-bottom:16px;font-size:.85rem;">
                    <p style="margin:4px 0;"><strong>Rôle proposé :</strong> ${offer?.rolePropose || 'Titulaire'}</p>
                    <p style="margin:4px 0;"><strong>Salaire :</strong> ${Number(offer?.salaireHebdo || offer?.salary || 0).toLocaleString('fr-FR')} € / sem.</p>
                    <p style="margin:4px 0;"><strong>Indemnité :</strong> ${Number(offer?.montant || 0).toLocaleString('fr-FR')} €</p>
                </div>
                <button class="btn-event-choice" data-transfer="accept">✅ Accepter l'offre</button>
                <button class="btn-event-choice" data-transfer="reject">❌ Refuser</button>
            </div>`;

        modal.querySelector('[data-transfer="accept"]')?.addEventListener('click', () => {
            const result = this.ui.gateway?.acceptTransferOffer();
            this.close();
            this.ui.renderDashboard();
            this.afficherMessageModal('✈️ Transfert Bouclé !', result ? `Nouveau club : ${result.newClub}. Ton nouveau salaire est fixé à ${Number(result.salary || 0).toLocaleString('fr-FR')} € / semaine.` : 'Transfert accepté.');
        });
        modal.querySelector('[data-transfer="reject"]')?.addEventListener('click', () => {
            this.ui.gateway?.rejectTransferOffer();
            this.close();
            this.ui.renderDashboard();
        });
    }

    afficherModaleConsequences(result, onContinue = null) {
        const modal = this.ensureModal();
        const response = result?.responseText || result?.immediateReaction || result?.message || 'Ta décision a été prise en compte. Certaines conséquences se révéleront plus tard.';
        const memoryHint = result?.memoryHint || result?.traceMessage || '';
        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">🧠 RÉACTION</span>
                <h3 class="event-modal-title">${result?.title || 'Ta décision laisse une trace'}</h3>
                <p class="event-modal-desc">${response}</p>
                ${memoryHint ? `<p class="event-modal-desc" style="margin-bottom:12px;color:#fbbf24;">${memoryHint}</p>` : ''}
                <p style="font-size:.78rem;color:var(--text-sub);margin-bottom:16px;">Les conséquences chiffrées restent invisibles. Ton histoire les révélera par ses effets.</p>
                <button class="btn-event-choice" data-consequence-continue style="text-align:center;">Continuer</button>
            </div>`;
        modal.querySelector('[data-consequence-continue]')?.addEventListener('click', () => {
            this.close();
            onContinue?.();
        });
    }

    afficherModaleMatchDilemma(dilemma, onChoiceMade) {
        const modal = this.ensureModal();
        modal.innerHTML = `
            <div class="event-modal-card">
                <span class="event-modal-category">⚡ DÉCISION</span>
                <h3 class="event-modal-title">${dilemma?.title || 'Décision'}</h3>
                <p class="event-modal-desc">${dilemma?.description || ''}</p>
                <div class="event-modal-choices">
                    ${(dilemma?.choices || []).map((choice, index) => `<button class="btn-event-choice" data-choice-index="${index}" type="button">👉 ${choice?.text || choice?.texte || choice?.label || 'Valider'}</button>`).join('')}
                </div>
            </div>`;
        modal.querySelectorAll('[data-choice-index]').forEach(button => button.addEventListener('click', () => {
            const index = Number(button.dataset.choiceIndex);
            const choice = dilemma?.choices?.[index] || null;
            this.close();
            onChoiceMade?.(choice, index);
        }));
    }
}

export default ModalController;

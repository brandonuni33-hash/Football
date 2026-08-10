// ui/blockResultController.js
// Orchestration de l'après-bloc : événements, coach, transferts et propositions.

export class BlockResultController {
    constructor(ui, modals) {
        this.ui = ui;
        this.modals = modals;
    }

    handleBlockResult(result) {
        this.ui.renderDashboard();
        if (!result) return;

        if (result.recoveryOnly) {
            this.modals.afficherMessageModal('🏥 Récupération Médicale', 'Période dédiée aux soins intensifs et à la rééducation.');
            return;
        }

        const finish = () => {
            this.ui.renderDashboard();
            this.handlePostInteraction();
        };

        if (result.report?.summary?.choiceConsequences) {
            this.modals.afficherModaleConsequences(result.report.summary.choiceConsequences, () => this.openPendingInteraction(result, finish));
            return;
        }

        this.openPendingInteraction(result, finish);
    }

    openPendingInteraction(result, finish) {
        if (result.event) {
            this.modals.afficherModaleEvent(result.event, choiceIndex => {
                const consequence = this.ui.gateway?.resolveEventChoice(choiceIndex);
                if (consequence?.responseText || consequence?.immediateReaction || consequence?.changes?.length || consequence?.temporary?.length) {
                    this.modals.afficherModaleConsequences(consequence, finish);
                } else finish();
            });
            return;
        }

        if (result.coachEvent) {
            this.modals.afficherModaleCoach(result.coachEvent, choiceIndex => {
                const consequence = this.ui.gateway?.resolveCoachChoice(choiceIndex);
                if (consequence?.responseText || consequence?.immediateReaction || consequence?.changes?.length || consequence?.temporary?.length) {
                    this.modals.afficherModaleConsequences(consequence, finish);
                } else finish();
            });
            return;
        }

        if (result.transferOffer) {
            this.modals.afficherModaleTransfer(result.transferOffer);
            return;
        }

        finish();
    }

    handlePostInteraction() {
        const state = this.ui.gateway?.state;
        if (!state) return;

        if (state.pendingPositionProposal) {
            const proposal = state.pendingPositionProposal;
            this.modals.afficherModaleMatchDilemma({
                title: '🧠 Le coach vous voit autrement',
                description: proposal.message || 'Le coach envisage de te faire évoluer sur le terrain.',
                choices: [
                    { text: `✅ Essayer ${proposal.to}`, impacts: {} },
                    { text: '❌ Rester à mon poste', impacts: {} }
                ]
            }, (_, index) => {
                this.ui.gateway?.resolvePositionProposal(index === 0);
                this.ui.renderDashboard();
                this.handlePostInteraction();
            });
            return;
        }

        if (state.pendingTransferOffer) this.modals.afficherModaleTransfer(state.pendingTransferOffer);
    }
}

export default BlockResultController;

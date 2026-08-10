// application/legacyGameBridge.js
// Adaptateur temporaire entre le nouveau CommandBus et le GameEngine historique.
// Les commandes déjà migrées peuvent utiliser les systèmes extraits ; les autres
// continuent de tomber sur le moteur historique.

import { CommandBus } from '../core/commandBus.js';
import { COMMANDS } from '../core/commands.js';

export class LegacyGameBridge {
    constructor(engine, registry = null) {
        if (!engine) {
            throw new Error('LegacyGameBridge requires a GameEngine instance');
        }

        this.engine = engine;
        this.registry = registry;
        this.unregister = [];
        this.started = false;
    }

    start() {
        if (this.started) return;

        this.register(COMMANDS.SET_TRAINING_FOCUS, (payload) =>
            this.engine.setTrainingFocus(payload?.focusKey ?? payload)
        );

        this.register(COMMANDS.START_BLOCK, (payload) => {
            const selectedChoice = payload?.selectedChoice ?? payload ?? null;
            const blockSystem = this.registry?.blockSystem;

            if (blockSystem && this.engine.state) {
                return blockSystem.execute(this.engine.state, selectedChoice);
            }

            return this.engine.playBlock(selectedChoice);
        });

        this.register(COMMANDS.RESOLVE_EVENT_CHOICE, (payload) =>
            this.engine.resolveEventChoice(payload?.choiceIndex ?? payload)
        );

        this.register(COMMANDS.RESOLVE_COACH_CHOICE, (payload) =>
            this.engine.resolveCoachChoice(payload?.choiceIndex ?? payload)
        );

        this.register(COMMANDS.RESOLVE_MEDIA_CHOICE, (payload) =>
            this.engine.resolveMediaDilemma(payload?.choiceIndex ?? payload)
        );

        this.register(COMMANDS.RESOLVE_POSITION_PROPOSAL, (payload) =>
            this.engine.resolvePositionProposal(Boolean(payload?.accepted ?? payload))
        );

        this.register(COMMANDS.ACCEPT_TRANSFER, () =>
            this.engine.acceptTransferOffer()
        );

        this.register(COMMANDS.REJECT_TRANSFER, () =>
            this.engine.rejectTransferOffer()
        );

        this.register(COMMANDS.RETIRE, () =>
            this.engine.retireCareer()
        );

        this.register(COMMANDS.RESET_CAREER, () =>
            this.engine.resetCareer()
        );

        this.started = true;
    }

    stop() {
        this.unregister.forEach((unsubscribe) => unsubscribe?.());
        this.unregister = [];
        this.started = false;
    }

    register(commandName, handler) {
        const unsubscribe = CommandBus.register(commandName, handler);
        this.unregister.push(unsubscribe);
        return unsubscribe;
    }
}

export default LegacyGameBridge;

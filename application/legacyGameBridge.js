// application/legacyGameBridge.js
// Adaptateur temporaire entre le nouveau CommandBus et le GameEngine historique.
// Les systèmes extraits sont enregistrés ici mais restent derrière des flags de
// migration tant que leur parité fonctionnelle n'a pas été validée.

import { CommandBus } from '../core/commandBus.js';
import { COMMANDS } from '../core/commands.js';

export class LegacyGameBridge {
    constructor(engine, registry = null, options = {}) {
        if (!engine) {
            throw new Error('LegacyGameBridge requires a GameEngine instance');
        }

        this.engine = engine;
        this.registry = registry;
        this.options = {
            useMigratedBlock: false,
            useMigratedInteractions: false,
            useMigratedTransfers: false,
            ...options
        };
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
            if (this.options.useMigratedBlock && this.registry?.blockSystem && this.engine.state) {
                return this.registry.blockSystem.execute(this.engine.state, selectedChoice);
            }
            return this.engine.playBlock(selectedChoice);
        });

        this.register(COMMANDS.RESOLVE_EVENT_CHOICE, (payload) => {
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveEventChoice(
                    this.engine.state,
                    payload?.choiceIndex ?? payload
                );
            }
            return this.engine.resolveEventChoice(payload?.choiceIndex ?? payload);
        });

        this.register(COMMANDS.RESOLVE_COACH_CHOICE, (payload) => {
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveCoachChoice(
                    this.engine.state,
                    payload?.choiceIndex ?? payload
                );
            }
            return this.engine.resolveCoachChoice(payload?.choiceIndex ?? payload);
        });

        this.register(COMMANDS.RESOLVE_MEDIA_CHOICE, (payload) => {
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveMediaChoice(
                    this.engine.state,
                    payload?.choiceIndex ?? payload
                );
            }
            return this.engine.resolveMediaDilemma(payload?.choiceIndex ?? payload);
        });

        this.register(COMMANDS.RESOLVE_POSITION_PROPOSAL, (payload) => {
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolvePositionProposal(
                    this.engine.state,
                    Boolean(payload?.accepted ?? payload)
                );
            }
            return this.engine.resolvePositionProposal(Boolean(payload?.accepted ?? payload));
        });

        this.register(COMMANDS.ACCEPT_TRANSFER, () => {
            if (this.options.useMigratedTransfers && this.registry?.transferSystem && this.engine.state) {
                return this.registry.transferSystem.accept(this.engine.state);
            }
            return this.engine.acceptTransferOffer();
        });

        this.register(COMMANDS.REJECT_TRANSFER, () => {
            if (this.options.useMigratedTransfers && this.registry?.transferSystem && this.engine.state) {
                return this.registry.transferSystem.reject(this.engine.state);
            }
            return this.engine.rejectTransferOffer();
        });

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

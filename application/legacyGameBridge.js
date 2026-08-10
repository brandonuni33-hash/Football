// application/legacyGameBridge.js
// Adaptateur de transition entre le CommandBus et l'architecture applicative.
// Les commandes passent désormais par les systèmes migrés quand ils existent.
// Le GameEngine reste la façade de compatibilité pour le code historique.

import { CommandBus } from '../core/commandBus.js';
import { COMMANDS } from '../core/commands.js';

export class LegacyGameBridge {
    constructor(engine, registry = null, options = {}) {
        if (!engine) throw new Error('LegacyGameBridge requires a GameEngine instance');

        this.engine = engine;
        this.registry = registry;
        this.options = {
            useMigratedBlock: true,
            useMigratedInteractions: true,
            useMigratedTransfers: true,
            useMigratedCareer: true,
            ...options
        };
        this.unregister = [];
        this.started = false;
        this.originals = {};
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
            const choiceIndex = payload?.choiceIndex ?? payload;
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveEventChoice(this.engine.state, choiceIndex);
            }
            return this.engine.resolveEventChoice(choiceIndex);
        });

        this.register(COMMANDS.RESOLVE_COACH_CHOICE, (payload) => {
            const choiceIndex = payload?.choiceIndex ?? payload;
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveCoachChoice(this.engine.state, choiceIndex);
            }
            return this.engine.resolveCoachChoice(choiceIndex);
        });

        this.register(COMMANDS.RESOLVE_MEDIA_CHOICE, (payload) => {
            const choiceIndex = payload?.choiceIndex ?? payload;
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolveMediaChoice(this.engine.state, choiceIndex);
            }
            return this.engine.resolveMediaDilemma(choiceIndex);
        });

        this.register(COMMANDS.RESOLVE_POSITION_PROPOSAL, (payload) => {
            const accepted = Boolean(payload?.accepted ?? payload);
            if (this.options.useMigratedInteractions && this.registry?.interactionSystem && this.engine.state) {
                return this.registry.interactionSystem.resolvePositionProposal(this.engine.state, accepted);
            }
            return this.engine.resolvePositionProposal(accepted);
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

        this.register(COMMANDS.RETIRE, () => {
            if (this.options.useMigratedCareer && this.registry?.careerLifecycleSystem && this.engine.state) {
                return this.registry.careerLifecycleSystem.retire(this.engine.state, () => this.engine.retireCareer());
            }
            return this.engine.retireCareer();
        });

        this.register(COMMANDS.RESET_CAREER, () => this.engine.resetCareer());

        // startCareer migre vers CareerApplication mais conserve le contrat
        // historique : le GameEngine doit toujours recevoir le nouvel état.
        if (this.options.useMigratedCareer && this.registry?.careerApplication) {
            this.originals.startCareer = this.engine.startCareer;
            this.engine.startCareer = (selectedData = {}) => {
                const state = this.registry.careerApplication.create(selectedData);
                this.engine.state = state;
                return state;
            };
        }

        this.started = true;
    }

    stop() {
        if (this.originals.startCareer) this.engine.startCareer = this.originals.startCareer;
        this.originals = {};
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

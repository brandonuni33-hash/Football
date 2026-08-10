// domain/career/careerLifecycleSystem.js
// Cycle de vie terminal de carrière. Aucune dépendance à l'UI.

import { EventBus } from '../../core/eventBus.js';

export class CareerLifecycleSystem {
    constructor({ stateManager, playerLogic } = {}) {
        Object.assign(this, { stateManager, playerLogic });
    }

    retire(state) {
        if (!state?.player) return null;

        const player = state.player;
        if (Number(player.age) < 34) {
            return {
                retired: false,
                reason: 'Retraite disponible à partir de 34 ans.'
            };
        }

        player.retired = true;
        player.careerEnded = true;
        this.stateManager.save(state);

        const successorOptions = state?.family?.children
            ? state.family.children
                .filter(child => child.parentPlayerId === player.id)
                .filter(child => ['male', 'm', 'garçon', 'garcon'].includes(String(child.gender || '').toLowerCase()))
                .map(child => ({
                    childId: child.id,
                    name: child.firstName || 'Votre fils',
                    age: Number(child.age || 0),
                    availableNow: Number(child.age || 0) >= 14,
                    canSimulate: Number(child.age || 0) < 14
                }))
            : [];

        const payload = {
            retired: true,
            age: player.age,
            overall: player.overall,
            potential: player.potential,
            successorOptions
        };

        EventBus.emit('career.successor_ready', {
            state,
            playerId: player.id,
            ...payload
        });

        return payload;
    }

    reset() {
        this.stateManager.clear();
        return null;
    }
}

export default CareerLifecycleSystem;

// state/stateMigration.js
// Point d'entrée de migration pour la future séparation du State.
// La migration historique reste dans state.js tant qu'elle n'a pas été validée
// indépendamment. Cette couche permet de la remplacer progressivement.

import { SCHEMA_VERSION, StateManager as LegacyStateManager } from '../state.js';

export function migrateState(rawState) {
    if (!rawState) return null;

    // Tant que le nouveau StateManager n'est pas activé, on réutilise la
    // migration historique via une copie temporaire du stockage en mémoire.
    // Aucun accès localStorage n'est effectué ici.
    if (typeof LegacyStateManager.migrate === 'function') {
        return LegacyStateManager.migrate(rawState);
    }

    return {
        ...rawState,
        schemaVersion: SCHEMA_VERSION
    };
}

export default migrateState;

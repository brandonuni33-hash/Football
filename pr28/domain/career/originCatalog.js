// domain/career/originCatalog.js
// Les origines de création concernent uniquement la première génération.
// « Fils de pro » est volontairement absent : la deuxième génération est
// déverrouillée exclusivement par une naissance dans une carrière précédente.

export const INITIAL_ORIGINS = Object.freeze([
    { id: 'local', label: 'Jeune du quartier', generation: 1 },
    { id: 'academy', label: 'Centre de formation', generation: 1 },
    { id: 'late_bloomer', label: 'Retardataire', generation: 1 },
    { id: 'family_support', label: 'Famille passionnée de football', generation: 1 }
]);

export function getInitialOrigins() {
    return INITIAL_ORIGINS.filter(origin => origin.id !== 'son_of_pro');
}

export function isInitialOrigin(originId) {
    return INITIAL_ORIGINS.some(origin => origin.id === originId && origin.generation === 1);
}

export default INITIAL_ORIGINS;

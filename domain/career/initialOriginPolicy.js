// domain/career/initialOriginPolicy.js
// Source de vérité pour l'écran de création initiale.
// Une carrière de seconde génération ne peut jamais être choisie à la création.

const LEGACY_SUCCESSOR_IDS = new Set(['son_of_pro', 'fils_de_pro', 'pro_son']);

const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function isAllowedAtInitialCreation(origin = {}) {
    const id = normalize(origin.id || origin.key || origin.value);
    const label = normalize(origin.label || origin.title || origin.name);
    if (LEGACY_SUCCESSOR_IDS.has(id)) return false;
    return !label.includes('fils de pro') && !label.includes("fils d'un pro") && !label.includes('fils dun pro');
}

export function filterInitialOrigins(origins = []) {
    return origins.filter(isAllowedAtInitialCreation);
}

export const SECOND_GENERATION_ORIGIN = Object.freeze({
    id: 'second_generation',
    selectableAtInitialCreation: false,
    unlockCondition: 'child_birth_and_son_successor'
});

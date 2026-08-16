// ui/verticalSlice/playerCreationDraft.js
// Contrat de saisie isolé pour la création du joueur de la vertical slice.
// Cette couche ne choisit ni origine football, ni club, ni potentiel caché.
import { continentForCountry } from '../../domain/world/countryCatalog.js';

export const VERTICAL_SLICE_START_AGE = 14;
export const VERTICAL_SLICE_RAISED_IN_COUNTRY = 'France';
export const PREFERRED_FEET = Object.freeze(['RIGHT', 'LEFT']);
export const VERTICAL_SLICE_BODY_LIMITS = Object.freeze({
    height: Object.freeze({ min: 145, max: 180 }),
    weight: Object.freeze({ min: 38, max: 70 })
});

// Cinq écrans : toute la personnalisation visuelle (tête + corps) vit sur Apparence.
export const CREATION_SCREENS = Object.freeze([
    'identity',
    'appearance',
    'positionAndFoot',
    'nationalities',
    'childhoodCountry'
]);

export function createPlayerCreationDraft(seed = {}) {
    return {
        firstname: String(seed.firstname ?? '').trim(),
        lastname: String(seed.lastname ?? '').trim(),
        faceId: seed.faceId ?? null,
        height: Number(seed.height) || 168,
        weight: Number(seed.weight) || 56,
        position: seed.position ?? null,
        preferredFoot: seed.preferredFoot ?? null,
        primaryNationality: seed.primaryNationality ?? seed.nationality ?? null,
        secondaryNationality: seed.secondaryNationality ?? null,
        raisedInCountry: seed.raisedInCountry ?? VERTICAL_SLICE_RAISED_IN_COUNTRY,
        age: VERTICAL_SLICE_START_AGE
    };
}

export function validatePlayerCreationDraft(draft = {}) {
    const errors = {};

    if (!String(draft.firstname ?? '').trim()) errors.firstname = 'Prénom requis.';
    if (!String(draft.lastname ?? '').trim()) errors.lastname = 'Nom requis.';
    if (!draft.faceId) errors.faceId = 'Visage requis.';

    const height = Number(draft.height);
    const weight = Number(draft.weight);
    if (
        !Number.isFinite(height)
        || height < VERTICAL_SLICE_BODY_LIMITS.height.min
        || height > VERTICAL_SLICE_BODY_LIMITS.height.max
    ) errors.height = 'Taille invalide.';
    if (
        !Number.isFinite(weight)
        || weight < VERTICAL_SLICE_BODY_LIMITS.weight.min
        || weight > VERTICAL_SLICE_BODY_LIMITS.weight.max
    ) errors.weight = 'Poids invalide.';

    if (!draft.position) errors.position = 'Poste requis.';
    if (!PREFERRED_FEET.includes(draft.preferredFoot)) errors.preferredFoot = 'Pied fort requis.';
    if (!draft.primaryNationality) errors.primaryNationality = 'Nationalité principale requise.';
    if (draft.secondaryNationality && draft.secondaryNationality === draft.primaryNationality) {
        errors.secondaryNationality = 'La seconde nationalité doit être différente.';
    }
    if (!draft.raisedInCountry) errors.raisedInCountry = "Pays d'enfance requis.";

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

export function toCareerCreationIdentity(draft = {}) {
    const validation = validatePlayerCreationDraft(draft);
    if (!validation.valid) {
        const error = new Error('Création joueur incomplète.');
        error.validation = validation;
        throw error;
    }

    return Object.freeze({
        firstname: String(draft.firstname).trim(),
        lastname: String(draft.lastname).trim(),
        age: VERTICAL_SLICE_START_AGE,
        faceId: draft.faceId,
        height: Number(draft.height),
        weight: Number(draft.weight),
        position: draft.position,
        preferredFoot: draft.preferredFoot,
        nationality: draft.primaryNationality,
        primaryNationality: draft.primaryNationality,
        secondaryNationality: draft.secondaryNationality || null,
        raisedInCountry: draft.raisedInCountry,
        raisedInContinent: continentForCountry(draft.raisedInCountry),

        // Ces faits appartiennent au prologue et au monde, pas à l'écran de création.
        origin: null,
        youthClub: null,
        heartClub: null
    });
}

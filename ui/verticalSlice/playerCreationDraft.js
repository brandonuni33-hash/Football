// ui/verticalSlice/playerCreationDraft.js
// Contrat de saisie pour la création du joueur de la vertical slice.
// Cette couche ne choisit ni origine football, ni club, ni potentiel caché.

export const VERTICAL_SLICE_START_AGE = 14;
export const VERTICAL_SLICE_RAISED_IN_COUNTRY = 'France';

export const CREATION_STEPS = Object.freeze([
    'identity',
    'appearance',
    'body',
    'position',
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
    if (!Number.isFinite(height) || height < 135 || height > 205) errors.height = 'Taille invalide.';
    if (!Number.isFinite(weight) || weight < 30 || weight > 110) errors.weight = 'Poids invalide.';

    if (!draft.position) errors.position = 'Poste requis.';
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
        nationality: draft.primaryNationality,
        primaryNationality: draft.primaryNationality,
        secondaryNationality: draft.secondaryNationality || null,
        raisedInCountry: draft.raisedInCountry,

        // Important : ces faits ne sont pas choisis pendant la création STP.
        origin: null,
        youthClub: null,
        heartClub: null
    });
}

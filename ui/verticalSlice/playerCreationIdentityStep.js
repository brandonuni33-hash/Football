import { createPlayerCreationDraft } from './playerCreationDraft.js';

export const IDENTITY_LIMITS = Object.freeze({
    firstname: 18,
    lastname: 22
});

export const IDENTITY_COPY = Object.freeze({
    eyebrow: 'Ton histoire commence ici',
    title: 'Comment tu t’appelles ?',
    description: 'Pas de surnom, pas de statut, pas encore de club. Juste ton identité.',
    continueLabel: 'Continuer',
    ageLabel: 'Âge de départ : 14 ans'
});

function normalize(value, maxLength) {
    return String(value ?? '').slice(0, maxLength);
}

export function createIdentityStepState(seed = {}) {
    const draft = createPlayerCreationDraft(seed);
    return Object.freeze({
        draft,
        step: 'identity',
        screenIndex: 1,
        screenCount: 6
    });
}

export function updateIdentityField(state, field, rawValue) {
    if (!['firstname', 'lastname'].includes(field)) {
        throw new Error(`Champ identité inconnu : ${field}`);
    }

    const value = normalize(rawValue, IDENTITY_LIMITS[field]);
    return Object.freeze({
        ...state,
        draft: {
            ...state.draft,
            [field]: value
        }
    });
}

export function identityValidation(state) {
    const firstname = String(state?.draft?.firstname ?? '').trim();
    const lastname = String(state?.draft?.lastname ?? '').trim();
    const errors = {};

    if (!firstname) errors.firstname = 'Prénom requis.';
    if (!lastname) errors.lastname = 'Nom requis.';

    return Object.freeze({
        valid: Object.keys(errors).length === 0,
        errors: Object.freeze(errors)
    });
}

export function identityViewModel(state) {
    const firstname = String(state?.draft?.firstname ?? '');
    const lastname = String(state?.draft?.lastname ?? '');
    const cleanFirstname = firstname.trim();
    const cleanLastname = lastname.trim();
    const validation = identityValidation(state);

    return Object.freeze({
        step: 'identity',
        progress: Object.freeze({ current: 1, total: 6, ratio: 1 / 6 }),
        copy: IDENTITY_COPY,
        firstname: Object.freeze({
            value: firstname,
            count: firstname.length,
            maxLength: IDENTITY_LIMITS.firstname
        }),
        lastname: Object.freeze({
            value: lastname,
            count: lastname.length,
            maxLength: IDENTITY_LIMITS.lastname
        }),
        previewName: [cleanFirstname, cleanLastname].filter(Boolean).join(' ') || 'Ton nom apparaîtra ici',
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function continueFromIdentity(state) {
    const validation = identityValidation(state);
    if (!validation.valid) {
        return Object.freeze({ ok: false, state, errors: validation.errors });
    }

    return Object.freeze({
        ok: true,
        nextStep: 'appearance',
        state: Object.freeze({
            ...state,
            step: 'appearance',
            screenIndex: 2
        })
    });
}

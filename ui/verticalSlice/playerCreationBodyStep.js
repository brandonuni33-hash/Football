import { createPlayerCreationDraft } from './playerCreationDraft.js';

export const BODY_LIMITS = Object.freeze({
    height: Object.freeze({ min: 145, max: 195, unit: 'cm' }),
    weight: Object.freeze({ min: 38, max: 90, unit: 'kg' })
});

export const BODY_COPY = Object.freeze({
    eyebrow: 'Gabarit',
    title: 'Ton corps à 14 ans.',
    description: 'Choisis ton point de départ. Avec les années, ton corps pourra encore évoluer.',
    note: 'Le gabarit influence la représentation du joueur, mais il ne définit jamais jusqu’où il peut aller.',
    continueLabel: 'Continuer'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createBodyStepState(input = {}) {
    return Object.freeze({
        ...(input?.draft ? input : {}),
        draft: draftFrom(input),
        step: 'body',
        screenIndex: 3,
        screenCount: 6
    });
}

function clamp(value, { min, max }) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function updateBodyField(state, field, rawValue) {
    if (!['height', 'weight'].includes(field)) {
        throw new Error(`Champ gabarit inconnu : ${field}`);
    }

    return Object.freeze({
        ...state,
        draft: {
            ...state.draft,
            [field]: clamp(rawValue, BODY_LIMITS[field])
        }
    });
}

export function bodyValidation(state) {
    const height = Number(state?.draft?.height);
    const weight = Number(state?.draft?.weight);
    const errors = {};

    if (!Number.isFinite(height) || height < BODY_LIMITS.height.min || height > BODY_LIMITS.height.max) {
        errors.height = 'Taille invalide.';
    }
    if (!Number.isFinite(weight) || weight < BODY_LIMITS.weight.min || weight > BODY_LIMITS.weight.max) {
        errors.weight = 'Poids invalide.';
    }

    return Object.freeze({
        valid: Object.keys(errors).length === 0,
        errors: Object.freeze(errors)
    });
}

export function bodyViewModel(state) {
    const validation = bodyValidation(state);
    const height = Number(state?.draft?.height);
    const weight = Number(state?.draft?.weight);

    return Object.freeze({
        step: 'body',
        progress: Object.freeze({ current: 3, total: 6, ratio: 3 / 6 }),
        copy: BODY_COPY,
        height: Object.freeze({ value: height, ...BODY_LIMITS.height }),
        weight: Object.freeze({ value: weight, ...BODY_LIMITS.weight }),
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function continueFromBody(state) {
    const validation = bodyValidation(state);
    if (!validation.valid) {
        return Object.freeze({ ok: false, state, errors: validation.errors });
    }

    return Object.freeze({
        ok: true,
        nextStep: 'positionAndFoot',
        state: Object.freeze({
            ...state,
            step: 'positionAndFoot',
            screenIndex: 4
        })
    });
}

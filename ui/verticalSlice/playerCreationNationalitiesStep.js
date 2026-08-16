import { createPlayerCreationDraft } from './playerCreationDraft.js';
import { COUNTRY_NAMES } from '../../domain/world/countryCatalog.js';

export const NATIONALITY_OPTIONS = COUNTRY_NAMES;

export const NATIONALITIES_COPY = Object.freeze({
    eyebrow: 'Nationalités',
    title: 'Tes nationalités',
    primaryLabel: 'Nationalité principale',
    secondaryLabel: 'Seconde nationalité',
    optionalLabel: 'Optionnelle',
    continueLabel: 'Continuer'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createNationalitiesStepState(input = {}) {
    return Object.freeze({
        ...(input?.draft ? input : {}),
        draft: draftFrom(input),
        step: 'nationalities',
        screenIndex: 4,
        screenCount: 5
    });
}

export function setPrimaryNationality(state, country) {
    if (!NATIONALITY_OPTIONS.includes(country)) {
        throw new Error(`Nationalité inconnue : ${country}`);
    }
    return Object.freeze({
        ...state,
        draft: {
            ...state.draft,
            primaryNationality: country,
            secondaryNationality: state.draft.secondaryNationality === country ? null : state.draft.secondaryNationality
        }
    });
}

export function setSecondaryNationality(state, country) {
    if (country == null || country === '') {
        return Object.freeze({ ...state, draft: { ...state.draft, secondaryNationality: null } });
    }
    if (!NATIONALITY_OPTIONS.includes(country)) {
        throw new Error(`Nationalité inconnue : ${country}`);
    }
    if (country === state?.draft?.primaryNationality) {
        throw new Error('La seconde nationalité doit être différente.');
    }
    return Object.freeze({ ...state, draft: { ...state.draft, secondaryNationality: country } });
}

export function nationalitiesValidation(state) {
    const primary = state?.draft?.primaryNationality ?? null;
    const secondary = state?.draft?.secondaryNationality ?? null;
    const errors = {};

    if (!NATIONALITY_OPTIONS.includes(primary)) errors.primaryNationality = 'Nationalité principale requise.';
    if (secondary && !NATIONALITY_OPTIONS.includes(secondary)) errors.secondaryNationality = 'Seconde nationalité invalide.';
    if (secondary && secondary === primary) errors.secondaryNationality = 'La seconde nationalité doit être différente.';

    return Object.freeze({ valid: Object.keys(errors).length === 0, errors: Object.freeze(errors) });
}

export function nationalitiesViewModel(state) {
    const validation = nationalitiesValidation(state);
    return Object.freeze({
        step: 'nationalities',
        progress: Object.freeze({ current: 4, total: 5, ratio: 4 / 5 }),
        copy: NATIONALITIES_COPY,
        options: NATIONALITY_OPTIONS,
        primaryNationality: state?.draft?.primaryNationality ?? '',
        secondaryNationality: state?.draft?.secondaryNationality ?? '',
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function continueFromNationalities(state) {
    const validation = nationalitiesValidation(state);
    if (!validation.valid) return Object.freeze({ ok: false, state, errors: validation.errors });

    return Object.freeze({
        ok: true,
        nextStep: 'childhoodCountry',
        state: Object.freeze({ ...state, step: 'childhoodCountry', screenIndex: 5 })
    });
}

import { createPlayerCreationDraft } from './playerCreationDraft.js';
import { countryMetadata } from '../../domain/world/countryCatalog.js';

export const CHILDHOOD_COUNTRIES = Object.freeze([
    Object.freeze({ ...countryMetadata('France'), available: true, note: 'Disponible au lancement' }),
    Object.freeze({ ...countryMetadata('Angleterre'), available: false, note: 'Prévu pour la version complète' }),
    Object.freeze({ ...countryMetadata('Espagne'), available: false, note: 'Prévu pour la version complète' }),
    Object.freeze({ ...countryMetadata('Portugal'), available: false, note: 'Prévu pour la version complète' }),
    Object.freeze({ ...countryMetadata('Belgique'), available: false, note: 'Prévu pour la version complète' }),
    Object.freeze({ ...countryMetadata('Brésil'), available: false, note: 'Prévu pour la version complète' })
]);

export const CHILDHOOD_COUNTRY_COPY = Object.freeze({
    eyebrow: 'Ton environnement',
    title: 'Où as-tu grandi ?',
    description: 'Ton pays d’enfance fait partie de ton identité et peut influencer certaines rencontres de ton histoire.',
    info: 'Les décors et l’ambiance de ton prologue dépendront du continent dans lequel tu as grandi.',
    continueLabel: 'Terminer la création'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createChildhoodCountryStepState(input = {}) {
    return Object.freeze({
        ...(input?.draft ? input : {}),
        draft: draftFrom(input),
        step: 'childhoodCountry',
        screenIndex: 6,
        screenCount: 6
    });
}

export function setChildhoodCountry(state, country) {
    const option = CHILDHOOD_COUNTRIES.find(item => item.id === country);
    if (!option) throw new Error(`Pays d’enfance inconnu : ${country}`);
    if (!option.available) throw new Error(`Pays d’enfance indisponible dans la vertical slice : ${country}`);

    return Object.freeze({
        ...state,
        draft: { ...state.draft, raisedInCountry: option.id }
    });
}

export function childhoodCountryValidation(state) {
    const country = state?.draft?.raisedInCountry ?? null;
    const option = CHILDHOOD_COUNTRIES.find(item => item.id === country);
    const errors = {};

    if (!option || !option.available) errors.raisedInCountry = 'Pays d’enfance requis.';

    return Object.freeze({
        valid: Object.keys(errors).length === 0,
        errors: Object.freeze(errors)
    });
}

export function childhoodCountryViewModel(state) {
    const validation = childhoodCountryValidation(state);
    const selectedCountry = state?.draft?.raisedInCountry ?? null;

    return Object.freeze({
        step: 'childhoodCountry',
        progress: Object.freeze({ current: 6, total: 6, ratio: 1 }),
        copy: CHILDHOOD_COUNTRY_COPY,
        selectedCountry,
        countries: CHILDHOOD_COUNTRIES.map(country => Object.freeze({
            ...country,
            selected: country.id === selectedCountry
        })),
        canContinue: validation.valid,
        errors: validation.errors
    });
}

export function finishPlayerCreation(state) {
    const validation = childhoodCountryValidation(state);
    if (!validation.valid) return Object.freeze({ ok: false, state, errors: validation.errors });

    return Object.freeze({
        ok: true,
        nextStep: 'pastFragments',
        state: Object.freeze({ ...state, step: 'pastFragments', screenIndex: 7 })
    });
}

import { createPlayerCreationDraft } from './playerCreationDraft.js';

export const CHILDHOOD_CONTINENTS = Object.freeze([
    Object.freeze({ id: 'Europe', label: 'Europe', icon: '🌍' }),
    Object.freeze({ id: 'Afrique', label: 'Afrique', icon: '🌍' })
]);

export const CHILDHOOD_COUNTRY_COPY = Object.freeze({
    eyebrow: 'Ton environnement',
    title: 'Où as-tu grandi ?',
    description: 'Choisis le continent qui a façonné ton enfance.',
    continueLabel: 'Terminer la création'
});

function draftFrom(input = {}) {
    if (input?.draft) return input.draft;
    return createPlayerCreationDraft(input);
}

export function createChildhoodCountryStepState(input = {}) {
    return Object.freeze({ ...(input?.draft ? input : {}), draft: draftFrom(input), step: 'childhoodCountry', screenIndex: 5, screenCount: 5 });
}

export function setChildhoodCountry(state, continent) {
    if (!CHILDHOOD_CONTINENTS.some(item => item.id === continent)) throw new Error(`Continent d’enfance inconnu : ${continent}`);
    return Object.freeze({ ...state, draft: { ...state.draft, raisedInContinent: continent, raisedInCountry: null } });
}

export function childhoodCountryValidation(state) {
    const continent = state?.draft?.raisedInContinent ?? null;
    const valid = CHILDHOOD_CONTINENTS.some(item => item.id === continent);
    return Object.freeze({ valid, errors: Object.freeze(valid ? {} : { raisedInContinent: 'Continent d’enfance requis.' }) });
}

export function childhoodCountryViewModel(state) {
    const validation = childhoodCountryValidation(state);
    const selectedContinent = state?.draft?.raisedInContinent ?? null;
    return Object.freeze({
        step: 'childhoodCountry', progress: Object.freeze({ current: 5, total: 5, ratio: 1 }), copy: CHILDHOOD_COUNTRY_COPY,
        selectedCountry: selectedContinent,
        countries: CHILDHOOD_CONTINENTS.map(continent => Object.freeze({ id: continent.id, label: continent.label, flag: continent.icon, available: true, note: '', selected: continent.id === selectedContinent })),
        canContinue: validation.valid, errors: validation.errors
    });
}

export function finishPlayerCreation(state) {
    const validation = childhoodCountryValidation(state);
    if (!validation.valid) return Object.freeze({ ok: false, state, errors: validation.errors });
    return Object.freeze({ ok: true, nextStep: 'pastFragments', state: Object.freeze({ ...state, step: 'pastFragments', screenIndex: 6 }) });
}

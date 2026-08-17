import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createNationalitiesStepState,
    setPrimaryNationality,
    setSecondaryNationality,
    nationalitiesValidation,
    continueFromNationalities
} from '../../../ui/verticalSlice/playerCreationNationalitiesStep.js';

test('l’étape nationalités démarre au quatrième écran sans nationalité principale', () => {
    const state = createNationalitiesStepState();
    assert.equal(state.screenIndex, 4);
    assert.equal(state.screenCount, 5);
    assert.equal(nationalitiesValidation(state).valid, false);
});

test('la nationalité principale est obligatoire et la seconde reste optionnelle', () => {
    let state = createNationalitiesStepState();
    state = setPrimaryNationality(state, 'France');

    assert.equal(state.draft.primaryNationality, 'France');
    assert.equal(state.draft.secondaryNationality, null);
    assert.equal(nationalitiesValidation(state).valid, true);
});

test('la seconde nationalité doit être différente de la principale', () => {
    let state = setPrimaryNationality(createNationalitiesStepState(), 'France');
    assert.throws(() => setSecondaryNationality(state, 'France'), /différente/);

    state = setSecondaryNationality(state, 'Mali');
    assert.equal(state.draft.secondaryNationality, 'Mali');
    assert.equal(nationalitiesValidation(state).valid, true);
});

test('changer la principale retire une seconde devenue identique', () => {
    let state = setPrimaryNationality(createNationalitiesStepState(), 'France');
    state = setSecondaryNationality(state, 'Mali');
    state = setPrimaryNationality(state, 'Mali');

    assert.equal(state.draft.primaryNationality, 'Mali');
    assert.equal(state.draft.secondaryNationality, null);
});

test('continuer mène au pays où le joueur a grandi', () => {
    let state = setPrimaryNationality(createNationalitiesStepState(), 'France');
    const result = continueFromNationalities(state);

    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'childhoodCountry');
    assert.equal(result.state.screenIndex, 5);
});

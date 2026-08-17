import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CHILDHOOD_COUNTRIES,
    createChildhoodCountryStepState,
    setChildhoodCountry,
    childhoodCountryValidation,
    finishPlayerCreation
} from '../../../ui/verticalSlice/playerCreationChildhoodCountryStep.js';

test('l’étape pays d’enfance est le sixième et dernier écran de création', () => {
    const state = createChildhoodCountryStepState();
    assert.equal(state.screenIndex, 6);
    assert.equal(state.screenCount, 6);
    assert.equal(state.step, 'childhoodCountry');
});

test('la vertical slice démarre avec la France comme pays d’enfance disponible', () => {
    const state = createChildhoodCountryStepState();
    assert.equal(state.draft.raisedInCountry, 'France');
    assert.equal(childhoodCountryValidation(state).valid, true);
    assert.equal(CHILDHOOD_COUNTRIES.find(country => country.id === 'France').available, true);
});

test('les autres pays peuvent être affichés sans être sélectionnables dans la slice', () => {
    const state = createChildhoodCountryStepState();
    assert.throws(() => setChildhoodCountry(state, 'Angleterre'), /indisponible/);
    assert.throws(() => setChildhoodCountry(state, 'Brésil'), /indisponible/);
});

test('terminer la création mène aux fragments du passé', () => {
    const result = finishPlayerCreation(createChildhoodCountryStepState());
    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'pastFragments');
    assert.equal(result.state.step, 'pastFragments');
});

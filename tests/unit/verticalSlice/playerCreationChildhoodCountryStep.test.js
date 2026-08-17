import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CHILDHOOD_CONTINENTS,
    createChildhoodCountryStepState,
    setChildhoodCountry,
    childhoodCountryValidation,
    finishPlayerCreation
} from '../../../ui/verticalSlice/playerCreationChildhoodCountryStep.js';

test('l’étape environnement est le cinquième et dernier écran de création', () => {
    const state = createChildhoodCountryStepState();
    assert.equal(state.screenIndex, 5);
    assert.equal(state.screenCount, 5);
    assert.equal(state.step, 'childhoodCountry');
});

test('seuls Europe et Afrique sont proposés et aucun choix n’est imposé', () => {
    const state = createChildhoodCountryStepState();
    assert.deepEqual(CHILDHOOD_CONTINENTS.map(item => item.id), ['Europe', 'Afrique']);
    assert.equal(state.draft.raisedInContinent, null);
    assert.equal(childhoodCountryValidation(state).valid, false);
});

test('choisir un continent remplace la logique de pays d’enfance', () => {
    let state = createChildhoodCountryStepState();
    state = setChildhoodCountry(state, 'Afrique');
    assert.equal(state.draft.raisedInContinent, 'Afrique');
    assert.equal(state.draft.raisedInCountry, null);
    assert.equal(childhoodCountryValidation(state).valid, true);
    assert.throws(() => setChildhoodCountry(state, 'Asie'), /Continent d’enfance inconnu/);
});

test('terminer la création mène aux fragments du passé', () => {
    const state = setChildhoodCountry(createChildhoodCountryStepState(), 'Europe');
    const result = finishPlayerCreation(state);
    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'pastFragments');
    assert.equal(result.state.step, 'pastFragments');
});

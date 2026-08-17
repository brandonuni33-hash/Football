import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createNationalitiesStepState,
    setPrimaryNationality,
    setSecondaryNationality
} from '../../../ui/verticalSlice/playerCreationNationalitiesStep.js';
import { playerCreationNationalitiesTemplate } from '../../../ui/verticalSlice/playerCreationNationalitiesView.js';

test('l’écran nationalités garde une principale obligatoire et une seconde optionnelle', () => {
    const html = playerCreationNationalitiesTemplate(createNationalitiesStepState());

    assert.match(html, /05 \/ 06/);
    assert.match(html, /Tes nationalités/);
    assert.match(html, /Nationalité principale/);
    assert.match(html, /Seconde nationalité/);
    assert.match(html, /Optionnelle/);
    assert.match(html, /name="primaryNationality"/);
    assert.match(html, /name="secondaryNationality"/);
    assert.match(html, /class="stp-continue" disabled/);
});

test('les nationalités sélectionnées apparaissent et activent Continuer', () => {
    let state = setPrimaryNationality(createNationalitiesStepState(), 'France');
    state = setSecondaryNationality(state, 'Mali');
    const html = playerCreationNationalitiesTemplate(state);

    assert.match(html, /value="France" selected>France<\/option>/);
    assert.match(html, /value="Mali" selected>Mali<\/option>/);
    assert.match(html, /class="stp-continue ready"/);
});

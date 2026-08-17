import test from 'node:test';
import assert from 'node:assert/strict';
import { createChildhoodCountryStepState, setChildhoodCountry } from '../../../ui/verticalSlice/playerCreationChildhoodCountryStep.js';
import { playerCreationChildhoodCountryTemplate } from '../../../ui/verticalSlice/playerCreationChildhoodCountryView.js';

test('l’écran environnement affiche uniquement Europe et Afrique sur 05 / 05', () => {
    const html = playerCreationChildhoodCountryTemplate(createChildhoodCountryStepState());
    assert.match(html, /05 \/ 05/);
    assert.match(html, /Où as-tu grandi/);
    assert.match(html, /continent qui a façonné ton enfance/);
    assert.match(html, /data-country="Europe"/);
    assert.match(html, /data-country="Afrique"/);
    assert.doesNotMatch(html, /France|Angleterre|Brésil/);
    assert.match(html, /Terminer la création/);
});

test('le continent choisi est visuellement sélectionné', () => {
    const state = setChildhoodCountry(createChildhoodCountryStepState(), 'Afrique');
    const html = playerCreationChildhoodCountryTemplate(state);
    assert.match(html, /class="stp-childhood-country selected" data-country="Afrique"/);
});

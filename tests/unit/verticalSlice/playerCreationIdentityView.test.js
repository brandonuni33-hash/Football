import test from 'node:test';
import assert from 'node:assert/strict';
import { createIdentityStepState, updateIdentityField } from '../../../ui/verticalSlice/playerCreationIdentityStep.js';
import { playerCreationIdentityTemplate } from '../../../ui/verticalSlice/playerCreationIdentityView.js';

test('l’écran identité conserve les textes et la structure validés', () => {
    const html = playerCreationIdentityTemplate(createIdentityStepState());

    assert.match(html, /Ton histoire commence ici/);
    assert.match(html, /Comment<br>tu t’appelles/);
    assert.match(html, /Pas de surnom, pas de statut, pas encore de club/);
    assert.match(html, /01 \/ 05/);
    assert.match(html, /Âge de départ : 14 ans/);
    assert.match(html, /disabled/);
});

test('le bouton continuer devient disponible avec prénom et nom', () => {
    let state = createIdentityStepState();
    state = updateIdentityField(state, 'firstname', 'Elias');
    state = updateIdentityField(state, 'lastname', 'Morel');

    const html = playerCreationIdentityTemplate(state);
    assert.match(html, /Elias Morel/);
    assert.match(html, /class="stp-continue ready"/);
    assert.doesNotMatch(html, /class="stp-continue ready" disabled/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createAppearanceStepState,
    selectAppearanceFace,
    updateAppearanceBodyField
} from '../../../ui/verticalSlice/playerCreationAppearanceStep.js';
import { playerCreationAppearanceTemplate } from '../../../ui/verticalSlice/playerCreationAppearanceView.js';

test('l’écran apparence réunit tête et corps sur 02 / 05', () => {
    const html = playerCreationAppearanceTemplate(createAppearanceStepState());

    assert.match(html, /02 \/ 05/);
    assert.match(html, /Crée ton joueur/);
    assert.match(html, /coiffure, peau/);
    assert.match(html, /data-face-id="face-01"/);
    assert.match(html, /data-face-id="face-06"/);
    assert.match(html, /name="height"/);
    assert.match(html, /name="weight"/);
    assert.match(html, /stp-body-silhouette/);
    assert.match(html, /class="stp-continue" disabled/);
});

test('visage et gabarit sélectionnés sont rendus sur la même page', () => {
    let state = selectAppearanceFace(createAppearanceStepState(), 'face-04');
    state = updateAppearanceBodyField(state, 'height', 176);
    state = updateAppearanceBodyField(state, 'weight', 62);
    const html = playerCreationAppearanceTemplate(state);

    assert.match(html, /class="stp-face-option selected" data-face-id="face-04" aria-pressed="true"/);
    assert.match(html, /value="176"/);
    assert.match(html, /value="62"/);
    assert.match(html, /class="stp-continue ready"/);
    assert.doesNotMatch(html, /class="stp-continue ready" disabled/);
});

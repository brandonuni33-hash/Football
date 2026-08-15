import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createAppearanceStepState,
    selectAppearanceFace
} from '../../../ui/verticalSlice/playerCreationAppearanceStep.js';
import { playerCreationAppearanceTemplate } from '../../../ui/verticalSlice/playerCreationAppearanceView.js';

test('l’écran visage conserve le texte validé et la structure de création', () => {
    const html = playerCreationAppearanceTemplate(createAppearanceStepState());

    assert.match(html, /02 \/ 06/);
    assert.match(html, /Choisis ton visage/);
    assert.match(html, /Choisie bien !<br>avec le temps les visage évolue\./);
    assert.match(html, /data-face-id="face-01"/);
    assert.match(html, /data-face-id="face-06"/);
    assert.match(html, /class="stp-continue" disabled/);
});

test('un visage sélectionné est marqué et active Continuer', () => {
    const state = selectAppearanceFace(createAppearanceStepState(), 'face-04');
    const html = playerCreationAppearanceTemplate(state);

    assert.match(html, /class="stp-face-option selected" data-face-id="face-04" aria-pressed="true"/);
    assert.match(html, /class="stp-continue ready"/);
    assert.doesNotMatch(html, /class="stp-continue ready" disabled/);
});

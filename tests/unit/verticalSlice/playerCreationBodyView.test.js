import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createBodyStepState,
    updateBodyField
} from '../../../ui/verticalSlice/playerCreationBodyStep.js';
import { playerCreationBodyTemplate } from '../../../ui/verticalSlice/playerCreationBodyView.js';

test('l’écran gabarit donne la priorité à la silhouette et garde le fond matière', () => {
    const html = playerCreationBodyTemplate(createBodyStepState());

    assert.match(html, /03 \/ 06/);
    assert.doesNotMatch(html, /Ton corps à 14 ans\./);
    assert.match(html, />14 ans</);
    assert.match(html, /name="height"/);
    assert.match(html, /name="weight"/);
    assert.match(html, /stp-creation-material/);
    assert.match(html, /stp-body-panel/);
    assert.match(html, /stp-body-controls/);
    assert.match(html, /class="stp-continue ready"/);
});

test('les valeurs choisies et les proportions visuelles sont rendues dans l’interface', () => {
    let state = createBodyStepState();
    state = updateBodyField(state, 'height', 180);
    state = updateBodyField(state, 'weight', 70);

    const html = playerCreationBodyTemplate(state);
    assert.match(html, /value="180"/);
    assert.match(html, />180<span> cm<\/span>/);
    assert.match(html, /value="70"/);
    assert.match(html, />70<span> kg<\/span>/);
    assert.match(html, /--height-scale:/);
    assert.match(html, /--torso-width:/);
    assert.match(html, /--arm-width:/);
    assert.match(html, /--leg-width:/);
});

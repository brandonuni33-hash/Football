import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createBodyStepState,
    updateBodyField
} from '../../../ui/verticalSlice/playerCreationBodyStep.js';
import { playerCreationBodyTemplate } from '../../../ui/verticalSlice/playerCreationBodyView.js';

test('l’écran gabarit conserve la structure validée et le fond matière', () => {
    const html = playerCreationBodyTemplate(createBodyStepState());

    assert.match(html, /03 \/ 06/);
    assert.match(html, /Ton corps<br>à 14 ans\./);
    assert.match(html, /Avec les années, ton corps pourra encore évoluer/);
    assert.match(html, /name="height"/);
    assert.match(html, /name="weight"/);
    assert.match(html, /stp-creation-material/);
    assert.match(html, /class="stp-continue ready"/);
});

test('les valeurs choisies sont rendues dans l’interface', () => {
    let state = createBodyStepState();
    state = updateBodyField(state, 'height', 181);
    state = updateBodyField(state, 'weight', 67);

    const html = playerCreationBodyTemplate(state);
    assert.match(html, /value="181"/);
    assert.match(html, />181<span> cm<\/span>/);
    assert.match(html, /value="67"/);
    assert.match(html, />67<span> kg<\/span>/);
});

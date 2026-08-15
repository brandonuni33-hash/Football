import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createPositionAndFootStepState,
    selectPosition,
    selectPreferredFoot
} from '../../../ui/verticalSlice/playerCreationPositionAndFootStep.js';
import { playerCreationPositionAndFootTemplate } from '../../../ui/verticalSlice/playerCreationPositionAndFootView.js';

test('l’écran poste garde le fond matière et la disposition terrain', () => {
    const html = playerCreationPositionAndFootTemplate(createPositionAndFootStepState());
    assert.match(html, /04 \/ 06/);
    assert.match(html, /Où tu te sens le mieux/);
    assert.match(html, /stp-position-pitch/);
    assert.match(html, /data-position="GB"/);
    assert.match(html, /data-position="BU"/);
    assert.match(html, /data-foot="RIGHT"/);
    assert.match(html, /data-foot="LEFT"/);
    assert.match(html, /class="stp-continue" disabled/);
});

test('poste et pied sélectionnés sont visuellement marqués', () => {
    let state = createPositionAndFootStepState();
    state = selectPosition(state, 'MC');
    state = selectPreferredFoot(state, 'RIGHT');
    const html = playerCreationPositionAndFootTemplate(state);

    assert.match(html, /class="stp-position-marker selected" data-position="MC"/);
    assert.match(html, /class="stp-foot-option selected" data-foot="RIGHT"/);
    assert.match(html, /class="stp-continue ready"/);
});

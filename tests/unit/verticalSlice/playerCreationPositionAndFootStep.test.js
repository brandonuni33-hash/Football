import test from 'node:test';
import assert from 'node:assert/strict';
import {
    POSITION_OPTIONS,
    createPositionAndFootStepState,
    selectPosition,
    selectPreferredFoot,
    positionAndFootValidation,
    continueFromPositionAndFoot
} from '../../../ui/verticalSlice/playerCreationPositionAndFootStep.js';

test('l’étape poste expose dix positions et démarre sans choix', () => {
    const state = createPositionAndFootStepState();
    assert.equal(POSITION_OPTIONS.length, 10);
    assert.equal(state.screenIndex, 4);
    assert.equal(positionAndFootValidation(state).valid, false);
});

test('poste et pied fort sont enregistrés séparément', () => {
    let state = createPositionAndFootStepState({ faceId: 'face-03', height: 168, weight: 56 });
    state = selectPosition(state, 'MC');
    state = selectPreferredFoot(state, 'RIGHT');

    assert.equal(state.draft.position, 'MC');
    assert.equal(state.draft.preferredFoot, 'RIGHT');
    assert.equal(state.draft.height, 168);
    assert.equal(state.draft.weight, 56);
    assert.equal(positionAndFootValidation(state).valid, true);
});

test('un poste ou un pied inconnu est refusé', () => {
    const state = createPositionAndFootStepState();
    assert.throws(() => selectPosition(state, 'XYZ'), /Poste inconnu/);
    assert.throws(() => selectPreferredFoot(state, 'BOTH'), /Pied fort inconnu/);
});

test('continuer mène aux nationalités uniquement quand les deux choix sont faits', () => {
    const state = createPositionAndFootStepState();
    assert.equal(continueFromPositionAndFoot(state).ok, false);

    const selected = selectPreferredFoot(selectPosition(state, 'BU'), 'LEFT');
    const result = continueFromPositionAndFoot(selected);
    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'nationalities');
    assert.equal(result.state.screenIndex, 5);
});

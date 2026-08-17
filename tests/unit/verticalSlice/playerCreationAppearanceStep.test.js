import test from 'node:test';
import assert from 'node:assert/strict';
import {
    FACE_OPTIONS,
    createAppearanceStepState,
    selectAppearanceFace,
    appearanceValidation,
    appearanceViewModel,
    continueFromAppearance
} from '../../../ui/verticalSlice/playerCreationAppearanceStep.js';

test('l’étape visage expose six choix et démarre sans sélection', () => {
    const state = createAppearanceStepState({ firstname: 'Elias', lastname: 'Morel' });
    const vm = appearanceViewModel(state);

    assert.equal(FACE_OPTIONS.length, 6);
    assert.equal(vm.progress.current, 2);
    assert.equal(vm.progress.total, 6);
    assert.equal(vm.selectedFaceId, null);
    assert.equal(vm.canContinue, false);
});

test('sélectionner un visage écrit uniquement faceId dans le draft', () => {
    const state = createAppearanceStepState({ firstname: 'Elias', lastname: 'Morel' });
    const next = selectAppearanceFace(state, 'face-03');

    assert.equal(next.draft.faceId, 'face-03');
    assert.equal(next.draft.firstname, 'Elias');
    assert.equal(next.draft.lastname, 'Morel');
    assert.equal(appearanceValidation(next).valid, true);
});

test('un visage inconnu est refusé', () => {
    const state = createAppearanceStepState();
    assert.throws(() => selectAppearanceFace(state, 'face-99'), /Visage inconnu/);
});

test('continuer est impossible avant sélection puis mène au gabarit', () => {
    const state = createAppearanceStepState();
    assert.equal(continueFromAppearance(state).ok, false);

    const selected = selectAppearanceFace(state, 'face-01');
    const result = continueFromAppearance(selected);

    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'body');
    assert.equal(result.state.step, 'body');
    assert.equal(result.state.screenIndex, 3);
    assert.equal(result.state.draft.faceId, 'face-01');
});

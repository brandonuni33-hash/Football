import test from 'node:test';
import assert from 'node:assert/strict';
import {
    FACE_OPTIONS,
    BODY_LIMITS,
    createAppearanceStepState,
    selectAppearanceFace,
    updateAppearanceBodyField,
    appearanceValidation,
    appearanceViewModel,
    continueFromAppearance
} from '../../../ui/verticalSlice/playerCreationAppearanceStep.js';

test('l’étape apparence expose visage et gabarit sur le deuxième écran', () => {
    const state = createAppearanceStepState({ firstname: 'Elias', lastname: 'Morel' });
    const vm = appearanceViewModel(state);

    assert.equal(FACE_OPTIONS.length, 6);
    assert.equal(vm.progress.current, 2);
    assert.equal(vm.progress.total, 5);
    assert.equal(vm.selectedFaceId, null);
    assert.equal(vm.height.value, 168);
    assert.equal(vm.weight.value, 56);
    assert.equal(vm.canContinue, false);
});

test('sélectionner un visage conserve le gabarit et rend l’apparence valide', () => {
    const state = createAppearanceStepState({ firstname: 'Elias', lastname: 'Morel' });
    const next = selectAppearanceFace(state, 'face-03');

    assert.equal(next.draft.faceId, 'face-03');
    assert.equal(next.draft.firstname, 'Elias');
    assert.equal(next.draft.lastname, 'Morel');
    assert.equal(next.draft.height, 168);
    assert.equal(next.draft.weight, 56);
    assert.equal(appearanceValidation(next).valid, true);
});

test('taille et poids se règlent sur le même écran et restent bornés', () => {
    let state = createAppearanceStepState({ faceId: 'face-02' });
    state = updateAppearanceBodyField(state, 'height', 500);
    state = updateAppearanceBodyField(state, 'weight', 1);

    assert.equal(state.draft.height, BODY_LIMITS.height.max);
    assert.equal(state.draft.weight, BODY_LIMITS.weight.min);
    const vm = appearanceViewModel(state);
    assert.ok(vm.silhouette.heightScale > 0);
    assert.ok(vm.silhouette.torsoWidth > 0);
});

test('un visage inconnu est refusé', () => {
    const state = createAppearanceStepState();
    assert.throws(() => selectAppearanceFace(state, 'face-99'), /Visage inconnu/);
});

test('continuer mène directement à poste + pied fort', () => {
    const state = createAppearanceStepState();
    assert.equal(continueFromAppearance(state).ok, false);

    const selected = selectAppearanceFace(state, 'face-01');
    const result = continueFromAppearance(selected);

    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'positionAndFoot');
    assert.equal(result.state.step, 'positionAndFoot');
    assert.equal(result.state.screenIndex, 3);
    assert.equal(result.state.draft.faceId, 'face-01');
});

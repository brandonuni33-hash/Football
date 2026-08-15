import test from 'node:test';
import assert from 'node:assert/strict';
import {
    BODY_LIMITS,
    createBodyStepState,
    updateBodyField,
    bodyValidation,
    bodyViewModel,
    continueFromBody
} from '../../../ui/verticalSlice/playerCreationBodyStep.js';

test('l’étape gabarit reprend les valeurs de départ validées', () => {
    const state = createBodyStepState({ firstname: 'Elias', lastname: 'Morel', faceId: 'face-03' });
    const vm = bodyViewModel(state);

    assert.equal(vm.progress.current, 3);
    assert.equal(vm.progress.total, 6);
    assert.equal(vm.height.value, 168);
    assert.equal(vm.weight.value, 56);
    assert.equal(vm.canContinue, true);
});

test('à 14 ans la taille est limitée à 180 cm et le poids à 70 kg', () => {
    assert.equal(BODY_LIMITS.height.max, 180);
    assert.equal(BODY_LIMITS.weight.max, 70);

    let state = createBodyStepState({ faceId: 'face-03' });
    state = updateBodyField(state, 'height', 180);
    state = updateBodyField(state, 'weight', 70);

    assert.equal(state.draft.height, 180);
    assert.equal(state.draft.weight, 70);
    assert.equal(bodyValidation(state).valid, true);
});

test('les valeurs hors plage sont bornées sans modifier le reste du joueur', () => {
    let state = createBodyStepState({ firstname: 'Elias', faceId: 'face-02' });
    state = updateBodyField(state, 'height', 500);
    state = updateBodyField(state, 'weight', 1);

    assert.equal(state.draft.height, BODY_LIMITS.height.max);
    assert.equal(state.draft.weight, BODY_LIMITS.weight.min);
    assert.equal(state.draft.firstname, 'Elias');
    assert.equal(state.draft.faceId, 'face-02');
});

test('le gabarit visuel grandit et s’élargit avec les sliders', () => {
    let light = createBodyStepState({ height: 145, weight: 38 });
    let strong = createBodyStepState({ height: 180, weight: 70 });

    const lightVm = bodyViewModel(light);
    const strongVm = bodyViewModel(strong);

    assert.ok(strongVm.silhouette.heightScale > lightVm.silhouette.heightScale);
    assert.ok(strongVm.silhouette.torsoWidth > lightVm.silhouette.torsoWidth);
    assert.ok(strongVm.silhouette.armWidth > lightVm.silhouette.armWidth);
    assert.ok(strongVm.silhouette.legWidth > lightVm.silhouette.legWidth);
});

test('continuer depuis le gabarit mène à poste + pied fort', () => {
    const result = continueFromBody(createBodyStepState());

    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'positionAndFoot');
    assert.equal(result.state.step, 'positionAndFoot');
    assert.equal(result.state.screenIndex, 4);
});

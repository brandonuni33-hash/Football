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

test('taille et poids sont modifiables dans les limites de l’écran', () => {
    let state = createBodyStepState({ faceId: 'face-03' });
    state = updateBodyField(state, 'height', 183);
    state = updateBodyField(state, 'weight', 72);

    assert.equal(state.draft.height, 183);
    assert.equal(state.draft.weight, 72);
    assert.equal(state.draft.faceId, 'face-03');
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

test('continuer depuis le gabarit mène à poste + pied fort', () => {
    const result = continueFromBody(createBodyStepState());

    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'positionAndFoot');
    assert.equal(result.state.step, 'positionAndFoot');
    assert.equal(result.state.screenIndex, 4);
});

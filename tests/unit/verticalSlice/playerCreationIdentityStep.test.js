import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createIdentityStepState,
    updateIdentityField,
    identityViewModel,
    continueFromIdentity,
    IDENTITY_LIMITS
} from '../../../ui/verticalSlice/playerCreationIdentityStep.js';

test('l’identité démarre sur le premier écran des cinq écrans', () => {
    const state = createIdentityStepState();
    const vm = identityViewModel(state);

    assert.equal(state.step, 'identity');
    assert.equal(vm.progress.current, 1);
    assert.equal(vm.progress.total, 5);
    assert.equal(vm.canContinue, false);
});

test('prénom et nom alimentent l’aperçu sans modifier les autres données du draft', () => {
    let state = createIdentityStepState({ height: 174 });
    state = updateIdentityField(state, 'firstname', 'Elias');
    state = updateIdentityField(state, 'lastname', 'Morel');

    const vm = identityViewModel(state);
    assert.equal(vm.previewName, 'Elias Morel');
    assert.equal(vm.canContinue, true);
    assert.equal(state.draft.height, 174);
});

test('les limites de saisie sont appliquées dans le contrat de l’écran', () => {
    let state = createIdentityStepState();
    state = updateIdentityField(state, 'firstname', 'A'.repeat(40));
    state = updateIdentityField(state, 'lastname', 'B'.repeat(40));

    assert.equal(state.draft.firstname.length, IDENTITY_LIMITS.firstname);
    assert.equal(state.draft.lastname.length, IDENTITY_LIMITS.lastname);
});

test('continuer est refusé tant que les deux champs ne sont pas remplis', () => {
    let state = createIdentityStepState();
    state = updateIdentityField(state, 'firstname', 'Elias');

    const result = continueFromIdentity(state);
    assert.equal(result.ok, false);
    assert.equal(result.errors.lastname, 'Nom requis.');
});

test('une identité complète ouvre l’étape apparence unique', () => {
    let state = createIdentityStepState();
    state = updateIdentityField(state, 'firstname', 'Elias');
    state = updateIdentityField(state, 'lastname', 'Morel');

    const result = continueFromIdentity(state);
    assert.equal(result.ok, true);
    assert.equal(result.nextStep, 'appearance');
    assert.equal(result.state.screenIndex, 2);
    assert.equal(result.state.draft.origin, undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_CAMERA_STATE, resolveInteractiveMatchPresentation } from '../../domain/match/interactiveMatchPresentationState.js';

test('la logique de match choisit la caméra, jamais l interface', () => {
    assert.deepEqual(resolveInteractiveMatchPresentation({ phase: 'kickoff' }), {
        cameraState: MATCH_CAMERA_STATE.BUILD_UP,
        emotionalIntensity: 0,
        visualFocus: 'ball'
    });
    assert.equal(resolveInteractiveMatchPresentation({ kind: 'decision', label: 'OCCASION DE BUT' }).cameraState, MATCH_CAMERA_STATE.DANGER);
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'consequence_1', text: 'La frappe part vers le but.' }).cameraState, MATCH_CAMERA_STATE.SHOT);
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'unexpected_event', title: 'Un espace se dessine' }).cameraState, MATCH_CAMERA_STATE.COUNTER_ATTACK);
});

test('les huit états caméra validés restent disponibles', () => {
    assert.deepEqual(Object.values(MATCH_CAMERA_STATE), [
        'NORMAL','BUILD_UP','COUNTER_ATTACK','DANGER','DUEL','SHOT','GOAL','SET_PIECE'
    ]);
    for (const cameraState of Object.values(MATCH_CAMERA_STATE)) {
        const presentation = resolveInteractiveMatchPresentation({ cameraState, emotionalIntensity: 9 });
        assert.equal(presentation.cameraState, cameraState);
        assert.equal(presentation.emotionalIntensity, 3);
    }
});

test('un coup de pied arrêté reste distinct du but et de la frappe', () => {
    const presentation = resolveInteractiveMatchPresentation({
        kind: 'decision',
        title: 'Penalty décisif',
        text: 'Le gardien attend sur sa ligne.'
    });
    assert.equal(presentation.cameraState, MATCH_CAMERA_STATE.SET_PIECE);
    assert.equal(presentation.emotionalIntensity, 2);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { MATCH_CAMERA_STATE, resolveInteractiveMatchPresentation } from '../../domain/match/interactiveMatchPresentationState.js';

test('la logique de match choisit la caméra, jamais l interface', () => {
    assert.deepEqual(resolveInteractiveMatchPresentation({ phase: 'kickoff' }), {
        cameraState: MATCH_CAMERA_STATE.BUILD_UP,
        emotionalIntensity: 0,
        visualFocus: 'ball',
        playerControlled: false
    });
    assert.equal(resolveInteractiveMatchPresentation({ kind: 'decision', label: 'OCCASION DE BUT' }).cameraState, MATCH_CAMERA_STATE.DANGER);
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'consequence_1', text: 'La frappe part vers le but.' }).cameraState, MATCH_CAMERA_STATE.SHOT);
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'unexpected_event', title: 'Un espace se dessine' }).cameraState, MATCH_CAMERA_STATE.COUNTER_ATTACK);
});

test('la vue tactique est passive sauf pendant une décision du joueur', () => {
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'match_continues' }).playerControlled, false);
    assert.equal(resolveInteractiveMatchPresentation({ phase: 'moment_1', kind: 'decision' }).playerControlled, true);
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

test('un texte qui contient but ne peut jamais confirmer un but à lui seul', () => {
    assert.notEqual(
        resolveInteractiveMatchPresentation({ phase: 'consequence_1', title: 'Pas but !', text: 'Le gardien repousse.' }).cameraState,
        MATCH_CAMERA_STATE.GOAL
    );
    const confirmed = resolveInteractiveMatchPresentation({ phase: 'goal', title: 'But confirmé' });
    assert.equal(confirmed.cameraState, MATCH_CAMERA_STATE.GOAL);
    assert.equal(confirmed.emotionalIntensity, 3);
});

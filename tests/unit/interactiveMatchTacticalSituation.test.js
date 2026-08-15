import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInteractiveMatchTacticalSituation } from '../../domain/match/interactiveMatchTacticalSituation.js';

test('chaque situation tactique contient onze joueurs par équipe et un ballon', () => {
    for (const state of ['NORMAL','BUILD_UP','COUNTER_ATTACK','DANGER','DUEL','SHOT','GOAL','SET_PIECE']) {
        const tactical = buildInteractiveMatchTacticalSituation({ cameraState: state });
        assert.equal(tactical.home.length, 11, `${state}: équipe joueur`);
        assert.equal(tactical.away.length, 11, `${state}: adversaire`);
        for (const actor of [...tactical.home, ...tactical.away, tactical.ball]) {
            assert.ok(actor.x >= 4 && actor.x <= 96, `${state}: x hors terrain`);
            assert.ok(actor.y >= 4 && actor.y <= 96, `${state}: y hors terrain`);
        }
    }
});

test('une situation dangereuse avance réellement le ballon et le bloc du joueur', () => {
    const normal = buildInteractiveMatchTacticalSituation({ cameraState: 'NORMAL' });
    const danger = buildInteractiveMatchTacticalSituation({ cameraState: 'DANGER' });
    assert.ok(danger.ball.x > normal.ball.x);
    assert.ok(danger.home[9].x > normal.home[9].x);
});

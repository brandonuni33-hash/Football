import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInteractiveMatchTacticalSituation, tacticalExperienceProfile } from '../../domain/match/interactiveMatchTacticalSituation.js';

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
    const normal = buildInteractiveMatchTacticalSituation({ cameraState: 'NORMAL', seed: 'same-match' });
    const danger = buildInteractiveMatchTacticalSituation({ cameraState: 'DANGER', seed: 'same-match' });
    assert.ok(danger.ball.x > normal.ball.x);
    assert.ok(danger.home[9].x > normal.home[9].x);
});

test('les U15 gardent une organisation moins parfaite que les pros sans devenir aléatoires', () => {
    const input = { cameraState: 'BUILD_UP', seed: 'academy-match-42' };
    const youth = buildInteractiveMatchTacticalSituation({ ...input, playerAge: 15, competition: 'Division U15' });
    const youthAgain = buildInteractiveMatchTacticalSituation({ ...input, playerAge: 15, competition: 'Division U15' });
    const pro = buildInteractiveMatchTacticalSituation({ ...input, playerAge: 25, competition: 'Ligue 1' });

    assert.equal(youth.organization.level, 'U15');
    assert.equal(pro.organization.level, 'PRO');
    assert.ok(youth.organization.discipline < pro.organization.discipline);
    assert.deepEqual(youth.home, youthAgain.home, 'la désorganisation doit être stable pour une même scène');

    const displacement = youth.home.reduce((sum, player, index) => {
        const senior = pro.home[index];
        return sum + Math.abs(player.x - senior.x) + Math.abs(player.y - senior.y);
    }, 0);
    assert.ok(displacement > 20, 'la structure U15 doit être visiblement moins propre que la structure pro');
});

test('une compétition senior reste tactiquement senior même avec un jeune joueur', () => {
    assert.equal(tacticalExperienceProfile({ playerAge: 18, competition: 'Ligue 1' }).id, 'PRO');
    assert.equal(tacticalExperienceProfile({ playerAge: 15, competition: 'Championnat U15' }).id, 'U15');
});

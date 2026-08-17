import test from 'node:test';
import assert from 'node:assert/strict';

import {
    MATURITY_PROFILE,
    SIMULATION_DEPTH,
    createClubWorldProfile,
    createWorldModelState,
    createWorldPlayerRecord,
    validateWorldPlayerRecord
} from '../../domain/world/worldModel.js';
import { buildWorldActivationPlan, applyWorldActivationPlan } from '../../domain/world/worldActivationPolicy.js';

const clubs = [
    { id: 'A', name: 'A', country: 'France', leagueId: 'L1', tier: 1, strength: 88, prestige: 5, centerStars: 5, finances: 5 },
    { id: 'B', name: 'B', country: 'France', leagueId: 'L1', tier: 1, strength: 72, prestige: 3, centerStars: 3, finances: 3 },
    { id: 'C', name: 'C', country: 'France', leagueId: 'L2', tier: 2, strength: 62, prestige: 2, centerStars: 3, finances: 2 },
    { id: 'D', name: 'D', country: 'Angleterre', leagueId: 'CH', tier: 2, strength: 65, prestige: 3, centerStars: 3, finances: 3 }
];

test('world player sépare niveau actuel et développement caché', () => {
    const player = createWorldPlayerRecord({
        id: 'p1',
        age: 14,
        currentLevel: 58,
        dynamicPotential: 84,
        rawCeiling: 88,
        maturityProfile: MATURITY_PROFILE.LATE
    });

    assert.equal(player.currentLevel, 58);
    assert.equal(player.development.dynamicPotential, 84);
    assert.equal(player.development.rawCeiling, 88);
    assert.equal(player.development.maturityProfile, MATURITY_PROFILE.LATE);
    assert.equal(validateWorldPlayerRecord(player), true);
});

test('le potentiel dynamique ne peut jamais être inférieur au niveau actuel', () => {
    const player = createWorldPlayerRecord({ id: 'p2', currentLevel: 76, dynamicPotential: 65, rawCeiling: 70 });
    assert.equal(player.development.dynamicPotential, 76);
    assert.equal(player.development.rawCeiling, 76);
});

test('un club du catalogue est converti sans logique narrative', () => {
    const profile = createClubWorldProfile(clubs[0]);
    assert.equal(profile.sportingLevel, 88);
    assert.equal(profile.academyQuality, 5);
    assert.equal(profile.leagueId, 'L1');
});

test('la profondeur dynamique place le club joueur dans la bubble et sa ligue en active', () => {
    const plan = buildWorldActivationPlan({
        playerClubId: 'A',
        playerLeagueId: 'L1',
        clubs,
        interestedClubIds: ['C']
    });

    assert.equal(plan.clubDepth.A, SIMULATION_DEPTH.BUBBLE);
    assert.equal(plan.clubDepth.B, SIMULATION_DEPTH.ACTIVE);
    assert.equal(plan.clubDepth.C, SIMULATION_DEPTH.ACTIVE);
    assert.equal(plan.clubDepth.D, SIMULATION_DEPTH.GLOBAL);
});

test('appliquer un plan matérialise seulement bubble et active', () => {
    const model = createWorldModelState();
    model.players.p1 = createWorldPlayerRecord({ id: 'p1', clubId: 'A' });
    model.players.p2 = createWorldPlayerRecord({ id: 'p2', clubId: 'D' });

    const plan = buildWorldActivationPlan({ playerClubId: 'A', playerLeagueId: 'L1', clubs });
    applyWorldActivationPlan(model, plan, 'career_start');

    assert.equal(model.players.p1.detail.materialized, true);
    assert.equal(model.players.p1.detail.depth, SIMULATION_DEPTH.BUBBLE);
    assert.equal(model.players.p2.detail.materialized, false);
    assert.equal(model.players.p2.detail.depth, SIMULATION_DEPTH.GLOBAL);
    assert.equal(model.lastActivationReason, 'career_start');
});

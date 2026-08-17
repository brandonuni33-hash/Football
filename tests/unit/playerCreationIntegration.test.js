import test from 'node:test';
import assert from 'node:assert/strict';

import { PlayerLogic } from '../../player.js';
import { createPlayerCreationDraft, toCareerCreationIdentity } from '../../ui/verticalSlice/playerCreationDraft.js';
import { careerPayloadFromDraft, PLAYER_CREATION_STEPS } from '../../ui/verticalSlice/playerCreationFlowController.js';

test('la création officielle expose exactement six étapes modernes', () => {
    assert.deepEqual(
        PLAYER_CREATION_STEPS.map(step => step.id),
        ['identity', 'appearance', 'body', 'positionAndFoot', 'nationalities', 'childhoodCountry']
    );
});

test('le draft final conserve les données validées et diffère les choix narratifs', () => {
    const draft = createPlayerCreationDraft({
        firstname: 'Elias',
        lastname: 'Morel',
        faceId: 'face-01',
        height: 168,
        weight: 56,
        position: 'BU',
        preferredFoot: 'RIGHT',
        primaryNationality: 'France',
        secondaryNationality: 'Maroc',
        raisedInCountry: 'France'
    });

    const identity = toCareerCreationIdentity(draft);
    assert.equal(identity.age, 14);
    assert.equal(identity.preferredFoot, 'RIGHT');
    assert.equal(identity.primaryNationality, 'France');
    assert.equal(identity.secondaryNationality, 'Maroc');
    assert.equal(identity.raisedInCountry, 'France');
    assert.equal(identity.origin, null);
    assert.equal(identity.youthClub, null);
    assert.equal(identity.heartClub, null);

    const payload = careerPayloadFromDraft(draft);
    assert.equal(payload.country, 'France');
    assert.equal(payload.origin, null);
    assert.equal(payload.youthClub, null);
    assert.equal(payload.heartClub, null);
});

test('PlayerLogic persiste la nouvelle identité sans attribuer une origine football cachée', () => {
    const player = PlayerLogic.createPlayerProfile({
        firstname: 'Elias',
        lastname: 'Morel',
        age: 14,
        faceId: 'face-03',
        height: 166,
        weight: 54,
        position: 'AD',
        preferredFoot: 'LEFT',
        primaryNationality: 'Maroc',
        secondaryNationality: 'France',
        raisedInCountry: 'France',
        origin: null,
        youthClub: null,
        heartClub: null
    });

    assert.equal(player.age, 14);
    assert.equal(player.faceId, 'face-03');
    assert.equal(player.preferredFoot, 'LEFT');
    assert.equal(player.nationality, 'Maroc');
    assert.equal(player.primaryNationality, 'Maroc');
    assert.equal(player.secondaryNationality, 'France');
    assert.equal(player.raisedInCountry, 'France');
    assert.equal(player.country, 'France');
    assert.equal(player.origin, null);
    assert.equal(player.originLabel, null);
    assert.equal(player.trait, null);
    assert.equal(player.youthClub, null);
    assert.equal(player.heartClub, null);
});

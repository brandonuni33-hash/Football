import test from 'node:test';
import assert from 'node:assert/strict';
import PlayerLogic from '../../player.js';
import { CareerApplication } from '../../application/careerApplication.js';
import { createPlayerCreationDraft, toCareerCreationIdentity } from '../../ui/verticalSlice/playerCreationDraft.js';

function createApplication() {
    let saved = null;
    const noop = () => {};
    const application = new CareerApplication({
        stateManager: { save: state => { saved = state; return true; } },
        playerLogic: PlayerLogic,
        economyManager: { calculateContractOffer: () => ({ weeklySalary: 120, signingBonus: 0, durationYears: 2 }) },
        socialSystem: {
            initSocialData: coachName => ({ coachData: { name: coachName } }),
            ensureRelationships: noop
        },
        mediaSystem: { initMediaData: () => ({}) },
        consequenceSystem: { initialize: noop },
        potentialSystem: { ensure: noop },
        careerSystem: {
            initialize: (player, club) => {
                player.careerProfile ||= { stage: 'academy', youthCategory: 'U15', sourceClub: club || null };
            },
            refreshStage: noop
        },
        competitionSystem: { ensureSeasonSchedule: noop },
        worldSystem: { normalizeCareerClub: noop, ensureWorld: noop, getClub: () => null },
        cupSystem: { ensure: noop },
        schemaVersion: 5
    });
    return { application, saved: () => saved };
}

test('le draft moderne devient le joueur réellement sauvegardé par Street to Pro', () => {
    const draft = createPlayerCreationDraft({
        firstname: 'Elias', lastname: 'Morel', faceId: 'face-04',
        height: 171, weight: 58, position: 'MC', preferredFoot: 'LEFT',
        primaryNationality: 'France', secondaryNationality: 'Algérie', raisedInCountry: 'France'
    });
    const selectedData = toCareerCreationIdentity(draft);
    const { application, saved } = createApplication();
    const state = application.create(selectedData);

    assert.equal(saved(), state);
    assert.deepEqual({
        firstname: state.player.firstname,
        lastname: state.player.lastname,
        age: state.player.age,
        faceId: state.player.faceId,
        height: state.player.height,
        weight: state.player.weight,
        position: state.player.position,
        preferredFoot: state.player.preferredFoot,
        primaryNationality: state.player.primaryNationality,
        secondaryNationality: state.player.secondaryNationality,
        raisedInCountry: state.player.raisedInCountry,
        origin: state.player.origin,
        youthClub: state.player.youthClub,
        heartClub: state.player.heartClub
    }, {
        firstname: 'Elias', lastname: 'Morel', age: 14, faceId: 'face-04',
        height: 171, weight: 58, position: 'MC', preferredFoot: 'LEFT',
        primaryNationality: 'France', secondaryNationality: 'Algérie', raisedInCountry: 'France',
        origin: null, youthClub: null, heartClub: null
    });
});

test('les champs historiques restent acceptés pour les sauvegardes et appels existants', () => {
    const player = PlayerLogic.createPlayerProfile({
        firstname: 'Legacy', lastname: 'Player', country: 'France', position: 'BU',
        origin: 'FUTSAL', heartClub: 'Paris SG', youthClub: { name: 'Academy' }
    });
    assert.equal(player.origin, 'FUTSAL');
    assert.equal(player.heartClub, 'Paris SG');
    assert.deepEqual(player.youthClub, { name: 'Academy' });
    assert.equal(PlayerLogic.createPlayerProfile({ firstname: 'Default' }).origin, 'CENTRE_FORMATION');
});

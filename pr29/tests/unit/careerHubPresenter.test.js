import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildCareerHubModel,
    findNextCareerFixture,
    resolveCurrentSituation,
    resolveNextChallenge
} from '../../ui/career/careerHubPresenter.js';

function state(overrides = {}) {
    return {
        player: {
            firstname: 'Samir', lastname: 'Test', age: 14, position: 'AD', club: 'Test FC',
            squadStatus: 'Rotation U15', fitness: 88, potential: 94, overall: 61
        },
        calendar: {
            currentMonth: 8,
            currentPeriod: 'Reprise',
            seasonSchedule: {
                matches: [
                    { id: 'played', month: 8, opponent: 'Ancien FC', played: true },
                    { id: 'next', month: 8, opponent: 'Rival U15', competitionName: 'Championnat U15', played: false }
                ],
                category: 'U15'
            }
        },
        notifications: { signals: [] },
        ...overrides
    };
}

test('le hub met le prochain match devant les données secondaires', () => {
    const input = state({ career: { balance: 999999 } });
    const model = buildCareerHubModel(input, []);
    assert.equal(model.nextChallenge.title, 'Prochain match : Rival U15');
    assert.equal(model.nextChallenge.detail, 'Championnat U15 · U15');
    assert.equal(model.player.name, 'Samir Test');
    assert.equal(Object.hasOwn(model.player, 'potential'), false);
    assert.equal(Object.hasOwn(model.player, 'overall'), false);
});

test('une décision de transfert passe avant le prochain match', () => {
    const input = state({ pendingTransferOffer: { club: 'Nouveau FC' } });
    assert.equal(resolveCurrentSituation(input).title, 'Une décision t’attend avec Nouveau FC');
    assert.equal(resolveNextChallenge(input).title, 'Répondre à Nouveau FC');
});

test('la prochaine rencontre ignore les matchs déjà joués', () => {
    assert.equal(findNextCareerFixture(state()).id, 'next');
});

test('une notification importante non lue peut définir la situation actuelle', () => {
    const input = state({
        notifications: {
            signals: [
                { id: 'coach-1', category: 'coach', title: 'Tu te rapproches du onze', body: 'Le coach te donne plus de responsabilités.', read: false }
            ]
        }
    });
    const situation = resolveCurrentSituation(input);
    assert.equal(situation.title, 'Tu te rapproches du onze');
    assert.equal(situation.detail, 'Le coach te donne plus de responsabilités.');
});

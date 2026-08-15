import test from 'node:test';
import assert from 'node:assert/strict';
import { LifeView } from '../../ui/views/lifeView.js';

function renderLife(state) {
    return new LifeView({ gateway: { state } }).render(state);
}

test('Vie traduit une relation en ressenti sans exposer son score interne', () => {
    const html = renderLife({
        relationshipNetwork: [
            { name: 'Malik', role: 'Coéquipier', score: 82 }
        ],
        notifications: { signals: [] }
    });

    assert.match(html, /Malik/);
    assert.match(html, /Très proche/);
    assert.doesNotMatch(html, /82\s*\/\s*100/);
});

test('Vie ne débloque pas les médias sur le seul âge ou des matchs non qualifiés de pros', () => {
    const html = renderLife({
        player: { age: 20, stats: { matchesPlayed: 24 } },
        media: {
            proCoverageUnlocked: false,
            recentDilemma: {
                title: 'Interview après le match',
                description: 'Les médias attendent ta réponse.',
                choices: [{ text: 'Répondre' }]
            }
        },
        notifications: { signals: [] }
    });

    assert.doesNotMatch(html, /Interview après le match/);
    assert.doesNotMatch(html, />MÉDIAS</);
});

test('Vie affiche un dilemme média seulement après une apparition professionnelle explicite', () => {
    const html = renderLife({
        player: { age: 17, stats: { professionalMatches: 1 } },
        media: {
            proCoverageUnlocked: true,
            recentDilemma: {
                title: 'Première interview pro',
                description: 'Ta première prise de parole compte.',
                choices: [{ text: 'Rester sobre' }]
            }
        },
        notifications: { signals: [] }
    });

    assert.match(html, /Première interview pro/);
    assert.match(html, /Rester sobre/);
});

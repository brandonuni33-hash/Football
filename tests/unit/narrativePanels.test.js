import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getActiveNarrativePanelIndex,
    normalizeNarrativePanelsScene
} from '../../ui/narrativePanels.js';

const scene = {
    id: 'apartment-to-city',
    panels: [
        { id: 'apartment', activeFrom: 0, activeTo: 3000, media: { src: 'apartment.jpg' } },
        { id: 'arrival', activeFrom: 3000, activeTo: 6000, media: { src: 'city.jpg' } },
        { id: 'action', activeFrom: 6000, activeTo: 9000, media: { type: 'video', src: 'city-action.mp4' } }
    ]
};

test('NarrativePanels normalise une scène sans créer de logique métier', () => {
    const normalized = normalizeNarrativePanelsScene(scene);
    assert.equal(normalized.id, 'apartment-to-city');
    assert.equal(normalized.panels.length, 3);
    assert.equal(normalized.panels[0].media.type, 'image');
    assert.equal(normalized.panels[2].media.type, 'video');
    assert.equal(Object.isFrozen(normalized), true);
    assert.equal(Object.isFrozen(normalized.panels), true);
});

test('NarrativePanels active une seule case selon le temps de présentation', () => {
    assert.equal(getActiveNarrativePanelIndex(scene, 0), 0);
    assert.equal(getActiveNarrativePanelIndex(scene, 2999), 0);
    assert.equal(getActiveNarrativePanelIndex(scene, 3000), 1);
    assert.equal(getActiveNarrativePanelIndex(scene, 6500), 2);
    assert.equal(getActiveNarrativePanelIndex(scene, 12000), 2);
});

test('NarrativePanels refuse plus de trois cases et les fenêtres invalides', () => {
    assert.throws(
        () => normalizeNarrativePanelsScene({ panels: [{}, {}, {}, {}] }),
        /entre 1 et 3 panneaux/
    );
    assert.throws(
        () => normalizeNarrativePanelsScene({ panels: [{ activeFrom: 5, activeTo: 5 }] }),
        /supérieur à activeFrom/
    );
});

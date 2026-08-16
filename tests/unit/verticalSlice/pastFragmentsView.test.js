import test from 'node:test';
import assert from 'node:assert/strict';
import { PAST_FRAGMENTS } from '../../../content/verticalSlice/pastFragments.js';
import { pastFragmentTemplate } from '../../../ui/verticalSlice/pastFragmentsView.js';

test('le storyboard canonique contient cinq souvenirs dans le bon ordre', () => {
    assert.equal(PAST_FRAGMENTS.length, 5);
    assert.deepEqual(PAST_FRAGMENTS.map(fragment => fragment.visualKey), ['salon', 'cour', 'city', 'chambre', 'porte']);
});

test('le premier souvenir affiche le Salon et ses trois réponses validées', () => {
    const fragment = PAST_FRAGMENTS[0];
    const html = pastFragmentTemplate(fragment, 0, PAST_FRAGMENTS.length);
    assert.match(html, /data-stp-step="pastFragments"/);
    assert.match(html, /1 \/ 5/);
    assert.match(html, /Quand tu regardes un joueur/);
    assert.equal((html.match(/data-memory-answer=/g) || []).length, 3);
});

test('chaque souvenir conserve sa clé visuelle dans le rendu', () => {
    for (const fragment of PAST_FRAGMENTS) {
        const html = pastFragmentTemplate(fragment, 0, PAST_FRAGMENTS.length);
        assert.match(html, new RegExp(`visual-${fragment.visualKey}`));
    }
});

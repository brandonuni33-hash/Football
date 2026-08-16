import test from 'node:test';
import assert from 'node:assert/strict';
import { PAST_FRAGMENTS } from '../../../content/verticalSlice/pastFragments.js';
import { pastFragmentTemplate } from '../../../ui/verticalSlice/pastFragmentsView.js';

test('le souvenir affiche la question et les quatre réponses validées', () => {
    const fragment = PAST_FRAGMENTS[0];
    const html = pastFragmentTemplate(fragment, 0, PAST_FRAGMENTS.length);

    assert.match(html, /data-stp-step="pastFragments"/);
    assert.match(html, /1 \/ 4/);
    assert.match(html, /Qu’est-ce qui te traverse en premier/);
    assert.equal((html.match(/data-memory-answer=/g) || []).length, 4);
});

test('chaque type de souvenir conserve sa clé visuelle dans le rendu', () => {
    for (const fragment of PAST_FRAGMENTS) {
        const html = pastFragmentTemplate(fragment, 0, PAST_FRAGMENTS.length);
        assert.match(html, new RegExp(`visual-${fragment.visualKey}`));
    }
});

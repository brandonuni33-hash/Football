import test from 'node:test';
import assert from 'node:assert/strict';
import { PAST_FRAGMENTS, getPastFragmentById } from '../../../content/verticalSlice/pastFragments.js';
import { NARRATIVE_PANEL_CONTRACT, CITY_DIALOGUE_SCENE } from '../../../content/verticalSlice/prologueScenes.js';

test('la baseline contient quatre fragments du passé', () => {
  assert.equal(PAST_FRAGMENTS.length, 4);
  for (const fragment of PAST_FRAGMENTS) {
    assert.equal(fragment.answers.length, 4);
    assert.ok(fragment.question);
    assert.ok(fragment.prompt);
  }
});

test('les fragments ne publient aucun bonus ou poids de personnalité', () => {
  const serialized = JSON.stringify(PAST_FRAGMENTS);
  assert.doesNotMatch(serialized, /bonus|malus|weight|traitDelta|statDelta/i);
});

test('le fragment penalty conserve les quatre réponses validées', () => {
  const fragment = getPastFragmentById('decisive-penalty');
  assert.equal(fragment.question, 'Qu’est-ce qui te traverse en premier ?');
  assert.deepEqual(fragment.answers.map(answer => answer.text), [
    'Pourvu que je ne me ridiculise pas.',
    'Je sais déjà où je vais tirer.',
    'Le gardien est peut-être aussi nerveux que moi.',
    'Je veux le prendre. Même si je le rate.'
  ]);
});

test('la navigation narrative baseline est un swipe horizontal sans chrome haut', () => {
  assert.equal(NARRATIVE_PANEL_CONTRACT.panelCount, 3);
  assert.equal(NARRATIVE_PANEL_CONTRACT.navigation, 'HORIZONTAL_SWIPE');
  assert.equal(NARRATIVE_PANEL_CONTRACT.forwardGesture, 'LEFT');
  assert.equal(NARRATIVE_PANEL_CONTRACT.backGesture, 'RIGHT');
  assert.equal(NARRATIVE_PANEL_CONTRACT.topChrome, false);
  assert.equal(NARRATIVE_PANEL_CONTRACT.dialogueOnlyOnActivePanel, true);
});

test('le dialogue city conduit au 3v3 sans dépendre du moteur de match', () => {
  assert.equal(CITY_DIALOGUE_SCENE.next, 'city-3v3');
  assert.equal(CITY_DIALOGUE_SCENE.lines[0].text, 'T’es bien long toi.');
  assert.equal(CITY_DIALOGUE_SCENE.lines.at(-1).text, 'Je préfère même pas répondre.');
});

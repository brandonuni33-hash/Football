import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APARTMENT_SCENE,
  CITY_DIALOGUE_SCENE,
  NARRATIVE_PANEL_CONTRACT
} from '../../../content/verticalSlice/prologueScenes.js';

test('la scène appartement conserve le départ vers le city', () => {
  const texts = APARTMENT_SCENE.lines.map(item => item.text);
  assert.ok(texts.includes('Nan, après je vais au city avec Kemi et Rudhi.'));
  assert.ok(texts.includes('Lâche la play un peu, viens on sort ?'));
});

test('la scène city conserve Kemi et Rudhi avant le 3v3', () => {
  assert.equal(CITY_DIALOGUE_SCENE.lines[0].speaker, 'Kemi');
  assert.equal(CITY_DIALOGUE_SCENE.lines[0].text, 'T’es bien long toi.');
  assert.equal(CITY_DIALOGUE_SCENE.next, 'city-3v3');
});

test('le rendu narratif n’exige aucun chrome supérieur', () => {
  assert.equal(NARRATIVE_PANEL_CONTRACT.topChrome, false);
  assert.equal(NARRATIVE_PANEL_CONTRACT.panelCount, 3);
});

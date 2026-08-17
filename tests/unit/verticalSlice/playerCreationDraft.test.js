import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATION_SCREENS,
  CHILDHOOD_CONTINENTS,
  PREFERRED_FEET,
  VERTICAL_SLICE_START_AGE,
  VERTICAL_SLICE_BODY_LIMITS,
  createPlayerCreationDraft,
  validatePlayerCreationDraft,
  toCareerCreationIdentity
} from '../../../ui/verticalSlice/playerCreationDraft.js';

test('la création garde cinq écrans et regroupe tête + corps sur Apparence', () => {
  assert.deepEqual(CREATION_SCREENS, ['identity','appearance','positionAndFoot','nationalities','childhoodCountry']);
  assert.deepEqual(PREFERRED_FEET, ['RIGHT', 'LEFT']);
  assert.deepEqual(CHILDHOOD_CONTINENTS, ['Europe', 'Afrique']);
});

test('le joueur commence à 14 ans sans continent imposé', () => {
  const draft = createPlayerCreationDraft();
  assert.equal(draft.age, VERTICAL_SLICE_START_AGE);
  assert.equal(draft.age, 14);
  assert.equal(draft.raisedInCountry, null);
  assert.equal(draft.raisedInContinent, null);
});

test('le gabarit de création reste borné pour un joueur de 14 ans', () => {
  assert.deepEqual(VERTICAL_SLICE_BODY_LIMITS.height, { min: 145, max: 180 });
  assert.deepEqual(VERTICAL_SLICE_BODY_LIMITS.weight, { min: 38, max: 70 });
  const draft = createPlayerCreationDraft({ firstname:'Elias', lastname:'Morel', faceId:'face-01', height:181, weight:71, position:'MC', preferredFoot:'RIGHT', primaryNationality:'France', raisedInContinent:'Europe' });
  const validation = validatePlayerCreationDraft(draft);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.height, 'Taille invalide.');
  assert.equal(validation.errors.weight, 'Poids invalide.');
});

test('le pied fort est obligatoire et une seconde nationalité ne peut pas dupliquer la première', () => {
  const draft = createPlayerCreationDraft({ firstname:'Elias', lastname:'Morel', faceId:'face-01', height:168, weight:56, position:'MC', primaryNationality:'France', secondaryNationality:'France', raisedInContinent:'Europe' });
  const validation = validatePlayerCreationDraft(draft);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.preferredFoot, 'Pied fort requis.');
  assert.equal(validation.errors.secondaryNationality, 'La seconde nationalité doit être différente.');
});

test('la création conserve directement le continent d’enfance', () => {
  const draft = createPlayerCreationDraft({ firstname:'Elias', lastname:'Morel', faceId:'face-01', height:168, weight:56, position:'MC', preferredFoot:'RIGHT', primaryNationality:'France', secondaryNationality:'Mali', raisedInContinent:'Afrique' });
  const identity = toCareerCreationIdentity(draft);
  assert.equal(identity.age, 14);
  assert.equal(identity.origin, null);
  assert.equal(identity.youthClub, null);
  assert.equal(identity.heartClub, null);
  assert.equal(identity.secondaryNationality, 'Mali');
  assert.equal(identity.raisedInCountry, null);
  assert.equal(identity.raisedInContinent, 'Afrique');
});

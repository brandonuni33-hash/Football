import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATION_SCREENS,
  PREFERRED_FEET,
  VERTICAL_SLICE_START_AGE,
  VERTICAL_SLICE_BODY_LIMITS,
  createPlayerCreationDraft,
  validatePlayerCreationDraft,
  toCareerCreationIdentity
} from '../../../ui/verticalSlice/playerCreationDraft.js';

test('la création garde six écrans et regroupe poste + pied fort', () => {
  assert.deepEqual(CREATION_SCREENS, [
    'identity',
    'appearance',
    'body',
    'positionAndFoot',
    'nationalities',
    'childhoodCountry'
  ]);
  assert.deepEqual(PREFERRED_FEET, ['RIGHT', 'LEFT']);
});

test('le joueur commence à 14 ans et grandit en France dans la slice', () => {
  const draft = createPlayerCreationDraft();
  assert.equal(draft.age, VERTICAL_SLICE_START_AGE);
  assert.equal(draft.age, 14);
  assert.equal(draft.raisedInCountry, 'France');
});

test('le gabarit de création reste borné pour un joueur de 14 ans', () => {
  assert.deepEqual(VERTICAL_SLICE_BODY_LIMITS.height, { min: 145, max: 180 });
  assert.deepEqual(VERTICAL_SLICE_BODY_LIMITS.weight, { min: 38, max: 70 });

  const draft = createPlayerCreationDraft({
    firstname: 'Elias', lastname: 'Morel', faceId: 'face-01',
    height: 181, weight: 71, position: 'MC', preferredFoot: 'RIGHT',
    primaryNationality: 'France'
  });
  const validation = validatePlayerCreationDraft(draft);

  assert.equal(validation.valid, false);
  assert.equal(validation.errors.height, 'Taille invalide.');
  assert.equal(validation.errors.weight, 'Poids invalide.');
});

test('le pied fort est obligatoire et une seconde nationalité ne peut pas dupliquer la première', () => {
  const draft = createPlayerCreationDraft({
    firstname: 'Elias', lastname: 'Morel', faceId: 'face-01',
    height: 168, weight: 56, position: 'MC',
    primaryNationality: 'France', secondaryNationality: 'France'
  });

  const validation = validatePlayerCreationDraft(draft);
  assert.equal(validation.valid, false);
  assert.equal(validation.errors.preferredFoot, 'Pied fort requis.');
  assert.equal(validation.errors.secondaryNationality, 'La seconde nationalité doit être différente.');
});

test('la création ne choisit ni origine ni club', () => {
  const draft = createPlayerCreationDraft({
    firstname: 'Elias', lastname: 'Morel', faceId: 'face-01',
    height: 168, weight: 56, position: 'MC', preferredFoot: 'RIGHT',
    primaryNationality: 'France', secondaryNationality: 'Mali', raisedInCountry: 'France'
  });

  const identity = toCareerCreationIdentity(draft);
  assert.equal(identity.age, 14);
  assert.equal(identity.origin, null);
  assert.equal(identity.youthClub, null);
  assert.equal(identity.heartClub, null);
  assert.equal(identity.secondaryNationality, 'Mali');
  assert.equal(identity.raisedInContinent, 'Europe');
});

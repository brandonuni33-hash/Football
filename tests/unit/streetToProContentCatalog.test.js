import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_FAMILIES,
  STREET_TO_PRO_CONTENT,
  CONTENT_BY_FAMILY,
} from '../../domain/content/streetToProContentCatalog.js';
import { getEligibleContent, isContentEntryEligible } from '../../domain/content/contentEligibility.js';

test('CONTENT catalogue covers the six agreed content families', () => {
  const families = new Set(STREET_TO_PRO_CONTENT.map((entry) => entry.family));
  assert.deepEqual(families, new Set(Object.values(CONTENT_FAMILIES)));
  for (const family of Object.values(CONTENT_FAMILIES)) {
    assert.ok(CONTENT_BY_FAMILY[family].length > 0, `${family} must not be empty`);
  }
});

test('CONTENT ids are unique and entries carry reusable eligibility metadata', () => {
  const ids = STREET_TO_PRO_CONTENT.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of STREET_TO_PRO_CONTENT) {
    assert.ok(entry.id);
    assert.ok(entry.family);
    assert.ok(Number.isInteger(entry.minAge));
    assert.ok(Number.isInteger(entry.maxAge));
    assert.ok(Array.isArray(entry.contexts));
    assert.ok(Array.isArray(entry.requiredFacts));
    assert.ok(Array.isArray(entry.tags));
  }
});

test('the prepared inner-voice lines are present verbatim', () => {
  const texts = new Set(CONTENT_BY_FAMILY[CONTENT_FAMILIES.INNER_VOICE].map((entry) => entry.text));
  assert.ok(texts.has("J'ai dit que ça allait. Mais je sais très bien que j'ai raté mon match."));
  assert.ok(texts.has("Le coach n'a même pas regardé dans ma direction quand il a annoncé le onze."));
  assert.ok(texts.has("Deux buts et tout le monde me parle différemment. C'est bizarre comme ça va vite."));
  assert.ok(texts.has("Papa dit que je dois être patient. Facile à dire quand c'est pas toi qui regardes les autres jouer."));
  assert.ok(texts.has("J'ai vu mon nom passer sur leur compte. J'ai fait semblant de m'en foutre. J'ai regardé quatre fois."));
  assert.ok(texts.has("Je commence à comprendre un truc : être bon ne suffit pas toujours."));
});

test('age and career-stage gates prevent pro copy from leaking into a U15 academy context', () => {
  const proPressure = STREET_TO_PRO_CONTENT.find((entry) => entry.id === 'inner_media_pressure_pro');
  assert.equal(isContentEntryEligible(proPressure, {
    age: 15,
    careerStage: 'academy',
    contexts: ['media'],
    facts: ['firstProAppearance'],
  }), false);

  const youthTraining = STREET_TO_PRO_CONTENT.find((entry) => entry.id === 'inner_youth_first_team_training');
  assert.equal(isContentEntryEligible(youthTraining, {
    age: 16,
    careerStage: 'academy',
    contexts: ['training'],
    facts: ['firstTeamTraining'],
    emotionalStates: ['nervous'],
  }), true);
});

test('fact gates prevent public or landmark copy from inventing career history', () => {
  const socialMention = STREET_TO_PRO_CONTENT.find((entry) => entry.id === 'inner_social_post_reread');
  assert.equal(isContentEntryEligible(socialMention, { age: 15, contexts: ['social'], facts: [] }), false);
  assert.equal(isContentEntryEligible(socialMention, { age: 15, contexts: ['social'], facts: ['publicMention'] }), true);

  const firstContract = STREET_TO_PRO_CONTENT.find((entry) => entry.id === 'landmark_first_pro_contract');
  assert.equal(isContentEntryEligible(firstContract, { age: 17, contexts: ['contract'], facts: [] }), false);
  assert.equal(isContentEntryEligible(firstContract, { age: 17, contexts: ['contract'], facts: ['firstProfessionalContract'] }), true);
});

test('coach dialogue can be filtered by relationship band without changing coach mechanics', () => {
  const trusted = getEligibleContent(CONTENT_BY_FAMILY[CONTENT_FAMILIES.DIALOGUE], {
    age: 16,
    careerStage: 'academy',
    contexts: ['coach', 'development'],
    relationBand: 'trusted',
  });
  assert.ok(trusted.some((entry) => entry.id === 'dialogue_formative_coach_patience'));

  const tense = getEligibleContent(CONTENT_BY_FAMILY[CONTENT_FAMILIES.DIALOGUE], {
    age: 16,
    careerStage: 'academy',
    contexts: ['coach', 'development'],
    relationBand: 'tense',
  });
  assert.ok(!tense.some((entry) => entry.id === 'dialogue_formative_coach_patience'));
});

test('match decision entries expose player-facing choices but no hidden numeric bonuses', () => {
  for (const entry of CONTENT_BY_FAMILY[CONTENT_FAMILIES.MATCH_DECISION]) {
    assert.ok(entry.prompt);
    assert.ok(entry.choices.length >= 2);
    const serialized = JSON.stringify(entry);
    assert.doesNotMatch(serialized, /bonus|modifier|probability|chance/i);
  }
});

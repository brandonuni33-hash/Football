import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_AVATAR_APPEARANCE,
  createAvatarSignature,
  normalizeAgeAppearance,
  normalizeAvatarAppearance,
  resolveAgeStage,
} from "../../prototype/avatar-v0/avatarModel.js";
import { getAgeRenderRules } from "../../prototype/avatar-v0/ageRenderRules.js";
import { createPlayerIdentitySignature } from "../../prototype/avatar-v0/playerVisualIdentity.js";
import {
  REFERENCE_AGES,
  STP_REFERENCE_CAST,
  createReferenceSpriteSeed,
  getReferenceAgeCheckpoint,
  getReferencePlayer,
} from "../../prototype/avatar-v0/referenceCast.js";
import { createSprite2DProfile } from "../../prototype/avatar-v0/sprite2dProfile.js";

test("normalizeAvatarAppearance keeps valid values", () => {
  const result = normalizeAvatarAppearance({
    skinTone: "dark-01",
    hairStyle: "dreads-short",
    hairColor: "blond",
    facialHair: "goatee",
    headAccessory: "black-band",
    bodyType: "powerful",
    sleeves: "long",
    boots: "red",
    number: 99,
  });

  assert.deepEqual(result, {
    skinTone: "dark-01",
    hairStyle: "dreads-short",
    hairColor: "blond",
    facialHair: "goatee",
    headAccessory: "black-band",
    bodyType: "powerful",
    sleeves: "long",
    boots: "red",
    number: 99,
  });
});

test("normalizeAvatarAppearance rejects unsupported cosmetic ids", () => {
  const result = normalizeAvatarAppearance({
    skinTone: "unknown",
    hairStyle: "not-a-style",
    boots: "gold-pay-to-win",
  });

  assert.equal(result.skinTone, DEFAULT_AVATAR_APPEARANCE.skinTone);
  assert.equal(result.hairStyle, DEFAULT_AVATAR_APPEARANCE.hairStyle);
  assert.equal(result.boots, DEFAULT_AVATAR_APPEARANCE.boots);
});

test("normalizeAvatarAppearance clamps shirt numbers between 1 and 99", () => {
  assert.equal(normalizeAvatarAppearance({ number: 0 }).number, 1);
  assert.equal(normalizeAvatarAppearance({ number: 120 }).number, 99);
  assert.equal(normalizeAvatarAppearance({ number: "10" }).number, 10);
});

test("createAvatarSignature is deterministic and appearance-sensitive", () => {
  const first = createAvatarSignature({ skinTone: "light-01", hairStyle: "buzz", number: 9 });
  const same = createAvatarSignature({ skinTone: "light-01", hairStyle: "buzz", number: 9 });
  const different = createAvatarSignature({ skinTone: "dark-01", hairStyle: "buzz", number: 9 });

  assert.equal(first, same);
  assert.notEqual(first, different);
});

test("age is clamped and derives the correct visual stage", () => {
  assert.deepEqual(normalizeAgeAppearance({ age: 12 }), { age: 14, stage: "academy" });
  assert.deepEqual(normalizeAgeAppearance({ age: 46 }), { age: 45, stage: "veteran" });
  assert.equal(resolveAgeStage(16).id, "academy");
  assert.equal(resolveAgeStage(17).id, "young");
  assert.equal(resolveAgeStage(21).id, "prime");
  assert.equal(resolveAgeStage(28).id, "experienced");
  assert.equal(resolveAgeStage(34).id, "veteran");
});

test("age stages expose production rendering rules", () => {
  assert.equal(getAgeRenderRules("academy").spriteScale, 0.94);
  assert.equal(getAgeRenderRules("prime").spriteScale, 1);
  assert.ok(getAgeRenderRules("veteran").expressionLines > getAgeRenderRules("prime").expressionLines);
});

test("reference cast contains the three locked STP identities", () => {
  assert.deepEqual(Object.keys(STP_REFERENCE_CAST), ["elias", "malik", "nao"]);
  assert.equal(getReferencePlayer("elias").name, "Elias Morel");
  assert.equal(getReferencePlayer("malik").name, "Malik Sissoko");
  assert.equal(getReferencePlayer("nao").name, "Nao Ferreira");
});

test("each reference player exposes the five production age checkpoints", () => {
  for (const player of Object.values(STP_REFERENCE_CAST)) {
    assert.deepEqual(player.ageCheckpoints.map((checkpoint) => checkpoint.age), REFERENCE_AGES);
    assert.deepEqual(player.ageCheckpoints.map((checkpoint) => checkpoint.stage), [
      "academy",
      "young",
      "prime",
      "experienced",
      "veteran",
    ]);
  }
});

test("reference age lookup returns only locked production checkpoints", () => {
  assert.deepEqual(getReferenceAgeCheckpoint("elias", 15), { age: 15, stage: "academy" });
  assert.deepEqual(getReferenceAgeCheckpoint("malik", 24), { age: 24, stage: "prime" });
  assert.deepEqual(getReferenceAgeCheckpoint("nao", 35), { age: 35, stage: "veteran" });
  assert.equal(getReferenceAgeCheckpoint("elias", 22), null);
  assert.equal(getReferenceAgeCheckpoint("unknown", 24), null);
});

test("the three reference identities remain structurally distinct", () => {
  const signatures = Object.values(STP_REFERENCE_CAST).map((player) =>
    createPlayerIdentitySignature(player.appearance, player.identity),
  );

  assert.equal(new Set(signatures).size, 3);
});

test("each reference player carries sprite-readable identity markers", () => {
  assert.ok(STP_REFERENCE_CAST.elias.spriteMarkers.includes("cheveux-noirs-courts"));
  assert.ok(STP_REFERENCE_CAST.malik.spriteMarkers.includes("bandeau-noir"));
  assert.ok(STP_REFERENCE_CAST.nao.spriteMarkers.includes("cheveux-mi-longs-cuivres"));

  for (const player of Object.values(STP_REFERENCE_CAST)) {
    assert.ok(player.spriteMarkers.length >= 4);
  }
});

test("sprite seeds inherit the locked portrait identity at every age", () => {
  const elias15 = createReferenceSpriteSeed("elias", 15);
  const malik24 = createReferenceSpriteSeed("malik", 24);
  const nao35 = createReferenceSpriteSeed("nao", 35);

  assert.equal(elias15.hairColor, "black");
  assert.equal(elias15.spriteScale, 0.94);
  assert.equal(malik24.headAccessory, "black-band");
  assert.equal(malik24.spriteScale, 1);
  assert.equal(nao35.hairColor, "copper");
  assert.equal(nao35.spriteScale, 0.99);
  assert.equal(createReferenceSpriteSeed("unknown", 24), null);
});

test("derived 2D profiles preserve each locked player's field-readable identity", () => {
  const elias = createSprite2DProfile("elias", 24);
  const malik = createSprite2DProfile("malik", 24);
  const nao = createSprite2DProfile("nao", 24);

  assert.equal(elias.number, 8);
  assert.equal(elias.hairStyle, "waves");
  assert.equal(malik.number, 9);
  assert.equal(malik.headAccessory, "black-band");
  assert.equal(nao.number, 11);
  assert.equal(nao.hairColor, "copper");
  assert.equal(createSprite2DProfile("unknown", 24), null);
});

test("derived 2D profile changes age scale without changing locked cosmetics", () => {
  const academy = createSprite2DProfile("malik", 15);
  const prime = createSprite2DProfile("malik", 24);
  const veteran = createSprite2DProfile("malik", 35);

  assert.ok(academy.bodyScale < prime.bodyScale);
  assert.ok(veteran.bodyScale < prime.bodyScale);
  assert.equal(academy.hairStyle, prime.hairStyle);
  assert.equal(veteran.headAccessory, prime.headAccessory);
  assert.equal(veteran.number, prime.number);
});

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

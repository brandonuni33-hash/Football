import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_AVATAR_APPEARANCE,
  createAvatarSignature,
  normalizeAvatarAppearance,
} from "../../prototype/avatar-v0/avatarModel.js";

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

test("createAvatarSignature is deterministic and identity-sensitive", () => {
  const first = createAvatarSignature({ skinTone: "light-01", hairStyle: "buzz", number: 9 });
  const same = createAvatarSignature({ skinTone: "light-01", hairStyle: "buzz", number: 9 });
  const different = createAvatarSignature({ skinTone: "dark-01", hairStyle: "buzz", number: 9 });

  assert.equal(first, same);
  assert.notEqual(first, different);
});

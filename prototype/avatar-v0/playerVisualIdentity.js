import {
  createAvatarSignature,
  normalizeAgeAppearance,
  normalizeAvatarAppearance,
} from "./avatarModel.js";

const freeze = Object.freeze;

export const VISUAL_IDENTITY_OPTIONS = freeze({
  faceShape: freeze([
    freeze({ id: "soft", label: "Doux" }),
    freeze({ id: "balanced", label: "Équilibré" }),
    freeze({ id: "angular", label: "Anguleux" }),
  ]),
  eyeColor: freeze([
    freeze({ id: "dark-brown", label: "Marron foncé", color: "#3b241b" }),
    freeze({ id: "brown", label: "Marron", color: "#70452f" }),
    freeze({ id: "hazel", label: "Noisette", color: "#8c713b" }),
    freeze({ id: "blue", label: "Bleu", color: "#5f83a6" }),
  ]),
});

export const DEFAULT_VISUAL_IDENTITY = freeze({
  faceShape: "balanced",
  eyeColor: "dark-brown",
});

const validIds = Object.fromEntries(
  Object.entries(VISUAL_IDENTITY_OPTIONS).map(([key, values]) => [key, new Set(values.map((value) => value.id))]),
);

export function normalizeVisualIdentity(input = {}) {
  const normalized = { ...DEFAULT_VISUAL_IDENTITY };
  for (const key of Object.keys(VISUAL_IDENTITY_OPTIONS)) {
    if (validIds[key].has(input[key])) normalized[key] = input[key];
  }
  return normalized;
}

// L'identité permanente reste stable quand les cosmétiques ou le numéro changent.
// La teinte de peau est encore stockée dans appearance en V0, mais elle est traitée
// ici comme un ancrage identitaire et ne doit pas être modifiée par le vieillissement.
export function createPlayerIdentitySignature(appearanceInput = {}, identityInput = {}) {
  const appearance = normalizeAvatarAppearance(appearanceInput);
  const identity = normalizeVisualIdentity(identityInput);
  return [
    `skinTone:${appearance.skinTone}`,
    `faceShape:${identity.faceShape}`,
    `eyeColor:${identity.eyeColor}`,
  ].join("|");
}

export function createCurrentLookSignature(appearanceInput = {}) {
  return createAvatarSignature(appearanceInput);
}

export function createVisualPresentationSignature(
  appearanceInput = {},
  identityInput = {},
  ageInput = {},
) {
  const ageAppearance = normalizeAgeAppearance(ageInput);
  return [
    createPlayerIdentitySignature(appearanceInput, identityInput),
    `look:${createCurrentLookSignature(appearanceInput)}`,
    `age:${ageAppearance.age}`,
    `stage:${ageAppearance.stage}`,
  ].join("|");
}

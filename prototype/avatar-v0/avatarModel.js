const freeze = Object.freeze;

export const AVATAR_OPTIONS = freeze({
  skinTone: freeze([
    freeze({ id: "light-01", label: "Clair", color: "#f1c7a5" }),
    freeze({ id: "medium-01", label: "Mat", color: "#c9875f" }),
    freeze({ id: "brown-01", label: "Brun", color: "#8a573e" }),
    freeze({ id: "dark-01", label: "Foncé", color: "#4e3128" }),
  ]),
  hairStyle: freeze([
    freeze({ id: "buzz", label: "Très court" }),
    freeze({ id: "waves", label: "Waves" }),
    freeze({ id: "curly-top", label: "Boucles hautes" }),
    freeze({ id: "dreads-short", label: "Dreads courtes" }),
    freeze({ id: "braids", label: "Tresses" }),
    freeze({ id: "medium-straight", label: "Mi-longs" }),
  ]),
  hairColor: freeze([
    freeze({ id: "black", label: "Noir", color: "#151515" }),
    freeze({ id: "dark-brown", label: "Brun", color: "#4a2e25" }),
    freeze({ id: "blond", label: "Blond", color: "#d5b36b" }),
    freeze({ id: "platinum", label: "Platine", color: "#e8e2d4" }),
    freeze({ id: "copper", label: "Cuivré", color: "#a95432" }),
  ]),
  facialHair: freeze([
    freeze({ id: "none", label: "Aucune" }),
    freeze({ id: "stubble", label: "Barbe légère" }),
    freeze({ id: "goatee", label: "Bouc" }),
  ]),
  headAccessory: freeze([
    freeze({ id: "none", label: "Aucun", color: "transparent" }),
    freeze({ id: "black-band", label: "Bandeau noir", color: "#151515" }),
    freeze({ id: "white-band", label: "Bandeau blanc", color: "#f4f4f4" }),
    freeze({ id: "red-band", label: "Bandeau rouge", color: "#b73535" }),
  ]),
  bodyType: freeze([
    freeze({ id: "lean", label: "Fin", scale: 0.9 }),
    freeze({ id: "athletic", label: "Athlétique", scale: 1 }),
    freeze({ id: "powerful", label: "Puissant", scale: 1.1 }),
  ]),
  sleeves: freeze([
    freeze({ id: "short", label: "Manches courtes" }),
    freeze({ id: "long", label: "Manches longues" }),
  ]),
  boots: freeze([
    freeze({ id: "black", label: "Noires", color: "#171717" }),
    freeze({ id: "white", label: "Blanches", color: "#efefef" }),
    freeze({ id: "red", label: "Rouges", color: "#c73838" }),
    freeze({ id: "blue", label: "Bleues", color: "#315bb4" }),
  ]),
});

export const DEFAULT_AVATAR_APPEARANCE = freeze({
  skinTone: "medium-01",
  hairStyle: "waves",
  hairColor: "black",
  facialHair: "none",
  headAccessory: "none",
  bodyType: "athletic",
  sleeves: "short",
  boots: "black",
  number: 9,
});

export const AGE_STAGES = freeze([
  freeze({ id: "academy", label: "Adolescent", minAge: 14, maxAge: 16 }),
  freeze({ id: "young", label: "Jeune joueur", minAge: 17, maxAge: 20 }),
  freeze({ id: "prime", label: "Pleine maturité", minAge: 21, maxAge: 27 }),
  freeze({ id: "experienced", label: "Joueur expérimenté", minAge: 28, maxAge: 33 }),
  freeze({ id: "veteran", label: "Vétéran", minAge: 34, maxAge: 45 }),
]);

export const DEFAULT_AGE_APPEARANCE = freeze({ age: 15, stage: "academy" });

const validIds = Object.fromEntries(
  Object.entries(AVATAR_OPTIONS).map(([key, values]) => [key, new Set(values.map((value) => value.id))]),
);

export function normalizeAvatarAppearance(input = {}) {
  const normalized = { ...DEFAULT_AVATAR_APPEARANCE };

  for (const key of Object.keys(AVATAR_OPTIONS)) {
    if (validIds[key].has(input[key])) normalized[key] = input[key];
  }

  const parsedNumber = Number.parseInt(input.number, 10);
  if (Number.isFinite(parsedNumber)) normalized.number = Math.min(99, Math.max(1, parsedNumber));

  return normalized;
}

export function normalizeAgeAppearance(input = {}) {
  const parsedAge = Number.parseInt(input.age, 10);
  const age = Number.isFinite(parsedAge) ? Math.min(45, Math.max(14, parsedAge)) : DEFAULT_AGE_APPEARANCE.age;
  const stage = resolveAgeStage(age);
  return { age, stage: stage.id };
}

export function resolveAgeStage(age) {
  const parsedAge = Number.parseInt(age, 10);
  const safeAge = Number.isFinite(parsedAge) ? Math.min(45, Math.max(14, parsedAge)) : DEFAULT_AGE_APPEARANCE.age;
  return AGE_STAGES.find((stage) => safeAge >= stage.minAge && safeAge <= stage.maxAge) ?? AGE_STAGES.at(-1);
}

export function getAvatarOption(group, id) {
  const options = AVATAR_OPTIONS[group] ?? [];
  return options.find((option) => option.id === id) ?? options[0] ?? null;
}

export function createAvatarSignature(input = {}) {
  const appearance = normalizeAvatarAppearance(input);
  return [
    appearance.skinTone,
    appearance.hairStyle,
    appearance.hairColor,
    appearance.facialHair,
    appearance.headAccessory,
    appearance.bodyType,
    appearance.sleeves,
    appearance.boots,
    `n${appearance.number}`,
  ].join("|");
}

export function createAvatarPresentationSignature(appearanceInput = {}, ageInput = {}) {
  const ageAppearance = normalizeAgeAppearance(ageInput);
  return `${createAvatarSignature(appearanceInput)}|age-${ageAppearance.age}|stage-${ageAppearance.stage}`;
}

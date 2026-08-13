import { getAgeRenderRules } from "./ageRenderRules.js";
import { normalizeAgeAppearance, normalizeAvatarAppearance } from "./avatarModel.js";
import { normalizeVisualIdentity } from "./playerVisualIdentity.js";

const freeze = Object.freeze;

export const REFERENCE_AGES = freeze([15, 18, 24, 30, 35]);

function createReferencePlayer(definition) {
  const appearance = freeze(normalizeAvatarAppearance(definition.appearance));
  const identity = freeze(normalizeVisualIdentity(definition.identity));
  const ageCheckpoints = freeze(
    REFERENCE_AGES.map((age) => freeze(normalizeAgeAppearance({ age }))),
  );

  return freeze({
    ...definition,
    appearance,
    identity,
    ageCheckpoints,
    spriteMarkers: freeze([...definition.spriteMarkers]),
  });
}

export const STP_REFERENCE_CAST = freeze({
  elias: createReferencePlayer({
    id: "elias",
    name: "Elias Morel",
    referenceAge: 24,
    number: 8,
    role: "milieu-offensif",
    vibe: freeze(["discipline", "propre", "elegant"]),
    identity: {
      faceShape: "balanced",
      eyeColor: "brown",
    },
    appearance: {
      skinTone: "light-01",
      hairStyle: "waves",
      hairColor: "black",
      facialHair: "none",
      headAccessory: "none",
      bodyType: "athletic",
      sleeves: "short",
      boots: "white",
      number: 8,
    },
    spriteMarkers: [
      "peau-claire",
      "cheveux-noirs-courts",
      "silhouette-athletique",
      "numero-8",
    ],
  }),

  malik: createReferencePlayer({
    id: "malik",
    name: "Malik Sissoko",
    referenceAge: 24,
    number: 9,
    role: "avant-centre",
    vibe: freeze(["charismatique", "puissant", "competiteur"]),
    identity: {
      faceShape: "angular",
      eyeColor: "dark-brown",
    },
    appearance: {
      skinTone: "dark-01",
      hairStyle: "dreads-short",
      hairColor: "blond",
      facialHair: "goatee",
      headAccessory: "black-band",
      bodyType: "powerful",
      sleeves: "short",
      boots: "red",
      number: 9,
    },
    spriteMarkers: [
      "peau-foncee",
      "dreads-courtes-blondes",
      "bandeau-noir",
      "gabarit-puissant",
      "numero-9",
    ],
  }),

  nao: createReferencePlayer({
    id: "nao",
    name: "Nao Ferreira",
    referenceAge: 24,
    number: 11,
    role: "ailier-meneur",
    vibe: freeze(["creatif", "intuitif", "elegant"]),
    identity: {
      faceShape: "soft",
      eyeColor: "hazel",
    },
    appearance: {
      skinTone: "medium-01",
      hairStyle: "medium-straight",
      hairColor: "copper",
      facialHair: "none",
      headAccessory: "none",
      bodyType: "lean",
      sleeves: "short",
      boots: "black",
      number: 11,
    },
    spriteMarkers: [
      "peau-mate",
      "cheveux-mi-longs-cuivres",
      "silhouette-fine",
      "numero-11",
    ],
  }),
});

export function getReferencePlayer(id) {
  return STP_REFERENCE_CAST[id] ?? null;
}

export function getReferenceAgeCheckpoint(playerId, age) {
  const player = getReferencePlayer(playerId);
  if (!player) return null;
  const normalized = normalizeAgeAppearance({ age });
  return player.ageCheckpoints.find((checkpoint) => checkpoint.age === normalized.age) ?? null;
}

export function createReferenceSpriteSeed(playerId, age = 24) {
  const player = getReferencePlayer(playerId);
  if (!player) return null;

  const ageAppearance = normalizeAgeAppearance({ age });
  const ageRules = getAgeRenderRules(ageAppearance.stage);

  return freeze({
    playerId: player.id,
    age: ageAppearance.age,
    stage: ageAppearance.stage,
    skinTone: player.appearance.skinTone,
    hairStyle: player.appearance.hairStyle,
    hairColor: player.appearance.hairColor,
    headAccessory: player.appearance.headAccessory,
    bodyType: player.appearance.bodyType,
    sleeves: player.appearance.sleeves,
    boots: player.appearance.boots,
    number: player.appearance.number,
    spriteScale: ageRules.spriteScale,
    recognitionMarkers: freeze([...player.spriteMarkers]),
  });
}

import { getAvatarOption, normalizeAgeAppearance } from "./avatarModel.js";
import { getAgeRenderRules } from "./ageRenderRules.js";
import { getReferencePlayer } from "./referenceCast.js";

export function createSprite2DProfile(playerId, age = 24) {
  const player = getReferencePlayer(playerId);
  if (!player) return null;

  const ageAppearance = normalizeAgeAppearance({ age });
  const ageRules = getAgeRenderRules(ageAppearance.stage);
  const body = getAvatarOption("bodyType", player.appearance.bodyType);
  const skin = getAvatarOption("skinTone", player.appearance.skinTone);
  const hair = getAvatarOption("hairColor", player.appearance.hairColor);
  const accessory = getAvatarOption("headAccessory", player.appearance.headAccessory);
  const boots = getAvatarOption("boots", player.appearance.boots);

  return Object.freeze({
    playerId: player.id,
    name: player.name,
    age: ageAppearance.age,
    stage: ageAppearance.stage,
    number: player.appearance.number,
    skinTone: player.appearance.skinTone,
    skinColor: skin?.color ?? "#c9875f",
    hairStyle: player.appearance.hairStyle,
    hairColor: player.appearance.hairColor,
    hairCssColor: hair?.color ?? "#151515",
    headAccessory: player.appearance.headAccessory,
    accessoryColor: accessory?.color ?? "transparent",
    bodyType: player.appearance.bodyType,
    bodyScale: (body?.scale ?? 1) * ageRules.spriteScale,
    sleeves: player.appearance.sleeves,
    boots: player.appearance.boots,
    bootsColor: boots?.color ?? "#171717",
    spriteMarkers: player.spriteMarkers,
  });
}

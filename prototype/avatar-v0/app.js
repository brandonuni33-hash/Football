import {
  AVATAR_OPTIONS,
  createAvatarSignature,
  getAvatarOption,
  normalizeAgeAppearance,
  normalizeAvatarAppearance,
} from "./avatarModel.js";
import { getAgeRenderRules } from "./ageRenderRules.js";
import { REFERENCE_AGES, STP_REFERENCE_CAST } from "./referenceCast.js";
import { createSprite2DProfile } from "./sprite2dProfile.js";

const initialPlayer = STP_REFERENCE_CAST.elias;

const state = {
  referencePlayerId: initialPlayer.id,
  age: initialPlayer.referenceAge,
  appearance: normalizeAvatarAppearance(initialPlayer.appearance),
};

const controls = document.querySelector("#avatar-controls");
const presetControls = document.querySelector("#preset-controls");
const ageControls = document.querySelector("#age-controls");
const signature = document.querySelector("#avatar-signature");
const jsonOutput = document.querySelector("#avatar-json");
const player = document.querySelector("#player-preview");
const spriteName = document.querySelector("#sprite-name");
const spriteAge = document.querySelector("#sprite-age");

const labels = {
  skinTone: "Teinte de peau",
  hairStyle: "Coiffure",
  hairColor: "Couleur de cheveux",
  facialHair: "Barbe",
  headAccessory: "Accessoire",
  bodyType: "Morphologie",
  sleeves: "Manches",
  boots: "Chaussures",
};

function buildControls() {
  for (const [group, options] of Object.entries(AVATAR_OPTIONS)) {
    const wrapper = document.createElement("label");
    wrapper.className = "control";
    wrapper.textContent = labels[group] ?? group;

    const select = document.createElement("select");
    select.dataset.group = group;

    for (const option of options) {
      const item = document.createElement("option");
      item.value = option.id;
      item.textContent = option.label;
      select.append(item);
    }

    select.value = state.appearance[group];
    select.addEventListener("change", () => {
      updateAppearance({ [group]: select.value });
    });

    wrapper.append(select);
    controls.append(wrapper);
  }

  const numberWrapper = document.createElement("label");
  numberWrapper.className = "control";
  numberWrapper.textContent = "Numéro";

  const numberInput = document.createElement("input");
  numberInput.type = "number";
  numberInput.min = "1";
  numberInput.max = "99";
  numberInput.value = String(state.appearance.number);
  numberInput.dataset.group = "number";
  numberInput.addEventListener("input", () => {
    updateAppearance({ number: numberInput.value });
  });

  numberWrapper.append(numberInput);
  controls.append(numberWrapper);
}

function buildPresets() {
  for (const referencePlayer of Object.values(STP_REFERENCE_CAST)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.referencePlayer = referencePlayer.id;
    button.textContent = referencePlayer.name;
    button.addEventListener("click", () => {
      state.referencePlayerId = referencePlayer.id;
      state.appearance = normalizeAvatarAppearance(referencePlayer.appearance);
      syncControls();
      render();
    });
    presetControls.append(button);
  }
}

function buildAgeControls() {
  for (const age of REFERENCE_AGES) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.referenceAge = String(age);
    button.textContent = `${age} ans`;
    button.addEventListener("click", () => {
      state.age = age;
      render();
    });
    ageControls.append(button);
  }
}

function syncControls() {
  document.querySelectorAll("[data-group]").forEach((control) => {
    control.value = String(state.appearance[control.dataset.group]);
  });
}

function syncActiveButtons() {
  document.querySelectorAll("[data-reference-player]").forEach((button) => {
    button.classList.toggle("active", button.dataset.referencePlayer === state.referencePlayerId);
  });

  document.querySelectorAll("[data-reference-age]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.referenceAge) === state.age);
  });
}

function updateAppearance(patch) {
  state.referencePlayerId = null;
  state.appearance = normalizeAvatarAppearance({ ...state.appearance, ...patch });
  syncControls();
  render();
}

function buildCustomSpriteProfile() {
  const appearance = state.appearance;
  const ageAppearance = normalizeAgeAppearance({ age: state.age });
  const ageRules = getAgeRenderRules(ageAppearance.stage);
  const skin = getAvatarOption("skinTone", appearance.skinTone);
  const hair = getAvatarOption("hairColor", appearance.hairColor);
  const accessory = getAvatarOption("headAccessory", appearance.headAccessory);
  const boots = getAvatarOption("boots", appearance.boots);
  const body = getAvatarOption("bodyType", appearance.bodyType);

  return {
    playerId: null,
    name: "Avatar personnalisé",
    age: ageAppearance.age,
    stage: ageAppearance.stage,
    number: appearance.number,
    skinColor: skin?.color ?? "#c9875f",
    hairStyle: appearance.hairStyle,
    hairCssColor: hair?.color ?? "#151515",
    headAccessory: appearance.headAccessory,
    accessoryColor: accessory?.color ?? "transparent",
    bodyType: appearance.bodyType,
    bodyScale: (body?.scale ?? 1) * ageRules.spriteScale,
    sleeves: appearance.sleeves,
    bootsColor: boots?.color ?? "#171717",
    spriteMarkers: [],
  };
}

function render() {
  const profile = state.referencePlayerId
    ? createSprite2DProfile(state.referencePlayerId, state.age)
    : buildCustomSpriteProfile();

  player.style.setProperty("--skin", profile.skinColor);
  player.style.setProperty("--hair", profile.hairCssColor);
  player.style.setProperty("--accessory", profile.accessoryColor);
  player.style.setProperty("--boots", profile.bootsColor);
  player.style.setProperty("--body-scale", String(profile.bodyScale));
  player.dataset.hair = profile.hairStyle;
  player.dataset.facialHair = state.appearance.facialHair;
  player.dataset.accessory = profile.headAccessory;
  player.dataset.sleeves = profile.sleeves;
  player.dataset.ageStage = profile.stage;
  player.querySelector(".shirt-number").textContent = profile.number;

  spriteName.textContent = profile.name;
  spriteAge.textContent = `${profile.age} ans · ${profile.stage}`;
  signature.textContent = createAvatarSignature(state.appearance);
  jsonOutput.textContent = JSON.stringify(profile, null, 2);

  syncActiveButtons();
}

buildControls();
buildPresets();
buildAgeControls();
syncControls();
render();

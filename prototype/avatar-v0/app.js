import {
  AVATAR_OPTIONS,
  DEFAULT_AVATAR_APPEARANCE,
  createAvatarSignature,
  getAvatarOption,
  normalizeAvatarAppearance,
} from "./avatarModel.js";

const state = {
  appearance: normalizeAvatarAppearance(DEFAULT_AVATAR_APPEARANCE),
};

const presets = [
  {
    label: "Profil A",
    appearance: {
      skinTone: "light-01",
      hairStyle: "medium-straight",
      hairColor: "dark-brown",
      facialHair: "none",
      headAccessory: "none",
      bodyType: "lean",
      sleeves: "short",
      boots: "white",
      number: 11,
    },
  },
  {
    label: "Profil B",
    appearance: {
      skinTone: "dark-01",
      hairStyle: "dreads-short",
      hairColor: "blond",
      facialHair: "goatee",
      headAccessory: "black-band",
      bodyType: "powerful",
      sleeves: "long",
      boots: "red",
      number: 9,
    },
  },
  {
    label: "Profil C",
    appearance: {
      skinTone: "medium-01",
      hairStyle: "braids",
      hairColor: "black",
      facialHair: "stubble",
      headAccessory: "white-band",
      bodyType: "athletic",
      sleeves: "short",
      boots: "blue",
      number: 10,
    },
  },
];

const controls = document.querySelector("#avatar-controls");
const presetControls = document.querySelector("#preset-controls");
const signature = document.querySelector("#avatar-signature");
const jsonOutput = document.querySelector("#avatar-json");
const player = document.querySelector("#player-preview");

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
  presets.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = preset.label;
    button.addEventListener("click", () => {
      state.appearance = normalizeAvatarAppearance(preset.appearance);
      syncControls();
      render();
    });
    presetControls.append(button);
  });
}

function syncControls() {
  document.querySelectorAll("[data-group]").forEach((control) => {
    control.value = String(state.appearance[control.dataset.group]);
  });
}

function updateAppearance(patch) {
  state.appearance = normalizeAvatarAppearance({ ...state.appearance, ...patch });
  syncControls();
  render();
}

function render() {
  const appearance = state.appearance;
  const skin = getAvatarOption("skinTone", appearance.skinTone);
  const hair = getAvatarOption("hairColor", appearance.hairColor);
  const accessory = getAvatarOption("headAccessory", appearance.headAccessory);
  const boots = getAvatarOption("boots", appearance.boots);
  const body = getAvatarOption("bodyType", appearance.bodyType);

  player.style.setProperty("--skin", skin.color);
  player.style.setProperty("--hair", hair.color);
  player.style.setProperty("--accessory", accessory.color);
  player.style.setProperty("--boots", boots.color);
  player.style.setProperty("--body-scale", String(body.scale));
  player.dataset.hair = appearance.hairStyle;
  player.dataset.facialHair = appearance.facialHair;
  player.dataset.accessory = appearance.headAccessory;
  player.dataset.sleeves = appearance.sleeves;
  player.querySelector(".shirt-number").textContent = appearance.number;

  signature.textContent = createAvatarSignature(appearance);
  jsonOutput.textContent = JSON.stringify(appearance, null, 2);
}

buildControls();
buildPresets();
render();

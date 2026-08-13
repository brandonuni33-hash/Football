import { createSprite2DProfile } from "../avatar-v0/sprite2dProfile.js";
import { DEFAULT_FEEL_TUNING } from "./football2dModel.js";
import { createInputController } from "./input.js";
import { renderFootball2D } from "./renderer.js";
import { createScenarioState, stepScenario } from "./scenarioModel.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const profile = createSprite2DProfile("elias", 24);
const STP_FEEL = Object.freeze({ playerSpeed: 100, ballControl: 100, shotPower: 109 });
let state = createScenarioState();
let previousTime = performance.now();
let tuning = { ...DEFAULT_FEEL_TUNING };

const input = createInputController({
  joystick: document.querySelector("#joystick"),
  stick: document.querySelector("#stick"),
  shoot: document.querySelector("#shoot"),
  powerFill: document.querySelector("#power-fill"),
});

const tuningControls = {
  playerSpeed: { input: document.querySelector("#speed-tuning"), output: document.querySelector("#speed-value") },
  ballControl: { input: document.querySelector("#control-tuning"), output: document.querySelector("#control-value") },
  shotPower: { input: document.querySelector("#shot-tuning"), output: document.querySelector("#shot-value") },
};

function applyStpFeel() {
  tuningControls.playerSpeed.input.value = String(STP_FEEL.playerSpeed);
  tuningControls.ballControl.input.value = String(STP_FEEL.ballControl);
  tuningControls.shotPower.input.value = String(STP_FEEL.shotPower);
}

function syncTuningFromUI() {
  tuning = {
    playerSpeed: Number(tuningControls.playerSpeed.input.value) / 100,
    ballControl: Number(tuningControls.ballControl.input.value) / 100,
    shotPower: Number(tuningControls.shotPower.input.value) / 100,
  };
  for (const control of Object.values(tuningControls)) control.output.textContent = `${control.input.value}%`;
}

for (const control of Object.values(tuningControls)) control.input.addEventListener("input", syncTuningFromUI);

document.querySelector("#feel-reset").addEventListener("click", () => {
  applyStpFeel();
  syncTuningFromUI();
});

document.querySelector("#player-name").textContent = `${profile.name} · ${profile.age} ans`;

document.querySelector("#reset").addEventListener("click", () => {
  const goals = state.goals;
  state = { ...createScenarioState(), goals };
  document.querySelector("#goal-flash").hidden = true;
});

function frame(now) {
  const controls = input.read();
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  if (state.status !== "goal") state = stepScenario(state, controls, dt, tuning);

  document.querySelector("#goal-count").textContent = String(state.goals);
  document.querySelector("#goal-flash").hidden = state.status !== "goal";
  renderFootball2D(ctx, state, profile, controls.charge);
  requestAnimationFrame(frame);
}

applyStpFeel();
syncTuningFromUI();
requestAnimationFrame(frame);

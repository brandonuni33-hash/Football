import { createSprite2DProfile } from "../avatar-v0/sprite2dProfile.js";
import { createInputController } from "./input.js";
import { renderFootball2D } from "./renderer.js";
import { createScenarioState, stepScenario } from "./scenarioModel.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const profile = createSprite2DProfile("elias", 24);
let state = createScenarioState();
let previousTime = performance.now();

const input = createInputController({
  joystick: document.querySelector("#joystick"),
  stick: document.querySelector("#stick"),
  shoot: document.querySelector("#shoot"),
  powerFill: document.querySelector("#power-fill"),
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

  if (state.status !== "goal") {
    state = stepScenario(state, controls, dt);
  }

  document.querySelector("#goal-count").textContent = String(state.goals);
  document.querySelector("#goal-flash").hidden = state.status !== "goal";
  renderFootball2D(ctx, state, profile, controls.charge);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

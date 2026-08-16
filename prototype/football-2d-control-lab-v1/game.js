import { createSprite2DProfile } from "../avatar-v0/sprite2dProfile.js";
import { DEFAULT_FEEL_TUNING } from "../football-2d-v0/football2dModel.js";
import { createControlLabInput } from "./input.js";
import { createControlLabState, stepControlLab } from "./controlLabModel.js";
import { renderControlLab } from "./renderer.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const profile = createSprite2DProfile("elias", 24);
const STP_FEEL = Object.freeze({ speed: 80, acceleration: 80, ballControl: 100, shotPower: 109 });
const tuning = Object.freeze({ ...DEFAULT_FEEL_TUNING, ballControl: 1, shotPower: 1.09 });
const athletic = Object.freeze({ speed: STP_FEEL.speed, acceleration: STP_FEEL.acceleration });

const passButton = document.querySelector("#pass");
const shootButton = document.querySelector("#shoot");
const protectButton = document.querySelector("#protect");
const controlMode = document.querySelector("#control-mode");
const actionMode = document.querySelector("#action-mode");

const input = createControlLabInput({
  moveJoystick: document.querySelector("#move-joystick"),
  moveStick: document.querySelector("#move-stick"),
  controlJoystick: document.querySelector("#control-joystick"),
  controlStick: document.querySelector("#control-stick"),
  shoot: shootButton,
  pass: passButton,
  protect: protectButton,
  powerFill: document.querySelector("#power-fill"),
});

let state = createControlLabState();
let previousTime = performance.now();
let actionUntil = 0;
let actionText = "—";

document.querySelector("#player-name").textContent = `${profile.name} · ${profile.age} ans`;

document.querySelector("#reset").addEventListener("click", () => {
  const goals = state.goals;
  state = { ...createControlLabState(), goals };
  document.querySelector("#goal-flash").hidden = true;
});

function pulseAction(text, now, duration = 280) {
  actionText = text;
  actionUntil = now + duration;
}

function frame(now) {
  const controls = input.read();
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  if (state.status !== "goal") state = stepControlLab(state, controls, dt, tuning, athletic);

  if (controls.passPressed) pulseAction("PASSE", now);
  else if (controls.shootReleased) pulseAction("TIR", now);
  else if (controls.burstTriggered) pulseAction("POUSSÉE", now, 420);

  if (controls.protecting) {
    actionText = "PROTECTION";
    actionUntil = now + 80;
  }

  if (now > actionUntil) actionText = "—";

  controlMode.textContent = (state.controlMode ?? "neutre").toUpperCase();
  actionMode.textContent = actionText;
  protectButton.classList.toggle("active", controls.protecting);
  passButton.classList.toggle("active", controls.passPressed);
  shootButton.classList.toggle("active", controls.charge > 0);
  document.querySelector("#goal-flash").hidden = state.status !== "goal";

  renderControlLab(ctx, state, profile, controls.charge);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

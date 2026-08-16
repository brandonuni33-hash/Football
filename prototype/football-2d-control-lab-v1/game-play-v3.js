import { createSprite2DProfile } from "../avatar-v0/sprite2dProfile.js";
import { DEFAULT_FEEL_TUNING } from "../football-2d-v0/football2dModel.js";
import { createControlLabInput } from "./input-v3.js";
import { createControlLabState, stepControlLab } from "./controlLabModel-v3.js";
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
let restartAt = 0;
let lastAction = null;

function resetAction() {
  const goals = state.goals;
  state = { ...createControlLabState(), goals };
  restartAt = 0;
}

document.querySelector("#player-name").textContent = `${profile.name} · ${profile.age} ans`;
document.querySelector("#reset").addEventListener("click", resetAction);

function pulseAction(text, now, duration = 420) {
  actionText = text;
  actionUntil = now + duration;
}

function labelAction(action) {
  if (action === "feinte") return state.lastFeintResult === "transfert_appui" ? "FEINTE · APPUI BOUGÉ" : "FEINTE · DÉF. RESTE";
  if (action === "appui") return "APPUI";
  if (action === "orientation_reception") return "ORIENTATION";
  if (action === "controle_reception_protege") return "CONTRÔLE PROT.";
  if (action === "controle_protege") return "ORIENTATION PROT.";
  if (action === "passe") return "PASSE";
  if (action === "tir") return "TIR";
  return null;
}

function frame(now) {
  const controls = input.read();
  const dt = Math.min(0.05, (now - previousTime) / 1000);
  previousTime = now;

  if (!restartAt && state.status !== "goal") state = stepControlLab(state, controls, dt, tuning, athletic);

  if (state.lastControlAction && state.lastControlAction !== lastAction) {
    const label = labelAction(state.lastControlAction);
    if (label) pulseAction(label, now);
    lastAction = state.lastControlAction;
  }
  if (!state.lastControlAction) lastAction = null;

  if (controls.burstTriggered && !state.protectionActive) pulseAction("POUSSÉE", now, 500);
  if (state.protectionActive) {
    actionText = `PROT. ${state.protectionRemaining.toFixed(1)}s`;
    actionUntil = now + 80;
  }
  if (now > actionUntil) actionText = "—";

  if (!restartAt && state.status === "goal") restartAt = now + 900;
  if (!restartAt && !state.possession && !state.incomingPassActive && (state.lastEvent === "tackle" || state.lastEvent === "save")) restartAt = now + 1100;
  if (restartAt && now >= restartAt) resetAction();

  controlMode.textContent = (state.controlMode ?? "vision").toUpperCase();
  actionMode.textContent = actionText;
  protectButton.classList.toggle("active", state.protectionActive);
  protectButton.classList.toggle("unavailable", !state.protectionAvailable && !state.protectionActive);
  if (state.protectionActive) protectButton.textContent = `${Math.max(0, state.protectionRemaining).toFixed(1)}s`;
  else if (state.protectionCooldown > 0) protectButton.textContent = `${Math.ceil(state.protectionCooldown)}s`;
  else protectButton.textContent = "PROT.";
  passButton.classList.toggle("active", controls.passPressed);
  shootButton.classList.toggle("active", controls.charge > 0);

  renderControlLab(ctx, state, profile, controls.charge);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

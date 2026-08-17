import { CAMERA_DEFAULTS } from "./eleven-v-eleven-camera-lab/constants.js";
import { createLabState, stepLabState } from "./eleven-v-eleven-camera-lab/state.js";
import { createCameraState, updateCamera } from "./eleven-v-eleven-camera-lab/camera.js";
import { createLabInput } from "./eleven-v-eleven-camera-lab/input.js";
import { renderLab } from "./eleven-v-eleven-camera-lab/renderer.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const settingsPanel = document.querySelector("#settings");
const zoomInput = document.querySelector("#zoom");
const angleInput = document.querySelector("#angle");
const scanInput = document.querySelector("#scan");
const zoomValue = document.querySelector("#zoom-value");
const angleValue = document.querySelector("#angle-value");
const scanValue = document.querySelector("#scan-value");

const input = createLabInput({
  moveRoot: document.querySelector("#move-joystick"),
  moveKnob: document.querySelector("#move-stick"),
  scanRoot: document.querySelector("#scan-joystick"),
  scanKnob: document.querySelector("#scan-stick"),
});

let state = createLabState();
let settings = readSettings();
let camera = createCameraState(state, settings);
let previous = performance.now();

function readSettings() {
  return {
    zoom: Number(zoomInput.value) / 100,
    angle: Number(angleInput.value),
    scan: Number(scanInput.value),
  };
}

function syncOutputs() {
  settings = readSettings();
  zoomValue.textContent = settings.zoom.toFixed(2);
  angleValue.textContent = String(settings.angle);
  scanValue.textContent = String(settings.scan);
}

function resetCameraSettings() {
  zoomInput.value = String(Math.round(CAMERA_DEFAULTS.zoom * 100));
  angleInput.value = String(CAMERA_DEFAULTS.angle);
  scanInput.value = String(CAMERA_DEFAULTS.scan);
  syncOutputs();
  camera = createCameraState(state, settings);
}

function frame(now) {
  const dt = Math.min(0.033, Math.max(0, (now - previous) / 1000));
  previous = now;
  const controls = input.read();
  stepLabState(state, controls, dt);
  updateCamera(camera, state, controls, settings, dt);
  renderLab(ctx, state, camera, settings);
  requestAnimationFrame(frame);
}

for (const control of [zoomInput, angleInput, scanInput]) control.addEventListener("input", syncOutputs);
document.querySelector("#reset-camera").addEventListener("click", resetCameraSettings);
document.querySelector("#toggle-settings").addEventListener("click", () => settingsPanel.classList.toggle("collapsed"));

syncOutputs();
requestAnimationFrame(frame);

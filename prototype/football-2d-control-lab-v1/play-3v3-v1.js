import { RULES } from "./three-v-three/constants.js";
import { actionLabels, createMatchState, controlledPlayerId, getHumanPlayer } from "./three-v-three/matchState.js";
import { stepMatch } from "./three-v-three/simulation.js";
import { createInput } from "./three-v-three/input.js";
import { consumeInputActions, mergeInputFrames } from "./three-v-three/inputBuffer.js";
import { render } from "./three-v-three/renderer.js";
import { canScanCamera, createCameraState, updateCamera } from "./three-v-three/camera.js";
import { createGuestTransport, createHostTransport, createRoomCode, invitationUrl, reconcileLocalPlayer, roomFromLocation } from "./three-v-three/network.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const menu = document.querySelector("#menu");
const game = document.querySelector("#game-screen");
const status = document.querySelector("#network-status");
const sharePanel = document.querySelector("#share-panel");
const shareUrl = document.querySelector("#share-url");
const aiLevelInput = document.querySelector("#ai-level");
const aiLevelValue = document.querySelector("#ai-level-value");
const hudAILevel = document.querySelector("#hud-ai-level");
const passSpeedInput = document.querySelector("#pass-speed-level");
const passSpeedValue = document.querySelector("#pass-speed-value");
const hudPassSpeed = document.querySelector("#hud-pass-speed");
const gameSpeedInput = document.querySelector("#game-speed-level");
const gameSpeedValue = document.querySelector("#game-speed-value");
const hudGameSpeed = document.querySelector("#hud-game-speed");
const elements = {
  moveRoot: document.querySelector("#move-joystick"), moveKnob: document.querySelector("#move-stick"),
  controlRoot: document.querySelector("#control-joystick"), controlKnob: document.querySelector("#control-stick"),
  primary: document.querySelector("#primary"), secondary: document.querySelector("#secondary"), tertiary: document.querySelector("#tertiary"),
  rapid: document.querySelector("#rapid"),
};
const input = createInput(elements);
let state = createMatchState();
let slot = "host";
let mode = "solo";
let transport = null;
let guestInput = {};
let pendingLocalInput = {};
let running = false;
let accumulator = 0;
let previous = performance.now();
let lastSnapshotAt = 0;
let camera = createCameraState(state, slot);

function clone(value) { return structuredClone(value); }
function selectedAILevel() { return Number(aiLevelInput.value); }
function selectedPassSpeed() { return Number(passSpeedInput.value); }
function selectedGameSpeed() { return Number(gameSpeedInput.value); }
function setStatus(text, kind = "") { status.textContent = text; status.dataset.kind = kind; }
function resetCamera() { camera = createCameraState(state, slot); elements.controlRoot.classList.remove("scanning"); }
function updateLabels() {
  const labels = actionLabels(state, controlledPlayerId(slot));
  hudAILevel.textContent = String(state.aiLevel ?? selectedAILevel());
  hudPassSpeed.textContent = String(state.passSpeedLevel ?? selectedPassSpeed());
  hudGameSpeed.textContent = String(state.gameSpeedLevel ?? selectedGameSpeed());
  elements.primary.textContent = labels.primary;
  elements.secondary.textContent = labels.secondary;
  elements.tertiary.textContent = labels.tertiary;
  elements.tertiary.classList.toggle("protecting", getHumanPlayer(state, slot)?.protectionRemaining > 0);
  elements.secondary.classList.toggle("braking", (getHumanPlayer(state, slot)?.defensiveBrakeRemaining ?? 0) > 0);
  elements.controlRoot.dataset.mode = canScanCamera(state, slot) ? "scan" : "tech";
}
function showGame() { menu.hidden = true; game.hidden = false; running = true; accumulator = 0; previous = performance.now(); resetCamera(); requestAnimationFrame(frame); }

async function hostFriend() {
  mode = "online-host"; slot = "host"; state = createMatchState({ online: true, aiLevel: selectedAILevel(), passSpeedLevel: selectedPassSpeed(), gameSpeedLevel: selectedGameSpeed() });
  const room = createRoomCode();
  const url = invitationUrl(location, room);
  shareUrl.value = url; sharePanel.hidden = false; setStatus(`${room} · EN ATTENTE · 1/2`);
  showGame();
  try {
    transport = await createHostTransport(room, {
      onReady: () => setStatus(`${room} · CONNECTÉ · 2/2`, "ready"),
      onInput: (next) => { guestInput = mergeInputFrames(guestInput, next); },
      onDisconnect: () => setStatus("AMI DÉCONNECTÉ", "error"),
      onError: () => setStatus("CONNEXION IMPOSSIBLE", "error"),
    });
  } catch { setStatus("SERVICE DE ROOM INDISPONIBLE", "error"); }
}

async function joinFriend(room) {
  mode = "online-guest"; slot = "guest"; state = createMatchState({ online: true }); setStatus(`${room} · CONNEXION…`); showGame();
  try {
    transport = await createGuestTransport(room, {
      onReady: () => setStatus(`${room} · CONNECTÉ · 2/2`, "ready"),
      onSnapshot: (snapshot) => { state = reconcileLocalPlayer(snapshot, state, controlledPlayerId(slot)); },
      onDisconnect: () => setStatus("HÔTE DÉCONNECTÉ", "error"),
      onError: (error) => setStatus(error.message === "room-full" ? "ROOM COMPLÈTE" : "ROOM INTROUVABLE", "error"),
    });
  } catch { setStatus("SERVICE DE ROOM INDISPONIBLE", "error"); }
}

function frame(now) {
  if (!running) return;
  const elapsed = Math.min(0.1, (now - previous) / 1000); previous = now; accumulator = Math.min(accumulator + elapsed, RULES.fixedStep * 3);
  pendingLocalInput = mergeInputFrames(pendingLocalInput, input.read());
  let localInput = pendingLocalInput;
  if (mode === "online-guest") {
    transport?.sendInput(localInput);
    const predicted = clone(state);
    stepMatch(predicted, { guest: localInput }, Math.min(elapsed, 0.033));
    const current = state.players.find((player) => player.id === controlledPlayerId(slot));
    const prediction = predicted.players.find((player) => player.id === controlledPlayerId(slot));
    if (current && prediction) Object.assign(current, prediction);
    pendingLocalInput = consumeInputActions(pendingLocalInput);
  } else {
    while (accumulator >= RULES.fixedStep) {
      state = stepMatch(state, { host: localInput, guest: mode === "online-host" ? guestInput : undefined }, RULES.fixedStep);
      pendingLocalInput = consumeInputActions(pendingLocalInput);
      guestInput = consumeInputActions(guestInput);
      localInput = pendingLocalInput;
      accumulator -= RULES.fixedStep;
    }
    if (mode === "online-host" && now - lastSnapshotAt >= 50) { transport?.sendSnapshot(clone(state)); lastSnapshotAt = now; }
  }
  updateCamera(camera, state, slot, localInput, elapsed);
  elements.controlRoot.classList.toggle("scanning", camera.scanActive);
  updateLabels(); render(ctx, state, slot, camera); requestAnimationFrame(frame);
}

aiLevelInput.addEventListener("input", () => { aiLevelValue.textContent = aiLevelInput.value; hudAILevel.textContent = aiLevelInput.value; });
passSpeedInput.addEventListener("input", () => { passSpeedValue.textContent = passSpeedInput.value; hudPassSpeed.textContent = passSpeedInput.value; });
gameSpeedInput.addEventListener("input", () => { gameSpeedValue.textContent = gameSpeedInput.value; hudGameSpeed.textContent = gameSpeedInput.value; });
document.querySelector("#solo").addEventListener("click", () => { mode = "solo"; slot = "host"; state = createMatchState({ aiLevel: selectedAILevel(), passSpeedLevel: selectedPassSpeed(), gameSpeedLevel: selectedGameSpeed() }); setStatus("SOLO · IA", "ready"); showGame(); });
document.querySelector("#friend").addEventListener("click", hostFriend);
document.querySelector("#copy-link").addEventListener("click", async () => { await navigator.clipboard?.writeText(shareUrl.value); setStatus("LIEN COPIÉ · EN ATTENTE 1/2"); });
document.querySelector("#quit").addEventListener("click", () => { running = false; transport?.close(); transport = null; game.hidden = true; menu.hidden = false; sharePanel.hidden = true; history.replaceState({}, "", location.pathname); });

const room = roomFromLocation();
if (room) joinFriend(room);

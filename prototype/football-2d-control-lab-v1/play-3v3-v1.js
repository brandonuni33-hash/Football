import { RULES } from "./three-v-three/constants.js";
import { actionLabels, createMatchState, controlledPlayerId, getHumanPlayer } from "./three-v-three/matchState.js";
import { stepMatch } from "./three-v-three/simulation.js";
import { createInput } from "./three-v-three/input.js";
import { render } from "./three-v-three/renderer.js";
import { createGuestTransport, createHostTransport, createRoomCode, invitationUrl, reconcileLocalPlayer, roomFromLocation } from "./three-v-three/network.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const menu = document.querySelector("#menu");
const game = document.querySelector("#game-screen");
const status = document.querySelector("#network-status");
const sharePanel = document.querySelector("#share-panel");
const shareUrl = document.querySelector("#share-url");
const elements = {
  moveRoot: document.querySelector("#move-joystick"), moveKnob: document.querySelector("#move-stick"),
  controlRoot: document.querySelector("#control-joystick"), controlKnob: document.querySelector("#control-stick"),
  primary: document.querySelector("#primary"), secondary: document.querySelector("#secondary"), tertiary: document.querySelector("#tertiary"),
};
const input = createInput(elements);
let state = createMatchState();
let slot = "host";
let mode = "solo";
let transport = null;
let guestInput = {};
let running = false;
let accumulator = 0;
let previous = performance.now();
let lastSnapshotAt = 0;

function clone(value) { return structuredClone(value); }
function setStatus(text, kind = "") { status.textContent = text; status.dataset.kind = kind; }
function updateLabels() {
  const labels = actionLabels(state, controlledPlayerId(slot));
  elements.primary.textContent = labels.primary;
  elements.secondary.textContent = labels.secondary;
  elements.tertiary.textContent = labels.tertiary;
  elements.tertiary.classList.toggle("protecting", getHumanPlayer(state, slot)?.protectionRemaining > 0);
}
function showGame() { menu.hidden = true; game.hidden = false; running = true; previous = performance.now(); requestAnimationFrame(frame); }

async function hostFriend() {
  mode = "online-host"; slot = "host"; state = createMatchState({ online: true });
  const room = createRoomCode();
  const url = invitationUrl(location, room);
  shareUrl.value = url; sharePanel.hidden = false; setStatus(`${room} · EN ATTENTE · 1/2`);
  showGame();
  try {
    transport = await createHostTransport(room, {
      onReady: () => setStatus(`${room} · CONNECTÉ · 2/2`, "ready"),
      onInput: (next) => { guestInput = next; },
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
  const elapsed = Math.min(0.1, (now - previous) / 1000); previous = now; accumulator += elapsed;
  const localInput = input.read();
  if (mode === "online-guest") {
    transport?.sendInput(localInput);
    const predicted = clone(state);
    stepMatch(predicted, { guest: localInput }, Math.min(elapsed, 0.033));
    const current = state.players.find((player) => player.id === controlledPlayerId(slot));
    const prediction = predicted.players.find((player) => player.id === controlledPlayerId(slot));
    if (current && prediction) Object.assign(current, prediction);
  } else {
    while (accumulator >= RULES.fixedStep) {
      state = stepMatch(state, { host: localInput, guest: mode === "online-host" ? guestInput : undefined }, RULES.fixedStep);
      accumulator -= RULES.fixedStep;
    }
    if (mode === "online-host" && now - lastSnapshotAt >= 50) { transport?.sendSnapshot(clone(state)); lastSnapshotAt = now; }
  }
  updateLabels(); render(ctx, state, slot); requestAnimationFrame(frame);
}

document.querySelector("#solo").addEventListener("click", () => { mode = "solo"; slot = "host"; state = createMatchState(); setStatus("SOLO · IA", "ready"); showGame(); });
document.querySelector("#friend").addEventListener("click", hostFriend);
document.querySelector("#copy-link").addEventListener("click", async () => { await navigator.clipboard?.writeText(shareUrl.value); setStatus("LIEN COPIÉ · EN ATTENTE 1/2"); });
document.querySelector("#quit").addEventListener("click", () => { running = false; transport?.close(); transport = null; game.hidden = true; menu.hidden = false; sharePanel.hidden = true; history.replaceState({}, "", location.pathname); });

const room = roomFromLocation();
if (room) joinFriend(room);
import {
  VIEWPORT, PITCH, TEAM, BALL_PHASE, RULES,
  createGameplayState, getControlledPlayer, getPlayer,
  actionLabels, controlMode, stepGameplay, cameraGeometry, cameraFromBall,
  setGameplayTuning, getGameplayTuning, isIncomingAerial,
} from "./eleven-v-eleven-gameplay-lab/interactionGameplayV7.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const settingsPanel = document.querySelector("#settings");
const hudDetail = document.querySelector("#hud-detail");

const controls = {
  moveRoot: document.querySelector("#move-joystick"),
  moveKnob: document.querySelector("#move-stick"),
  controlRoot: document.querySelector("#control-joystick"),
  controlKnob: document.querySelector("#control-stick"),
  primary: document.querySelector("#primary"),
  secondary: document.querySelector("#secondary"),
  tertiary: document.querySelector("#tertiary"),
  rapid: document.querySelector("#rapid"),
};

const sliders = {
  zoom: document.querySelector("#zoom"),
  angle: document.querySelector("#angle"),
  pitchLength: document.querySelector("#pitch-length"),
  pitchWidth: document.querySelector("#pitch-width"),
  matchSpeed: document.querySelector("#match-speed"),
  shortPass: document.querySelector("#short-pass"),
  longPass: document.querySelector("#long-pass"),
  shotPower: document.querySelector("#shot-power"),
  shotLift: document.querySelector("#shot-lift"),
};

const outputs = {
  zoom: document.querySelector("#zoom-value"),
  angle: document.querySelector("#angle-value"),
  pitchLength: document.querySelector("#pitch-length-value"),
  pitchWidth: document.querySelector("#pitch-width-value"),
  matchSpeed: document.querySelector("#match-speed-value"),
  shortPass: document.querySelector("#short-pass-value"),
  longPass: document.querySelector("#long-pass-value"),
  shotPower: document.querySelector("#shot-power-value"),
  shotLift: document.querySelector("#shot-lift-value"),
};

let state = createGameplayState();
let settings = { zoom: RULES.zoom, angle: RULES.angle };
let accumulator = 0;
let previous = performance.now();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalize(x, y) {
  const raw = Math.hypot(x, y);
  if (raw <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / raw, y: y / raw, magnitude: Math.min(1, raw) };
}

function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function scanBoundary(forward, side, magnitude) {
  const half = RULES.headScanDegrees * 0.5 * Math.PI / 180;
  const cos = Math.cos(half);
  const sin = Math.sin(half) * side;
  return {
    x: (forward.x * cos - forward.y * sin) * magnitude,
    y: (forward.x * sin + forward.y * cos) * magnitude,
    lockSide: side,
  };
}

function constrainScanStick(x, y, lockedSide = 0) {
  const player = getControlledPlayer(state);
  const raw = normalize(x, y);
  if (raw.magnitude < 0.05) return { x: 0, y: 0, lockSide: 0 };

  const forward = normalize(player?.facingX ?? 1, player?.facingY ?? 0);
  const dot = clamp(raw.x * forward.x + raw.y * forward.y, -1, 1);
  const cross = forward.x * raw.y - forward.y * raw.x;
  const angle = Math.atan2(cross, dot);
  const half = RULES.headScanDegrees * 0.5 * Math.PI / 180;
  const side = Math.sign(angle) || lockedSide || 1;

  if (lockedSide) {
    const returnedSameSide = side === lockedSide && Math.abs(angle) <= half;
    const returnedThroughFront = dot > 0;
    if (returnedSameSide || returnedThroughFront) {
      return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
    }
    return scanBoundary(forward, lockedSide, raw.magnitude);
  }

  if (Math.abs(angle) <= half) {
    return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
  }
  return scanBoundary(forward, side, raw.magnitude);
}

function bindStick(root, knob, transform = null) {
  const stick = { x: 0, y: 0, pointer: null, lockSide: 0 };

  const paint = () => {
    knob.style.transform = `translate(calc(-50% + ${stick.x * 28}px),calc(-50% + ${stick.y * 28}px))`;
  };

  const clearValues = () => {
    stick.x = 0;
    stick.y = 0;
    stick.lockSide = 0;
    paint();
  };

  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }
    if (Math.hypot(x, y) < 0.06) {
      x = 0;
      y = 0;
    }
    if (transform) {
      const next = transform(x, y, stick.lockSide);
      x = next.x;
      y = next.y;
      stick.lockSide = next.lockSide ?? 0;
    }
    stick.x = x;
    stick.y = y;
    paint();
  };

  const release = (event) => {
    if (event.pointerId !== stick.pointer) return;
    stick.pointer = null;
    clearValues();
  };

  root.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    stick.pointer = event.pointerId;
    root.setPointerCapture?.(event.pointerId);
    sample(event);
  });
  root.addEventListener("pointermove", (event) => {
    if (event.pointerId === stick.pointer) sample(event);
  });
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("lostpointercapture", release);

  stick.reset = clearValues;
  return stick;
}

const moveStick = bindStick(controls.moveRoot, controls.moveKnob);
const controlStick = bindStick(controls.controlRoot, controls.controlKnob, (x, y, lockedSide) => {
  const mode = controlMode(state);
  if (mode === "locked") return { x: 0, y: 0, lockSide: 0 };
  if (mode === "scan") return constrainScanStick(x, y, lockedSide);
  return { x, y, lockSide: 0 };
});

const queued = {
  primary: false,
  secondary: false,
  tertiary: false,
  passPower: 0.48,
  lobPass: false,
  shotPower: 0.44,
};

controls.tertiary.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  queued.tertiary = true;
});

const SHOT_GESTURE = Object.freeze({
  fullPowerMs: 900,
  minPower: 0.18,
});

const shotGesture = {
  pointer: null,
  downAt: 0,
};

function shotPowerFromHold(durationMs) {
  const normalized = clamp(durationMs / SHOT_GESTURE.fullPowerMs, 0, 1);
  return SHOT_GESTURE.minPower + (1 - SHOT_GESTURE.minPower) * normalized;
}

function clearShotHold() {
  shotGesture.pointer = null;
  shotGesture.downAt = 0;
  controls.primary.classList.remove("active");
}

controls.primary.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const controlled = getControlledPlayer(state);
  if (!controlled?.hasBall) {
    queued.primary = true;
    return;
  }
  shotGesture.pointer = event.pointerId;
  shotGesture.downAt = performance.now();
  controls.primary.classList.add("active");
  controls.primary.setPointerCapture?.(event.pointerId);
});

function releaseShot(event) {
  if (event.pointerId !== shotGesture.pointer) return;
  queued.primary = true;
  queued.shotPower = shotPowerFromHold(performance.now() - shotGesture.downAt);
  clearShotHold();
}

function cancelShot(event) {
  if (event.pointerId !== shotGesture.pointer) return;
  clearShotHold();
}

controls.primary.addEventListener("pointerup", releaseShot);
controls.primary.addEventListener("pointercancel", cancelShot);
controls.primary.addEventListener("lostpointercapture", cancelShot);

const PASS_GESTURE = Object.freeze({
  quickTapMs: 190,
  doubleTapWindowMs: 230,
  fullPowerMs: 920,
  minPower: 0.18,
});

const passGesture = {
  pointer: null,
  downAt: 0,
  lobArmed: false,
  pending: null,
};

function passPowerFromHold(durationMs) {
  const normalized = clamp(durationMs / PASS_GESTURE.fullPowerMs, 0, 1);
  return PASS_GESTURE.minPower + (1 - PASS_GESTURE.minPower) * normalized;
}

function queuePass(power, lobPass) {
  queued.secondary = true;
  queued.passPower = clamp(power, PASS_GESTURE.minPower, 1);
  queued.lobPass = Boolean(lobPass);
}

function flushPendingPass(now = performance.now()) {
  if (!passGesture.pending || now < passGesture.pending.deadline) return;
  const controlled = getControlledPlayer(state);
  if (controlled?.hasBall) queuePass(passGesture.pending.power, false);
  passGesture.pending = null;
}

function clearPassHold() {
  passGesture.pointer = null;
  passGesture.downAt = 0;
  passGesture.lobArmed = false;
  controls.secondary.classList.remove("active");
}

controls.secondary.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const controlled = getControlledPlayer(state);
  if (!controlled?.hasBall) {
    queued.secondary = true;
    return;
  }

  const now = performance.now();
  const secondTap = passGesture.pending && now <= passGesture.pending.deadline;
  if (secondTap) passGesture.pending = null;

  passGesture.pointer = event.pointerId;
  passGesture.downAt = now;
  passGesture.lobArmed = Boolean(secondTap);
  controls.secondary.classList.add("active");
  controls.secondary.setPointerCapture?.(event.pointerId);
});

function releasePassButton(event) {
  if (event.pointerId !== passGesture.pointer) return;
  const now = performance.now();
  const duration = Math.max(0, now - passGesture.downAt);
  const power = passPowerFromHold(duration);

  if (passGesture.lobArmed) {
    queuePass(power, true);
  } else if (duration <= PASS_GESTURE.quickTapMs) {
    passGesture.pending = {
      power,
      deadline: now + PASS_GESTURE.doubleTapWindowMs,
    };
  } else {
    queuePass(power, false);
  }
  clearPassHold();
}

function cancelPassButton(event) {
  if (event.pointerId !== passGesture.pointer) return;
  clearPassHold();
}

controls.secondary.addEventListener("pointerup", releasePassButton);
controls.secondary.addEventListener("pointercancel", cancelPassButton);
controls.secondary.addEventListener("lostpointercapture", cancelPassButton);

const rapid = { held: false, pointer: null };
controls.rapid.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  rapid.pointer = event.pointerId;
  rapid.held = true;
  controls.rapid.classList.add("active");
  controls.rapid.setPointerCapture?.(event.pointerId);
});

function releaseRapid(event) {
  if (event.pointerId !== rapid.pointer) return;
  rapid.held = false;
  rapid.pointer = null;
  controls.rapid.classList.remove("active");
}

controls.rapid.addEventListener("pointerup", releaseRapid);
controls.rapid.addEventListener("pointercancel", releaseRapid);
controls.rapid.addEventListener("lostpointercapture", releaseRapid);

function readInput() {
  flushPendingPass();
  const mode = controlMode(state);
  const controlX = mode === "locked" ? 0 : controlStick.x;
  const controlY = mode === "locked" ? 0 : controlStick.y;
  const input = {
    moveX: moveStick.x,
    moveY: moveStick.y,
    controlX,
    controlY,
    x: controlX,
    y: controlY,
    rapidHeld: rapid.held,
    primaryPressed: queued.primary,
    secondaryPressed: queued.secondary,
    tertiaryPressed: queued.tertiary,
    passPower: queued.passPower,
    lobPass: queued.lobPass,
    shotPower: queued.shotPower,
  };
  queued.primary = false;
  queued.secondary = false;
  queued.tertiary = false;
  queued.passPower = 0.48;
  queued.lobPass = false;
  queued.shotPower = 0.44;
  return input;
}

function readSettings() {
  return {
    zoom: Number(sliders.zoom.value) / 100,
    angle: Number(sliders.angle.value),
    pitchLengthScale: Number(sliders.pitchLength.value) / 100,
    pitchWidthScale: Number(sliders.pitchWidth.value) / 100,
    matchSpeed: Number(sliders.matchSpeed.value) / 100,
    shortPassSpeed: Number(sliders.shortPass.value) / 100,
    longPassPower: Number(sliders.longPass.value) / 100,
    shotPower: Number(sliders.shotPower.value) / 100,
    shotLift: Number(sliders.shotLift.value) / 100,
  };
}

function syncSettings() {
  settings = readSettings();
  setGameplayTuning(state, settings);
  outputs.zoom.textContent = settings.zoom.toFixed(2);
  outputs.angle.textContent = String(settings.angle);
  outputs.pitchLength.textContent = `${Math.round(settings.pitchLengthScale * 100)}%`;
  outputs.pitchWidth.textContent = `${Math.round(settings.pitchWidthScale * 100)}%`;
  outputs.matchSpeed.textContent = `${Math.round(settings.matchSpeed * 100)}%`;
  outputs.shortPass.textContent = `${Math.round(settings.shortPassSpeed * 100)}%`;
  outputs.longPass.textContent = `${Math.round(settings.longPassPower * 100)}%`;
  outputs.shotPower.textContent = `${Math.round(settings.shotPower * 100)}%`;
  outputs.shotLift.textContent = `${Math.round(settings.shotLift * 100)}%`;
}

for (const slider of Object.values(sliders)) slider.addEventListener("input", syncSettings);

document.querySelector("#toggle-settings").addEventListener("click", () => {
  settingsPanel.classList.toggle("collapsed");
});

document.querySelector("#restart").addEventListener("click", () => {
  state = createGameplayState();
  setGameplayTuning(state, readSettings());
  controlStick.reset();
  moveStick.reset();
  passGesture.pending = null;
  clearPassHold();
  clearShotHold();
});

function drawPitch(context) {
  const insetX = PITCH.insetX ?? PITCH.inset;
  const insetY = PITCH.insetY ?? PITCH.inset;
  context.fillStyle = "#123d2d";
  context.fillRect(0, 0, PITCH.width, PITCH.height);

  const stripe = Math.max(90, PITCH.width / 14);
  for (let x = 0; x < PITCH.width; x += stripe) {
    context.fillStyle = Math.floor(x / stripe) % 2 ? "#164735" : "#194d39";
    context.fillRect(x, 0, stripe, PITCH.height);
  }

  context.strokeStyle = "rgba(242,247,241,.68)";
  context.lineWidth = 3;
  context.strokeRect(insetX, insetY, PITCH.width - insetX * 2, PITCH.height - insetY * 2);
  context.beginPath();
  context.moveTo(PITCH.width / 2, insetY);
  context.lineTo(PITCH.width / 2, PITCH.height - insetY);
  context.stroke();
  context.beginPath();
  context.arc(PITCH.width / 2, PITCH.height / 2, PITCH.centerCircleRadius, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(PITCH.width / 2, PITCH.height / 2, 5, 0, Math.PI * 2);
  context.fillStyle = "rgba(242,247,241,.82)";
  context.fill();

  const leftX = insetX;
  const rightX = PITCH.width - insetX;
  context.strokeRect(leftX, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  context.strokeRect(rightX - PITCH.penaltyDepth, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  context.strokeRect(leftX, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);
  context.strokeRect(rightX - PITCH.sixYardDepth, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);
  context.lineWidth = 5;
  context.strokeStyle = "rgba(248,250,248,.9)";
  context.strokeRect(leftX - PITCH.goalDepth, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);
  context.strokeRect(rightX, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);
}

function drawPlayer(context, player, alpha = 1) {
  context.save();
  context.globalAlpha *= alpha;
  context.translate(player.x, player.y);

  if (player.controlled) {
    context.strokeStyle = "#81d8e8";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, 27, 0, Math.PI * 2);
    context.stroke();
  }

  if (player.callRemaining > 0) {
    context.strokeStyle = "#e7af3f";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(0, 0, 31 + Math.sin(state.elapsed * 9) * 3, 0, Math.PI * 2);
    context.stroke();
  }

  if (player.protectionRemaining > 0) {
    context.strokeStyle = "rgba(231,175,63,.85)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, 0, 24, -1.1, 1.1);
    context.stroke();
  }

  if ((player.tacticalRole ?? "").includes("idle-pressure")) {
    context.strokeStyle = "#ff6d5f";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, 25, 0, Math.PI * 2);
    context.stroke();
  }

  context.fillStyle = player.team === TEAM.HOME ? "#f2f0e8" : "#f1a443";
  context.strokeStyle = "#0b1117";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, player.role === "GK" ? 20 : 18, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = "#111820";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(player.facingX * 27, player.facingY * 27);
  context.stroke();

  if (player.controlled) {
    context.strokeStyle = "#81d8e8";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(player.headFacingX * 7, player.headFacingY * 7);
    context.lineTo(player.headFacingX * 20, player.headFacingY * 20);
    context.stroke();
  }

  context.fillStyle = "#10161c";
  context.font = "900 11px system-ui";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(player.number), 0, 0);
  context.restore();
}

function drawBall(context, alpha = 1) {
  const height = Math.max(0, state.ball.lobHeight ?? 0);
  context.save();
  context.globalAlpha *= alpha;

  if (height > 0.5) {
    context.save();
    context.translate(state.ball.x, state.ball.y);
    context.fillStyle = `rgba(0,0,0,${0.26 * alpha})`;
    context.beginPath();
    context.ellipse(0, 4, 9 + Math.min(8, height * 0.05), 4, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  context.translate(state.ball.x, state.ball.y - height * 0.55);
  context.fillStyle = "#fff";
  context.strokeStyle = "#111";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, 8 + Math.min(2, height * 0.018), 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function drawPassLock(context, alpha = 1) {
  if (state.ball.phase !== BALL_PHASE.PASS || !state.ball.targetId) return;
  const target = getPlayer(state, state.ball.targetId);
  if (!target) return;
  context.save();
  context.globalAlpha *= alpha;
  context.translate(target.x, target.y);
  context.strokeStyle = state.ball.lobActive ? "#f6d365" : "#e7af3f";
  context.lineWidth = 3;
  context.beginPath();
  context.arc(0, 0, RULES.passTargetLockVisual, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function clipVisionDegrees(context, player, degrees) {
  const angle = Math.atan2(player.headFacingY, player.headFacingX);
  const half = degrees * 0.5 * Math.PI / 180;
  const radius = Math.hypot(PITCH.width, PITCH.height) * 2.2;
  context.beginPath();
  context.moveTo(player.x, player.y);
  context.arc(player.x, player.y, radius, angle - half, angle + half);
  context.closePath();
  context.clip();
}

function visionAlpha(player, point) {
  const headAngle = Math.atan2(player.headFacingY, player.headFacingX);
  const pointAngle = Math.atan2(point.y - player.y, point.x - player.x);
  const degrees = Math.abs(shortestAngleDelta(headAngle, pointAngle)) * 180 / Math.PI;

  if (degrees <= 60) return 1;
  if (degrees <= 80) return 1 - ((degrees - 60) / 20) * 0.28;
  if (degrees <= 105) return 0.72 - ((degrees - 80) / 25) * 0.30;
  if (degrees <= 140) return 0.42 - ((degrees - 105) / 35) * 0.18;
  return 0.18;
}

function drawPitchPerception(context, player) {
  context.save();
  context.globalAlpha = 0.28;
  drawPitch(context);
  context.restore();

  const bands = [
    { degrees: 240, alpha: 0.08 },
    { degrees: 210, alpha: 0.10 },
    { degrees: 185, alpha: 0.12 },
    { degrees: 165, alpha: 0.14 },
    { degrees: 145, alpha: 0.16 },
    { degrees: 130, alpha: 0.18 },
    { degrees: 120, alpha: 0.24 },
  ];

  for (const band of bands) {
    context.save();
    clipVisionDegrees(context, player, band.degrees);
    context.globalAlpha = band.alpha;
    drawPitch(context);
    context.restore();
  }
}

function applyCamera(context, camera) {
  const geometry = cameraGeometry(settings);
  context.translate(VIEWPORT.width / 2, VIEWPORT.height / 2);
  context.transform(geometry.zoom, 0, geometry.shear * geometry.zoom, geometry.yScale * geometry.zoom, 0, 0);
  context.translate(-camera.x, -camera.y);
}

function render() {
  const player = getControlledPlayer(state);
  const camera = cameraFromBall(state, settings);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  ctx.save();
  applyCamera(ctx, camera);
  drawPitchPerception(ctx, player);

  for (const other of state.players) {
    if (other.controlled) continue;
    drawPlayer(ctx, other, visionAlpha(player, other));
  }

  const target = state.ball.targetId ? getPlayer(state, state.ball.targetId) : null;
  const passAlpha = target ? Math.max(0.28, visionAlpha(player, target)) : 1;
  drawPassLock(ctx, passAlpha);

  const ballAlpha = Math.max(0.38, visionAlpha(player, state.ball));
  drawBall(ctx, ballAlpha);
  drawPlayer(ctx, player, 1);
  ctx.restore();

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "rgba(5,9,12,.72)";
  ctx.fillRect(16, VIEWPORT.height - 49, 845, 32);
  ctx.fillStyle = "#f3f1eb";
  ctx.font = "800 11px system-ui";
  ctx.textAlign = "left";
  const mode = controlMode(state, player).toUpperCase();
  const homePhase = state.tactical.home?.phase ?? "-";
  const awayPhase = state.tactical.away?.phase ?? "-";
  const lob = state.ball.lobActive ? ` · AIR ${Math.round(state.ball.lobHeight ?? 0)}` : "";
  ctx.fillText(
    `STP 11v11 · ${state.score.home}-${state.score.away} · 4-3-3 vs 4-4-2 · ${mode} · DOM ${homePhase} / EXT ${awayPhase}${lob}`,
    28,
    VIEWPORT.height - 28,
  );
  ctx.restore();
}

function modeText(mode) {
  if (mode === "scan") return "SCAN";
  if (mode === "receive") return isIncomingAerial(state) ? "CENTRE · TÊTE / CONTRÔLE" : "CONTRÔLE ORIENTÉ · PASSE";
  if (mode === "loose") return "CONTRÔLE ORIENTÉ · BALLON LIBRE";
  if (mode === "protect") return "PROTECTION";
  if (mode === "feint") return "FEINTE";
  return "JOYSTICK D VERROUILLÉ";
}

function syncHud() {
  const player = getControlledPlayer(state);
  const labels = actionLabels(state);
  const mode = controlMode(state, player);

  controls.primary.textContent = labels.primary;
  controls.secondary.textContent = labels.secondary;
  controls.tertiary.textContent = labels.tertiary;

  if (player.hasBall && shotGesture.pointer !== null) {
    const power = Math.round(shotPowerFromHold(performance.now() - shotGesture.downAt) * 100);
    controls.primary.textContent = `TIR ${power}%`;
  }

  if (player.hasBall && passGesture.pointer !== null) {
    const power = Math.round(passPowerFromHold(performance.now() - passGesture.downAt) * 100);
    controls.secondary.textContent = passGesture.lobArmed ? `LEVÉE ${power}%` : `PASSE ${power}%`;
  } else if (player.hasBall && passGesture.pending) {
    controls.secondary.textContent = "PASSE…";
  }

  controls.secondary.classList.toggle("braking", player.defensiveBrakeRemaining > 0);
  controls.tertiary.classList.toggle("protecting", player.protectionRemaining > 0);
  controls.controlRoot.dataset.mode = mode;

  if (mode === "locked" && (Math.abs(controlStick.x) > 0.001 || Math.abs(controlStick.y) > 0.001)) {
    controlStick.reset();
  }

  const chasers = state.looseBallChasers ?? {};
  const homeChaser = chasers.home ? getPlayer(state, chasers.home)?.number : null;
  const awayChaser = chasers.away ? getPlayer(state, chasers.away)?.number : null;
  const loose = homeChaser || awayChaser ? ` · LIBRE H#${homeChaser ?? "-"} A#${awayChaser ?? "-"}` : "";
  const idle = state.gameplayV7?.idlePresserId ? ` · PRESS 4s #${getPlayer(state, state.gameplayV7.idlePresserId)?.number ?? "?"}` : "";
  const aerial = state.gameplayV7?.aerialLastResolution ? ` · ${state.gameplayV7.aerialLastResolution}` : "";
  const tune = getGameplayTuning(state);
  hudDetail.textContent = `${modeText(mode)} · MATCH ${Math.round(tune.matchSpeed * 100)}%${loose}${idle}${aerial}`;
}

function frame(now) {
  const elapsed = Math.min(0.08, (now - previous) / 1000);
  previous = now;
  accumulator = Math.min(accumulator + elapsed, RULES.fixedStep * 4);

  let input = readInput();
  while (accumulator >= RULES.fixedStep) {
    state = stepGameplay(state, input, RULES.fixedStep);
    input = {
      ...input,
      primaryPressed: false,
      secondaryPressed: false,
      tertiaryPressed: false,
      lobPass: false,
    };
    accumulator -= RULES.fixedStep;
  }

  syncHud();
  render();
  requestAnimationFrame(frame);
}

syncSettings();
syncHud();
requestAnimationFrame(frame);

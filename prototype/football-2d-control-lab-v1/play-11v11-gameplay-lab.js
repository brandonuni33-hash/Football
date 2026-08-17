import {
  VIEWPORT, PITCH, TEAM, BALL_PHASE, RULES,
  createGameplayState, getControlledPlayer, getPlayer, getOwner,
  actionLabels, controlMode, stepGameplay, cameraGeometry, cameraFromBall,
} from "./eleven-v-eleven-gameplay-lab/engine.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const zoomInput = document.querySelector("#zoom");
const angleInput = document.querySelector("#angle");
const zoomValue = document.querySelector("#zoom-value");
const angleValue = document.querySelector("#angle-value");
const settingsPanel = document.querySelector("#settings");
const hudDetail = document.querySelector("#hud-detail");
const elements = {
  moveRoot: document.querySelector("#move-joystick"), moveKnob: document.querySelector("#move-stick"),
  controlRoot: document.querySelector("#control-joystick"), controlKnob: document.querySelector("#control-stick"),
  primary: document.querySelector("#primary"), secondary: document.querySelector("#secondary"),
  tertiary: document.querySelector("#tertiary"), rapid: document.querySelector("#rapid"), tackle: document.querySelector("#tackle"),
};

let state = createGameplayState();
let settings = { zoom: RULES.zoom, angle: RULES.angle };
let accumulator = 0;
let previous = performance.now();

function normalize(x, y) {
  const raw = Math.hypot(x, y);
  if (raw <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / raw, y: y / raw, magnitude: Math.min(1, raw) };
}
function scanBoundary(forward, side, magnitude) {
  const half = RULES.headScanDegrees * 0.5 * Math.PI / 180;
  const c = Math.cos(half), s = Math.sin(half) * side;
  return { x: (forward.x * c - forward.y * s) * magnitude, y: (forward.x * s + forward.y * c) * magnitude, lockSide: side };
}
function constrainScanStick(x, y, lockedSide = 0) {
  const p = getControlledPlayer(state);
  const raw = normalize(x, y);
  if (raw.magnitude < 0.05) return { x: 0, y: 0, lockSide: 0 };
  const forward = normalize(p?.facingX ?? 1, p?.facingY ?? 0);
  const dot = Math.max(-1, Math.min(1, raw.x * forward.x + raw.y * forward.y));
  const cross = forward.x * raw.y - forward.y * raw.x;
  const angle = Math.atan2(cross, dot);
  const half = RULES.headScanDegrees * 0.5 * Math.PI / 180;
  const side = Math.sign(angle) || lockedSide || 1;
  if (lockedSide) {
    const backInsideSameSide = side === lockedSide && Math.abs(angle) <= half;
    const throughFront = dot > 0;
    if (backInsideSameSide || throughFront) return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
    return scanBoundary(forward, lockedSide, raw.magnitude);
  }
  if (Math.abs(angle) <= half) return { x: raw.x * raw.magnitude, y: raw.y * raw.magnitude, lockSide: 0 };
  return scanBoundary(forward, side, raw.magnitude);
}

function bindStick(root, knob, transform = null) {
  const stick = { x: 0, y: 0, pointer: null, lockSide: 0 };
  const paint = () => { knob.style.transform = `translate(calc(-50% + ${stick.x * 28}px),calc(-50% + ${stick.y * 28}px))`; };
  const clearValues = () => { stick.x = 0; stick.y = 0; stick.lockSide = 0; paint(); };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    if (Math.hypot(x, y) < 0.06) { x = 0; y = 0; }
    if (transform) {
      const next = transform(x, y, stick.lockSide);
      x = next.x; y = next.y; stick.lockSide = next.lockSide ?? 0;
    }
    stick.x = x; stick.y = y; paint();
  };
  const release = (event) => {
    if (event.pointerId !== stick.pointer) return;
    stick.pointer = null; clearValues();
  };
  root.addEventListener("pointerdown", (event) => { event.preventDefault(); stick.pointer = event.pointerId; root.setPointerCapture?.(event.pointerId); sample(event); });
  root.addEventListener("pointermove", (event) => { if (event.pointerId === stick.pointer) sample(event); });
  root.addEventListener("pointerup", release); root.addEventListener("pointercancel", release); root.addEventListener("lostpointercapture", release);
  stick.reset = clearValues;
  return stick;
}

const moveStick = bindStick(elements.moveRoot, elements.moveKnob);
const controlStick = bindStick(elements.controlRoot, elements.controlKnob, (x, y, lockedSide) => {
  const mode = controlMode(state);
  if (mode === "locked") return { x: 0, y: 0, lockSide: 0 };
  if (mode === "scan") return constrainScanStick(x, y, lockedSide);
  return { x, y, lockSide: 0 };
});
const queued = { primary: false, secondary: false, tertiary: false, tackle: false };
for (const key of ["primary", "secondary", "tertiary", "tackle"]) {
  elements[key].addEventListener("pointerdown", (event) => { event.preventDefault(); queued[key] = true; });
}
const rapid = { held: false, pointer: null };
elements.rapid.addEventListener("pointerdown", (event) => {
  event.preventDefault(); rapid.pointer = event.pointerId; rapid.held = true; elements.rapid.classList.add("active"); elements.rapid.setPointerCapture?.(event.pointerId);
});
function releaseRapid(event) {
  if (event.pointerId !== rapid.pointer) return;
  rapid.held = false; rapid.pointer = null; elements.rapid.classList.remove("active");
}
elements.rapid.addEventListener("pointerup", releaseRapid); elements.rapid.addEventListener("pointercancel", releaseRapid); elements.rapid.addEventListener("lostpointercapture", releaseRapid);

function readInput() {
  const mode = controlMode(state);
  const cx = mode === "locked" ? 0 : controlStick.x;
  const cy = mode === "locked" ? 0 : controlStick.y;
  const input = {
    moveX: moveStick.x, moveY: moveStick.y, controlX: cx, controlY: cy,
    x: cx, y: cy, rapidHeld: rapid.held,
    primaryPressed: queued.primary, secondaryPressed: queued.secondary,
    tertiaryPressed: queued.tertiary, tacklePressed: queued.tackle,
  };
  queued.primary = queued.secondary = queued.tertiary = queued.tackle = false;
  return input;
}

function readSettings() { return { zoom: Number(zoomInput.value) / 100, angle: Number(angleInput.value) }; }
function syncSettings() {
  settings = readSettings(); zoomValue.textContent = settings.zoom.toFixed(2); angleValue.textContent = String(settings.angle);
}
zoomInput.addEventListener("input", syncSettings); angleInput.addEventListener("input", syncSettings);
document.querySelector("#toggle-settings").addEventListener("click", () => settingsPanel.classList.toggle("collapsed"));
document.querySelector("#restart").addEventListener("click", () => { state = createGameplayState(); controlStick.reset(); moveStick.reset(); });

function drawPitch(c) {
  c.fillStyle = "#123d2d"; c.fillRect(0, 0, PITCH.width, PITCH.height);
  for (let x = 0; x < PITCH.width; x += 120) { c.fillStyle = Math.floor(x / 120) % 2 ? "#164735" : "#194d39"; c.fillRect(x, 0, 120, PITCH.height); }
  c.strokeStyle = "rgba(242,247,241,.68)"; c.lineWidth = 3;
  c.strokeRect(PITCH.inset, PITCH.inset, PITCH.width - PITCH.inset * 2, PITCH.height - PITCH.inset * 2);
  c.beginPath(); c.moveTo(PITCH.width / 2, PITCH.inset); c.lineTo(PITCH.width / 2, PITCH.height - PITCH.inset); c.stroke();
  c.beginPath(); c.arc(PITCH.width / 2, PITCH.height / 2, PITCH.centerCircleRadius, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.arc(PITCH.width / 2, PITCH.height / 2, 5, 0, Math.PI * 2); c.fillStyle = "rgba(242,247,241,.82)"; c.fill();
  const lx = PITCH.inset, rx = PITCH.width - PITCH.inset;
  c.strokeRect(lx, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  c.strokeRect(rx - PITCH.penaltyDepth, PITCH.penaltyTop, PITCH.penaltyDepth, PITCH.penaltyBottom - PITCH.penaltyTop);
  c.strokeRect(lx, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);
  c.strokeRect(rx - PITCH.sixYardDepth, PITCH.sixYardTop, PITCH.sixYardDepth, PITCH.sixYardBottom - PITCH.sixYardTop);
  c.lineWidth = 5; c.strokeStyle = "rgba(248,250,248,.9)";
  c.strokeRect(lx - PITCH.goalDepth, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);
  c.strokeRect(rx, PITCH.goalTop, PITCH.goalDepth, PITCH.goalBottom - PITCH.goalTop);
}
function drawPlayer(c, p) {
  c.save(); c.translate(p.x, p.y);
  if (p.controlled) { c.strokeStyle = "#81d8e8"; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 27, 0, Math.PI * 2); c.stroke(); }
  if (p.callRemaining > 0) { c.strokeStyle = "#e7af3f"; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 31 + Math.sin(state.elapsed * 9) * 3, 0, Math.PI * 2); c.stroke(); }
  if (p.protectionRemaining > 0) { c.strokeStyle = "rgba(231,175,63,.85)"; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 24, -1.1, 1.1); c.stroke(); }
  c.fillStyle = p.team === TEAM.HOME ? "#f2f0e8" : "#f1a443"; c.strokeStyle = "#0b1117"; c.lineWidth = 3;
  c.beginPath(); c.arc(0, 0, p.role === "GK" ? 20 : 18, 0, Math.PI * 2); c.fill(); c.stroke();
  c.strokeStyle = "#111820"; c.lineWidth = 4; c.beginPath(); c.moveTo(0,0); c.lineTo(p.facingX * 27, p.facingY * 27); c.stroke();
  if (p.controlled) {
    c.strokeStyle = "#81d8e8"; c.lineWidth = 4; c.beginPath(); c.moveTo(p.headFacingX * 7,p.headFacingY * 7); c.lineTo(p.headFacingX * 20,p.headFacingY * 20); c.stroke();
  }
  c.fillStyle = "#10161c"; c.font = "900 11px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(p.number), 0, 0);
  c.restore();
}
function drawBall(c) {
  c.save(); c.translate(state.ball.x, state.ball.y); c.fillStyle = "#fff"; c.strokeStyle = "#111"; c.lineWidth = 2;
  c.beginPath(); c.arc(0,0,8,0,Math.PI*2); c.fill(); c.stroke(); c.restore();
}
function drawPassLock(c) {
  if (state.ball.phase !== BALL_PHASE.PASS || !state.ball.targetId) return;
  const target = getPlayer(state, state.ball.targetId); if (!target) return;
  c.save(); c.translate(target.x,target.y); c.strokeStyle = "#e7af3f"; c.lineWidth = 3;
  c.beginPath(); c.arc(0,0,RULES.passTargetLockVisual,0,Math.PI*2); c.stroke(); c.restore();
}
function clipVision(c, p) {
  const angle = Math.atan2(p.headFacingY,p.headFacingX);
  const half = RULES.visionDegrees * 0.5 * Math.PI / 180;
  const radius = Math.hypot(PITCH.width,PITCH.height) * 2.2;
  c.beginPath(); c.moveTo(p.x,p.y); c.arc(p.x,p.y,radius,angle-half,angle+half); c.closePath(); c.clip();
}
function applyCamera(c, camera) {
  const g = cameraGeometry(settings);
  c.translate(VIEWPORT.width/2,VIEWPORT.height/2);
  c.transform(g.zoom,0,g.shear*g.zoom,g.yScale*g.zoom,0,0);
  c.translate(-camera.x,-camera.y);
}
function render() {
  const p = getControlledPlayer(state); const camera = cameraFromBall(state, settings);
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,VIEWPORT.width,VIEWPORT.height);
  ctx.save(); applyCamera(ctx,camera);
  ctx.save(); ctx.globalAlpha = RULES.blindPitchAlpha; drawPitch(ctx); ctx.restore();
  ctx.save(); clipVision(ctx,p); drawPitch(ctx); for (const other of state.players) if (!other.controlled) drawPlayer(ctx,other); drawPassLock(ctx); ctx.restore();
  drawPlayer(ctx,p); drawBall(ctx); ctx.restore();
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle="rgba(5,9,12,.78)"; ctx.fillRect(16,VIEWPORT.height-49,660,32);
  ctx.fillStyle="#f3f1eb"; ctx.font="800 12px system-ui"; ctx.textAlign="left";
  const owner=getOwner(state); const mode=controlMode(state,p).toUpperCase();
  ctx.fillText(`STP 11v11 · ${state.score.home}-${state.score.away} · ${owner?`${owner.team==="home"?"DOM":"EXT"} #${owner.number}`:"BALLON LIBRE"} · ${mode} · ${state.lastEvent} · Z ${settings.zoom.toFixed(2)}`,28,VIEWPORT.height-28);
  ctx.restore();
}

function syncHud() {
  const p = getControlledPlayer(state); const labels = actionLabels(state); const mode = controlMode(state,p);
  elements.primary.textContent = labels.primary; elements.secondary.textContent = labels.secondary; elements.tertiary.textContent = labels.tertiary;
  elements.tackle.hidden = p.hasBall;
  elements.secondary.classList.toggle("braking", p.defensiveBrakeRemaining > 0);
  elements.tertiary.classList.toggle("protecting", p.protectionRemaining > 0);
  elements.controlRoot.dataset.mode = mode;
  if (mode === "locked" && (Math.abs(controlStick.x) > 0.001 || Math.abs(controlStick.y) > 0.001)) controlStick.reset();
  const owner = getOwner(state);
  hudDetail.textContent = `${owner ? `Ballon #${owner.number} ${owner.team === TEAM.HOME ? "DOM" : "EXT"}` : "Ballon libre"} · ${mode === "scan" ? "SCAN" : mode === "tech" ? "TECHNIQUE" : "JOYSTICK D VERROUILLÉ"}`;
}

function frame(now) {
  const elapsed = Math.min(0.08,(now-previous)/1000); previous=now; accumulator=Math.min(accumulator+elapsed,RULES.fixedStep*4);
  let input = readInput();
  while (accumulator >= RULES.fixedStep) {
    state = stepGameplay(state,input,RULES.fixedStep);
    input = { ...input, primaryPressed:false,secondaryPressed:false,tertiaryPressed:false,tacklePressed:false };
    accumulator -= RULES.fixedStep;
  }
  syncHud(); render(); requestAnimationFrame(frame);
}

syncSettings(); syncHud(); requestAnimationFrame(frame);

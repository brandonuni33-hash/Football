import { VIEWPORT, PITCH, FEEL_RULES, createPlayerFeelState, stepPlayerFeel, mannequinPose } from "./playerFeelModelV08.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const hud = document.querySelector("#hud-detail");
const moveRoot = document.querySelector("#move-joystick");
const moveKnob = document.querySelector("#move-stick");
const rapidButton = document.querySelector("#rapid");
const cameraAngleInput = document.querySelector("#camera-angle");
const cameraAngleOutput = document.querySelector("#camera-angle-value");

let cameraAngleDeg = Number(cameraAngleInput?.value ?? 28);
let state = createPlayerFeelState();
let accumulator = 0;
let previous = performance.now();

function updateCameraAngle() {
  cameraAngleDeg = Number(cameraAngleInput?.value ?? 0);
  if (cameraAngleOutput) cameraAngleOutput.textContent = `${cameraAngleDeg}°`;
}
cameraAngleInput?.addEventListener("input", updateCameraAngle);
updateCameraAngle();

function bindStick(root, knob) {
  const stick = { x: 0, y: 0, pointer: null };
  const paint = () => { knob.style.transform = `translate(calc(-50% + ${stick.x * 28}px),calc(-50% + ${stick.y * 28}px))`; };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    if (Math.hypot(x, y) < 0.06) { x = 0; y = 0; }
    stick.x = x; stick.y = y; paint();
  };
  const release = (event) => {
    if (event.pointerId !== stick.pointer) return;
    stick.pointer = null; stick.x = 0; stick.y = 0; paint();
  };
  root.addEventListener("pointerdown", (event) => { event.preventDefault(); stick.pointer = event.pointerId; root.setPointerCapture?.(event.pointerId); sample(event); });
  root.addEventListener("pointermove", (event) => { if (event.pointerId === stick.pointer) sample(event); });
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  root.addEventListener("lostpointercapture", release);
  stick.reset = () => { stick.x = 0; stick.y = 0; stick.pointer = null; paint(); };
  return stick;
}

const moveStick = bindStick(moveRoot, moveKnob);
const rapid = { held: false, pointer: null };
rapidButton.addEventListener("pointerdown", (event) => { event.preventDefault(); rapid.pointer = event.pointerId; rapid.held = true; rapidButton.classList.add("active"); rapidButton.setPointerCapture?.(event.pointerId); });
function releaseRapid(event) { if (event.pointerId !== rapid.pointer) return; rapid.held = false; rapid.pointer = null; rapidButton.classList.remove("active"); }
rapidButton.addEventListener("pointerup", releaseRapid);
rapidButton.addEventListener("pointercancel", releaseRapid);
rapidButton.addEventListener("lostpointercapture", releaseRapid);

document.querySelector("#restart").addEventListener("click", () => { state = createPlayerFeelState(); moveStick.reset(); rapid.held = false; rapidButton.classList.remove("active"); });

function drawPitch() {
  ctx.fillStyle = "#163d2e"; ctx.fillRect(0, 0, PITCH.width, PITCH.height);
  for (let x = 0; x < PITCH.width; x += 110) { ctx.fillStyle = Math.floor(x / 110) % 2 ? "#194735" : "#17412f"; ctx.fillRect(x, 0, 110, PITCH.height); }
  ctx.strokeStyle = "rgba(243,246,239,.55)"; ctx.lineWidth = 3;
  ctx.strokeRect(PITCH.inset, PITCH.inset, PITCH.width - PITCH.inset * 2, PITCH.height - PITCH.inset * 2);
  ctx.beginPath(); ctx.moveTo(PITCH.width / 2, PITCH.inset); ctx.lineTo(PITCH.width / 2, PITCH.height - PITCH.inset); ctx.stroke();
  ctx.beginPath(); ctx.arc(PITCH.width / 2, PITCH.height / 2, 92, 0, Math.PI * 2); ctx.stroke();
}
function limb(a, b, width, color) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
function joint(point, radius, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill(); }
function foot(point, facing, planted) {
  ctx.save(); ctx.translate(point.x, point.y); ctx.rotate(facing);
  ctx.fillStyle = planted ? "#e7af3f" : "#f0eee8";
  ctx.beginPath(); ctx.ellipse(0, 0, planted ? 5.6 : 4.6, planted ? 3.2 : 2.7, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawPlayer() {
  const pose = mannequinPose(state), p = state.player;
  const left = pose.plantedFoot === "left", right = pose.plantedFoot === "right";
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(p.x + 5, p.y + 8, 27, 13, p.facing, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  limb(pose.leftShoulder, pose.leftElbow, 7, "#d7aa84"); limb(pose.leftElbow, pose.leftHand, 6, "#d7aa84");
  limb(pose.rightShoulder, pose.rightElbow, 7, "#d7aa84"); limb(pose.rightElbow, pose.rightHand, 6, "#d7aa84");
  joint(pose.leftHand, 4.2, "#d7aa84"); joint(pose.rightHand, 4.2, "#d7aa84");
  limb(pose.hip, pose.leftKnee, 9, "#e8e6df"); limb(pose.leftKnee, pose.leftFoot, 8, "#d6d4cd");
  limb(pose.hip, pose.rightKnee, 9, "#e8e6df"); limb(pose.rightKnee, pose.rightFoot, 8, "#d6d4cd");
  foot(pose.leftFoot, p.facing, left); foot(pose.rightFoot, p.facing, right); limb(pose.hip, pose.torso, 10, "#0d1218");
  ctx.save(); ctx.translate(pose.torso.x, pose.torso.y); ctx.rotate(p.facing); ctx.fillStyle = "#10161d"; ctx.strokeStyle = "#f1efe8"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(-14, -10, 29, 20, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#e7af3f"; ctx.font = "900 9px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("8", 1, 0); ctx.restore();
  joint(pose.head, 8.5, "#d7aa84");
  if (p.mode === "plant") { ctx.strokeStyle = "rgba(231,175,63,.78)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(pose.plantAnchor?.x ?? p.x, pose.plantAnchor?.y ?? p.y, 18, 0, Math.PI * 2); ctx.stroke(); }
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  const verticalScale = Math.cos(cameraAngleDeg * Math.PI / 180);
  ctx.save(); ctx.translate(VIEWPORT.width / 2, VIEWPORT.height / 2); ctx.scale(1, verticalScale); ctx.translate(-state.camera.x, -state.camera.y); drawPitch(); drawPlayer(); ctx.restore();
  const p = state.player;
  const precision = Math.round((p.precisionBodyControl ?? 0) * 100);
  hud.textContent = `V0.8 · angle ${cameraAngleDeg}° · ${Math.round(p.speed)} u/s · ${precision > 0 ? `DOS ${precision}%` : p.mode}`;
}

function frame(now) {
  const elapsed = Math.min(0.08, (now - previous) / 1000); previous = now; accumulator = Math.min(accumulator + elapsed, FEEL_RULES.fixedStep * 4);
  while (accumulator >= FEEL_RULES.fixedStep) { state = stepPlayerFeel(state, { moveX: moveStick.x, moveY: moveStick.y, rapidHeld: rapid.held }, FEEL_RULES.fixedStep); accumulator -= FEEL_RULES.fixedStep; }
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

import {
  VIEWPORT,
  PITCH,
  FEEL_RULES,
  createPlayerFeelState,
  stepPlayerFeel,
  mannequinPose,
} from "./playerFeelModelV03.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const hud = document.querySelector("#hud-detail");
const moveRoot = document.querySelector("#move-joystick");
const moveKnob = document.querySelector("#move-stick");
const rapidButton = document.querySelector("#rapid");

let state = createPlayerFeelState();
let accumulator = 0;
let previous = performance.now();

function bindStick(root, knob) {
  const stick = { x: 0, y: 0, pointer: null };
  const paint = () => {
    knob.style.transform = `translate(calc(-50% + ${stick.x * 28}px),calc(-50% + ${stick.y * 28}px))`;
  };
  const sample = (event) => {
    const rect = root.getBoundingClientRect();
    let x = (event.clientX - rect.left - rect.width / 2) / (rect.width * 0.34);
    let y = (event.clientY - rect.top - rect.height / 2) / (rect.height * 0.34);
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    if (Math.hypot(x, y) < 0.06) { x = 0; y = 0; }
    stick.x = x;
    stick.y = y;
    paint();
  };
  const release = (event) => {
    if (event.pointerId !== stick.pointer) return;
    stick.pointer = null;
    stick.x = 0;
    stick.y = 0;
    paint();
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
  stick.reset = () => { stick.x = 0; stick.y = 0; stick.pointer = null; paint(); };
  return stick;
}

const moveStick = bindStick(moveRoot, moveKnob);
const rapid = { held: false, pointer: null };

rapidButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  rapid.pointer = event.pointerId;
  rapid.held = true;
  rapidButton.classList.add("active");
  rapidButton.setPointerCapture?.(event.pointerId);
});
function releaseRapid(event) {
  if (event.pointerId !== rapid.pointer) return;
  rapid.held = false;
  rapid.pointer = null;
  rapidButton.classList.remove("active");
}
rapidButton.addEventListener("pointerup", releaseRapid);
rapidButton.addEventListener("pointercancel", releaseRapid);
rapidButton.addEventListener("lostpointercapture", releaseRapid);

document.querySelector("#restart").addEventListener("click", () => {
  state = createPlayerFeelState();
  moveStick.reset();
  rapid.held = false;
  rapidButton.classList.remove("active");
});

function drawPitch() {
  ctx.fillStyle = "#163d2e";
  ctx.fillRect(0, 0, PITCH.width, PITCH.height);
  for (let x = 0; x < PITCH.width; x += 110) {
    ctx.fillStyle = Math.floor(x / 110) % 2 ? "#194735" : "#17412f";
    ctx.fillRect(x, 0, 110, PITCH.height);
  }
  ctx.strokeStyle = "rgba(243,246,239,.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(PITCH.inset, PITCH.inset, PITCH.width - PITCH.inset * 2, PITCH.height - PITCH.inset * 2);
  ctx.beginPath();
  ctx.moveTo(PITCH.width / 2, PITCH.inset);
  ctx.lineTo(PITCH.width / 2, PITCH.height - PITCH.inset);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(PITCH.width / 2, PITCH.height / 2, 92, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let x = PITCH.inset + 80; x < PITCH.width - PITCH.inset; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, PITCH.inset); ctx.lineTo(x, PITCH.height - PITCH.inset); ctx.stroke();
  }
  for (let y = PITCH.inset + 80; y < PITCH.height - PITCH.inset; y += 80) {
    ctx.beginPath(); ctx.moveTo(PITCH.inset, y); ctx.lineTo(PITCH.width - PITCH.inset, y); ctx.stroke();
  }
}

function drawLimb(a, b, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

function drawJoint(point, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMannequin() {
  const pose = mannequinPose(state);
  const p = state.player;
  const leftGold = pose.plantedFoot === "left";
  const rightGold = pose.plantedFoot === "right";

  ctx.save();
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(p.x + 5, p.y + 8, 27, 13, p.facing, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawLimb(pose.leftShoulder, pose.leftElbow, 7, "#d7aa84");
  drawLimb(pose.leftElbow, pose.leftHand, 6, "#d7aa84");
  drawLimb(pose.rightShoulder, pose.rightElbow, 7, "#d7aa84");
  drawLimb(pose.rightElbow, pose.rightHand, 6, "#d7aa84");
  drawJoint(pose.leftHand, 4.2, "#d7aa84");
  drawJoint(pose.rightHand, 4.2, "#d7aa84");

  drawLimb(pose.hip, pose.leftKnee, 9, "#e8e6df");
  drawLimb(pose.leftKnee, pose.leftFoot, 8, "#d6d4cd");
  drawLimb(pose.hip, pose.rightKnee, 9, "#e8e6df");
  drawLimb(pose.rightKnee, pose.rightFoot, 8, "#d6d4cd");

  ctx.fillStyle = leftGold ? "#e7af3f" : "#f0eee8";
  ctx.beginPath(); ctx.arc(pose.leftFoot.x, pose.leftFoot.y, leftGold ? 7 : 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rightGold ? "#e7af3f" : "#f0eee8";
  ctx.beginPath(); ctx.arc(pose.rightFoot.x, pose.rightFoot.y, rightGold ? 7 : 5.5, 0, Math.PI * 2); ctx.fill();

  // Axe bassin → buste pour lire immédiatement le redressement / l'inclinaison.
  drawLimb(pose.hip, pose.torso, 10, "#0d1218");

  ctx.save();
  ctx.translate(pose.torso.x, pose.torso.y);
  ctx.rotate(p.facing);
  ctx.fillStyle = "#10161d";
  ctx.strokeStyle = "#f1efe8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-14, -10, 29, 20, 8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e7af3f";
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("8", 1, 0);
  ctx.restore();

  ctx.fillStyle = "#d7aa84";
  ctx.strokeStyle = "#11161b";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(pose.head.x, pose.head.y, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  drawLimb(pose.torso, {
    x: pose.torso.x + pose.forward.x * 31,
    y: pose.torso.y + pose.forward.y * 31,
  }, 3.5, "#81d8e8");

  if (p.mode === "plant") {
    ctx.strokeStyle = "rgba(231,175,63,.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 34, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  ctx.save();
  ctx.translate(VIEWPORT.width / 2, VIEWPORT.height / 2);
  ctx.translate(-state.camera.x, -state.camera.y);
  drawPitch();
  drawMannequin();
  ctx.restore();

  const p = state.player;
  ctx.save();
  ctx.fillStyle = "rgba(5,9,12,.74)";
  ctx.fillRect(16, VIEWPORT.height - 49, 810, 32);
  ctx.fillStyle = "#f3f1eb";
  ctx.font = "800 12px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${p.mode.toUpperCase()} · ${Math.round(p.speed)} u/s · buste ${p.torsoLeanDegrees.toFixed(1)}° · rotation ${Math.round(p.turnDeltaDegrees)}° · appui ${p.plantedFoot.toUpperCase()} · ${p.rapid ? "RAPIDE" : "NORMAL 76%"}`,
    28,
    VIEWPORT.height - 33,
  );
  ctx.restore();

  hud.textContent = `V0.3 · ${Math.round(p.speed)} u/s · buste ${p.torsoLeanDegrees.toFixed(1)}° · ${p.mode}`;
}

function frame(now) {
  const elapsed = Math.min(0.08, (now - previous) / 1000);
  previous = now;
  accumulator = Math.min(accumulator + elapsed, FEEL_RULES.fixedStep * 4);
  while (accumulator >= FEEL_RULES.fixedStep) {
    state = stepPlayerFeel(state, {
      moveX: moveStick.x,
      moveY: moveStick.y,
      rapidHeld: rapid.held,
    }, FEEL_RULES.fixedStep);
    accumulator -= FEEL_RULES.fixedStep;
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

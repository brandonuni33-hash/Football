export const VIEWPORT = Object.freeze({ width: 1000, height: 540 });
export const PITCH = Object.freeze({ width: 1440, height: 900, inset: 64 });

export const FEEL_RULES = Object.freeze({
  fixedStep: 1 / 60,
  rapidSpeed: 222,
  normalPaceScale: 0.76,
  acceleration: 760,
  deceleration: 720,
  sharpTurnDegrees: 58,
  sharpTurnMinSpeed: 108,
  plantDuration: 0.12,
  plantCooldownDuration: 0.34,
  plantSpeedScale: 0.44,
  bodyTurnDegreesPerSecond: 245,
  lowSpeedTurnDegreesPerSecond: 330,
  gaitStride: 20,
  gaitWidth: 11,
  gaitMinFrequency: 1.45,
  gaitMaxFrequency: 3.55,
  cameraLead: 64,
  cameraResponse: 5.4,
  cameraDeadX: 70,
  cameraDeadY: 44,
});

const DEG = Math.PI / 180;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalize(x = 0, y = 0) {
  const length = Math.hypot(x, y);
  if (length <= 0.0001) return { x: 0, y: 0, magnitude: 0 };
  return { x: x / length, y: y / length, magnitude: Math.min(1, length) };
}

function approach(value, target, amount) {
  if (value < target) return Math.min(target, value + amount);
  return Math.max(target, value - amount);
}

function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function rotateToward(current, target, maxRadians) {
  return current + clamp(shortestAngleDelta(current, target), -maxRadians, maxRadians);
}

export function createPlayerFeelState() {
  return {
    elapsed: 0,
    player: {
      x: PITCH.width * 0.5,
      y: PITCH.height * 0.5,
      vx: 0,
      vy: 0,
      speed: 0,
      facing: 0,
      desiredFacing: 0,
      gaitPhase: 0,
      plantedFoot: "right",
      plantRemaining: 0,
      plantCooldown: 0,
      plantTurnSign: 0,
      mode: "idle",
      rapid: false,
      inputMagnitude: 0,
      turnDeltaDegrees: 0,
    },
    camera: {
      x: PITCH.width * 0.5,
      y: PITCH.height * 0.5,
    },
    lastEvent: "ready",
  };
}

function triggerPlant(player, turnDelta) {
  if (player.plantRemaining > 0 || player.plantCooldown > 0) return;
  player.plantRemaining = FEEL_RULES.plantDuration;
  player.plantCooldown = FEEL_RULES.plantCooldownDuration;
  player.plantTurnSign = Math.sign(turnDelta) || 1;
  player.plantedFoot = player.plantTurnSign < 0 ? "left" : "right";
}

function updateFacing(player, desired, dt) {
  if (!desired.magnitude) return;
  const target = Math.atan2(desired.y, desired.x);
  player.desiredFacing = target;
  const delta = shortestAngleDelta(player.facing, target);
  player.turnDeltaDegrees = Math.abs(delta) / DEG;
  const speedRatio = clamp(player.speed / FEEL_RULES.rapidSpeed, 0, 1);
  const turnRate = FEEL_RULES.lowSpeedTurnDegreesPerSecond
    + (FEEL_RULES.bodyTurnDegreesPerSecond - FEEL_RULES.lowSpeedTurnDegreesPerSecond) * speedRatio;
  player.facing = rotateToward(player.facing, target, turnRate * DEG * dt);
}

function updateMotion(player, input, dt) {
  const desired = normalize(input.moveX ?? 0, input.moveY ?? 0);
  player.inputMagnitude = desired.magnitude;
  player.rapid = Boolean(input.rapidHeld);
  if (player.plantCooldown > 0) player.plantCooldown = Math.max(0, player.plantCooldown - dt);

  if (desired.magnitude > 0) {
    const targetAngle = Math.atan2(desired.y, desired.x);
    const turnDelta = shortestAngleDelta(player.facing, targetAngle);
    const turnDegrees = Math.abs(turnDelta) / DEG;
    if (
      player.speed >= FEEL_RULES.sharpTurnMinSpeed
      && turnDegrees >= FEEL_RULES.sharpTurnDegrees
      && player.plantRemaining <= 0
      && player.plantCooldown <= 0
    ) triggerPlant(player, turnDelta);
  }

  updateFacing(player, desired, dt);
  if (player.plantRemaining > 0) player.plantRemaining = Math.max(0, player.plantRemaining - dt);

  const baseMax = FEEL_RULES.rapidSpeed * (player.rapid ? 1 : FEEL_RULES.normalPaceScale);
  const plantScale = player.plantRemaining > 0 ? FEEL_RULES.plantSpeedScale : 1;
  const targetSpeed = desired.magnitude * baseMax * plantScale;
  const currentSpeed = Math.hypot(player.vx, player.vy);
  const acceleration = targetSpeed > currentSpeed ? FEEL_RULES.acceleration : FEEL_RULES.deceleration;
  const nextSpeed = approach(currentSpeed, targetSpeed, acceleration * dt);

  if (desired.magnitude > 0.01) {
    const moveAngle = player.plantRemaining > 0 ? player.facing : Math.atan2(desired.y, desired.x);
    const desiredVx = Math.cos(moveAngle) * nextSpeed;
    const desiredVy = Math.sin(moveAngle) * nextSpeed;
    const response = player.plantRemaining > 0 ? 0.30 : 0.38;
    player.vx += (desiredVx - player.vx) * response;
    player.vy += (desiredVy - player.vy) * response;
  } else {
    const speed = Math.hypot(player.vx, player.vy);
    const next = Math.max(0, speed - FEEL_RULES.deceleration * dt);
    const ratio = speed > 0.001 ? next / speed : 0;
    player.vx *= ratio;
    player.vy *= ratio;
  }

  player.speed = Math.hypot(player.vx, player.vy);
  player.x = clamp(player.x + player.vx * dt, PITCH.inset + 36, PITCH.width - PITCH.inset - 36);
  player.y = clamp(player.y + player.vy * dt, PITCH.inset + 36, PITCH.height - PITCH.inset - 36);

  const speedRatio = clamp(player.speed / FEEL_RULES.rapidSpeed, 0, 1);
  const gaitFrequency = FEEL_RULES.gaitMinFrequency
    + (FEEL_RULES.gaitMaxFrequency - FEEL_RULES.gaitMinFrequency) * speedRatio;
  if (player.speed > 8 && player.plantRemaining <= 0) {
    player.gaitPhase = (player.gaitPhase + gaitFrequency * dt * Math.PI * 2) % (Math.PI * 2);
    player.plantedFoot = Math.cos(player.gaitPhase) >= 0 ? "left" : "right";
  }

  if (player.plantRemaining > 0) player.mode = "plant";
  else if (desired.magnitude < 0.04 && player.speed > 12) player.mode = "brake";
  else if (player.speed <= 8) player.mode = "idle";
  else if (player.rapid) player.mode = "rapid";
  else player.mode = "run";
}

function updateCamera(state, dt) {
  const player = state.player;
  const speed = Math.hypot(player.vx, player.vy);
  const dir = speed > 4 ? normalize(player.vx, player.vy) : { x: Math.cos(player.facing), y: Math.sin(player.facing) };
  const targetX = player.x + dir.x * FEEL_RULES.cameraLead;
  const targetY = player.y + dir.y * FEEL_RULES.cameraLead * 0.55;
  const dx = targetX - state.camera.x;
  const dy = targetY - state.camera.y;
  const moveX = Math.abs(dx) <= FEEL_RULES.cameraDeadX ? 0 : dx - Math.sign(dx) * FEEL_RULES.cameraDeadX;
  const moveY = Math.abs(dy) <= FEEL_RULES.cameraDeadY ? 0 : dy - Math.sign(dy) * FEEL_RULES.cameraDeadY;
  const alpha = 1 - Math.exp(-FEEL_RULES.cameraResponse * dt);
  state.camera.x += moveX * alpha;
  state.camera.y += moveY * alpha;
  const halfW = VIEWPORT.width / 2;
  const halfH = VIEWPORT.height / 2;
  state.camera.x = clamp(state.camera.x, halfW, PITCH.width - halfW);
  state.camera.y = clamp(state.camera.y, halfH, PITCH.height - halfH);
}

export function stepPlayerFeel(state, input = {}, dt = FEEL_RULES.fixedStep) {
  const safeDt = clamp(dt, 0, 0.05);
  state.elapsed += safeDt;
  updateMotion(state.player, input, safeDt);
  updateCamera(state, safeDt);
  state.lastEvent = state.player.mode;
  return state;
}

export function mannequinPose(state) {
  const p = state.player;
  const speedRatio = clamp(p.speed / FEEL_RULES.rapidSpeed, 0, 1);
  const forward = { x: Math.cos(p.facing), y: Math.sin(p.facing) };
  const right = { x: -forward.y, y: forward.x };
  const stride = FEEL_RULES.gaitStride * (0.38 + speedRatio * 0.62);
  const width = FEEL_RULES.gaitWidth;
  const swing = Math.sin(p.gaitPhase);
  let leftForward = swing * stride;
  let rightForward = -swing * stride;
  let leftSide = -width;
  let rightSide = width;

  if (p.mode === "idle") {
    leftForward = -2;
    rightForward = 2;
  } else if (p.mode === "brake") {
    leftForward = -11;
    rightForward = -5;
    leftSide = -13;
    rightSide = 13;
  } else if (p.mode === "plant") {
    if (p.plantedFoot === "left") {
      leftForward = -12;
      leftSide = -19;
      rightForward = 8;
      rightSide = 8;
    } else {
      rightForward = -12;
      rightSide = 19;
      leftForward = 8;
      leftSide = -8;
    }
  }

  const foot = (forwardOffset, sideOffset) => ({
    x: p.x + forward.x * forwardOffset + right.x * sideOffset,
    y: p.y + forward.y * forwardOffset + right.y * sideOffset,
  });
  const leftFoot = foot(leftForward, leftSide);
  const rightFoot = foot(rightForward, rightSide);
  const hip = { x: p.x, y: p.y };
  const knee = (footPoint, side) => ({
    x: hip.x * 0.42 + footPoint.x * 0.58 + right.x * side * 3,
    y: hip.y * 0.42 + footPoint.y * 0.58 + right.y * side * 3,
  });
  const lean = speedRatio * (p.rapid ? 8 : 5);
  const torso = { x: p.x + forward.x * (5 + lean), y: p.y + forward.y * (5 + lean) };
  const head = { x: p.x + forward.x * (19 + lean), y: p.y + forward.y * (19 + lean) };

  return {
    forward,
    right,
    hip,
    torso,
    head,
    leftFoot,
    rightFoot,
    leftKnee: knee(leftFoot, -1),
    rightKnee: knee(rightFoot, 1),
    plantedFoot: p.plantedFoot,
    speedRatio,
  };
}

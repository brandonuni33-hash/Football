import { CAMERA_DEFAULTS, LAB_RULES, PITCH, clamp, normalize } from "./constants.js";

export const TEAM = Object.freeze({ HOME: "home", AWAY: "away" });
export const CONTROLLED_ID = "home-8";

const HOME_FORMATION = [
  ["home-1", 1, "GK", 126, 544],
  ["home-2", 2, "RB", 350, 170],
  ["home-4", 4, "RCB", 350, 420],
  ["home-5", 5, "LCB", 350, 668],
  ["home-3", 3, "LB", 350, 918],
  ["home-6", 6, "DM", 610, 300],
  ["home-8", 8, "CM", 650, 544],
  ["home-10", 10, "AM", 610, 788],
  ["home-7", 7, "RW", 920, 245],
  ["home-9", 9, "ST", 965, 544],
  ["home-11", 11, "LW", 920, 843],
];

function mirror(entry) {
  const [id, number, role, x, y] = entry;
  return [id.replace("home", "away"), number, role, PITCH.width - x, PITCH.height - y];
}

function playerFrom(entry, team) {
  const [id, number, role, x, y] = entry;
  const facingX = team === TEAM.HOME ? 1 : -1;
  return {
    id, number, role, team, x, y, originX: x, originY: y,
    vx: 0, vy: 0,
    // facing = torso/body orientation; headFacing = gaze/head orientation.
    facingX,
    facingY: 0,
    headFacingX: facingX,
    headFacingY: 0,
    controlled: id === CONTROLLED_ID,
  };
}

export function createLabState() {
  const home = HOME_FORMATION.map((entry) => playerFrom(entry, TEAM.HOME));
  const away = HOME_FORMATION.map(mirror).map((entry) => playerFrom(entry, TEAM.AWAY));
  const players = [...home, ...away];
  const controlled = players.find((player) => player.id === CONTROLLED_ID);
  return {
    elapsed: 0,
    players,
    controlledId: CONTROLLED_ID,
    ball: {
      x: controlled.x + LAB_RULES.ballOffset,
      y: controlled.y,
      vx: 0,
      vy: 0,
    },
  };
}

export function getControlledPlayer(state) {
  return state.players.find((player) => player.id === state.controlledId) ?? null;
}

function shortestAngleDelta(from, to) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function rotateVectorToward(currentX, currentY, targetX, targetY, degreesPerSecond, dt) {
  const target = normalize(targetX, targetY);
  if (target.magnitude <= 0) return normalize(currentX, currentY);
  const current = normalize(currentX, currentY);
  const currentAngle = current.magnitude > 0 ? Math.atan2(current.y, current.x) : Math.atan2(target.y, target.x);
  const targetAngle = Math.atan2(target.y, target.x);
  const maxTurn = degreesPerSecond * Math.PI / 180 * Math.max(0, dt);
  const delta = shortestAngleDelta(currentAngle, targetAngle);
  const nextAngle = currentAngle + clamp(delta, -maxTurn, maxTurn);
  return { x: Math.cos(nextAngle), y: Math.sin(nextAngle), magnitude: 1 };
}

export function rotateFacingToward(player, targetX, targetY, dt = 1 / 60) {
  const next = rotateVectorToward(
    player.facingX,
    player.facingY,
    targetX,
    targetY,
    LAB_RULES.bodyTurnDegreesPerSecond,
    dt,
  );
  if (next.magnitude > 0) {
    player.facingX = next.x;
    player.facingY = next.y;
  }
  return player;
}

function clampHeadToBody(player) {
  const body = normalize(player.facingX, player.facingY);
  const head = normalize(player.headFacingX, player.headFacingY);
  if (body.magnitude <= 0 || head.magnitude <= 0) return player;

  const bodyAngle = Math.atan2(body.y, body.x);
  const headAngle = Math.atan2(head.y, head.x);
  const halfRange = (CAMERA_DEFAULTS.headScanDegrees / 2) * Math.PI / 180;
  const relative = clamp(shortestAngleDelta(bodyAngle, headAngle), -halfRange, halfRange);
  const limited = bodyAngle + relative;
  player.headFacingX = Math.cos(limited);
  player.headFacingY = Math.sin(limited);
  return player;
}

export function rotateHeadToward(player, targetX, targetY, dt = 1 / 60, returning = false) {
  const speed = returning ? LAB_RULES.headReturnDegreesPerSecond : LAB_RULES.headTurnDegreesPerSecond;
  const next = rotateVectorToward(
    player.headFacingX,
    player.headFacingY,
    targetX,
    targetY,
    speed,
    dt,
  );
  if (next.magnitude > 0) {
    player.headFacingX = next.x;
    player.headFacingY = next.y;
  }
  return clampHeadToBody(player);
}

function capVector(x, y, maxMagnitude) {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= maxMagnitude || magnitude <= 0.0001) return { x, y };
  const scale = maxMagnitude / magnitude;
  return { x: x * scale, y: y * scale };
}

export function updateControlledBall(state, player, move, magnitude, dt) {
  const ball = state.ball;
  const safeDt = Math.max(0, dt);

  if (magnitude > 0.08) {
    const targetX = player.x + move.x * LAB_RULES.ballLeadDistance;
    const targetY = player.y + move.y * LAB_RULES.ballLeadDistance;
    const desiredVx = player.vx + (targetX - ball.x) * LAB_RULES.ballGuideResponse;
    const desiredVy = player.vy + (targetY - ball.y) * LAB_RULES.ballGuideResponse;
    const alpha = 1 - Math.exp(-LAB_RULES.ballVelocityResponse * safeDt);
    ball.vx += (desiredVx - ball.vx) * alpha;
    ball.vy += (desiredVy - ball.vy) * alpha;
  } else {
    const damping = Math.exp(-LAB_RULES.ballFreeFriction * safeDt);
    ball.vx *= damping;
    ball.vy *= damping;
  }

  const cappedVelocity = capVector(ball.vx, ball.vy, LAB_RULES.ballMaxSpeed);
  ball.vx = cappedVelocity.x;
  ball.vy = cappedVelocity.y;
  ball.x += ball.vx * safeDt;
  ball.y += ball.vy * safeDt;

  // Keep the ball controllable without welding it back to a fixed foot point.
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const distance = Math.hypot(dx, dy);
  if (distance > LAB_RULES.ballControlRadius) {
    const nx = dx / distance;
    const ny = dy / distance;
    const allowedX = player.x + nx * LAB_RULES.ballControlRadius;
    const allowedY = player.y + ny * LAB_RULES.ballControlRadius;
    const recovery = 1 - Math.exp(-LAB_RULES.ballRecoveryResponse * safeDt);
    ball.x += (allowedX - ball.x) * recovery;
    ball.y += (allowedY - ball.y) * recovery;
  }

  ball.x = clamp(ball.x, PITCH.inset + 8, PITCH.width - PITCH.inset - 8);
  ball.y = clamp(ball.y, PITCH.inset + 8, PITCH.height - PITCH.inset - 8);
}

function roleMotion(role) {
  if (role === "GK") return { xAmp: 20, yAmp: 38, line: 0.22, speed: 0.42 };
  if (role === "RB" || role === "LB") return { xAmp: 62, yAmp: 72, line: 0.58, speed: 0.54 };
  if (role === "RCB" || role === "LCB") return { xAmp: 48, yAmp: 48, line: 0.52, speed: 0.46 };
  if (role === "DM") return { xAmp: 74, yAmp: 68, line: 0.72, speed: 0.58 };
  if (role === "CM") return { xAmp: 88, yAmp: 78, line: 0.80, speed: 0.64 };
  if (role === "AM") return { xAmp: 104, yAmp: 82, line: 0.90, speed: 0.68 };
  if (role === "RW" || role === "LW") return { xAmp: 118, yAmp: 92, line: 1.00, speed: 0.72 };
  if (role === "ST") return { xAmp: 126, yAmp: 66, line: 1.04, speed: 0.76 };
  return { xAmp: 70, yAmp: 60, line: 0.75, speed: 0.60 };
}

function updateReferencePlayers(state, controlled, dt) {
  const ballShiftX = (state.ball.x - PITCH.width / 2) * LAB_RULES.teamShiftX;
  const ballShiftY = (state.ball.y - PITCH.height / 2) * LAB_RULES.teamShiftY;
  const safeDt = Math.max(0, dt);

  for (const other of state.players) {
    if (other.id === controlled.id) continue;
    const motion = roleMotion(other.role);
    const teamPhase = other.team === TEAM.AWAY ? Math.PI * 0.7 : 0;
    const seed = other.number * 0.61 + teamPhase;
    const phase = state.elapsed * motion.speed + seed;
    const counterPhase = state.elapsed * (motion.speed * 0.73) + seed * 1.37;

    const targetX = clamp(
      other.originX + ballShiftX * motion.line + Math.sin(phase) * motion.xAmp,
      PITCH.inset + 26,
      PITCH.width - PITCH.inset - 26,
    );
    const targetY = clamp(
      other.originY + ballShiftY * motion.line + Math.cos(counterPhase) * motion.yAmp,
      PITCH.inset + 26,
      PITCH.height - PITCH.inset - 26,
    );

    const alpha = 1 - Math.exp(-LAB_RULES.teamMoveResponse * safeDt);
    let stepX = (targetX - other.x) * alpha;
    let stepY = (targetY - other.y) * alpha;
    const cappedStep = capVector(stepX, stepY, LAB_RULES.teamMaxSpeed * safeDt);
    stepX = cappedStep.x;
    stepY = cappedStep.y;

    other.vx = safeDt > 0 ? stepX / safeDt : 0;
    other.vy = safeDt > 0 ? stepY / safeDt : 0;
    other.x += stepX;
    other.y += stepY;

    if (Math.hypot(other.vx, other.vy) > 4) {
      const nextFacing = rotateVectorToward(
        other.facingX,
        other.facingY,
        other.vx,
        other.vy,
        LAB_RULES.bodyTurnDegreesPerSecond,
        safeDt,
      );
      other.facingX = nextFacing.x;
      other.facingY = nextFacing.y;
      other.headFacingX = nextFacing.x;
      other.headFacingY = nextFacing.y;
    }
  }
}

export function stepLabState(state, input = {}, dt = 1 / 60) {
  const player = getControlledPlayer(state);
  if (!player) return state;
  const safeDt = Math.max(0, dt);
  state.elapsed += safeDt;

  const move = normalize(input.moveX, input.moveY);
  const magnitude = move.magnitude < LAB_RULES.movementDeadzone ? 0 : move.magnitude;
  player.vx = move.x * LAB_RULES.controlledSpeed * magnitude;
  player.vy = move.y * LAB_RULES.controlledSpeed * magnitude;
  player.x = clamp(player.x + player.vx * safeDt, PITCH.inset + 24, PITCH.width - PITCH.inset - 24);
  player.y = clamp(player.y + player.vy * safeDt, PITCH.inset + 24, PITCH.height - PITCH.inset - 24);

  if (magnitude > 0.08) rotateFacingToward(player, move.x, move.y, safeDt);

  const scan = normalize(input.scanX, input.scanY);
  const scanning = scan.magnitude >= CAMERA_DEFAULTS.scanDeadzone;
  if (scanning) rotateHeadToward(player, scan.x, scan.y, safeDt, false);
  else rotateHeadToward(player, player.facingX, player.facingY, safeDt, true);

  updateControlledBall(state, player, move, magnitude, safeDt);
  updateReferencePlayers(state, player, safeDt);
  return state;
}
